import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("📥 BMC webhook received");
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const rawBody = await req.text();
    const signature = req.headers.get("x-signature-sha256");
    const secret = Deno.env.get("BMC_SECRET") || '';

    // Verify signature
    const crypto = await import("https://deno.land/std@0.177.0/crypto/mod.ts");
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature_array = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(rawBody)
    );
    const calculated_signature = Array.from(new Uint8Array(signature_array))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (calculated_signature !== signature) {
      console.error("❌ Invalid signature");
      return new Response("Unauthorized", { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const { payer_email, amount, transaction_id } = body.data || {};
    const ip_address = req.headers.get("cf-connecting-ip") || 
                      req.headers.get("x-forwarded-for")?.split(",")[0] || 
                      null;

    console.log("📦 Webhook data:", { payer_email, amount, transaction_id, ip_address });

    if (!payer_email || !amount || !transaction_id) {
      console.error("❌ Missing required fields");
      return new Response("Invalid data", { status: 400 });
    }

    // Find visitor UUID from ip_searches
    const { data: ipSearch } = await supabase
      .from('ip_searches')
      .select('uuid')
      .eq('ip_address', ip_address)
      .order('last_search', { ascending: false })
      .limit(1)
      .single();

    const visitor_uuid = ipSearch?.uuid;
    console.log("🔍 Found visitor UUID:", visitor_uuid);

    // Check for existing transaction
    const { data: existingSupport } = await supabase
      .from('supporters')
      .select('id')
      .eq('transaction_id', transaction_id)
      .single();

    if (existingSupport) {
      console.log("⚠️ Duplicate transaction:", transaction_id);
      return new Response("Transaction already processed", { status: 200 });
    }

    // Insert supporter record
    const { error: insertError } = await supabase
      .from('supporters')
      .insert([{
        email: payer_email,
        amount,
        transaction_id,
        verified: true,
        unlimited_searches: true,
        ip_address,
        visitor_uuid,
        support_type: 'bmc',
        support_status: 'active',
        support_date: new Date().toISOString(),
        metadata: {
          platform: 'buymeacoffee',
          verified_at: new Date().toISOString()
        }
      }]);

    if (insertError) {
      console.error("❌ Insert error:", insertError);
      return new Response("Database error", { status: 500 });
    }

    // Send confirmation to Make.com for email
    if (visitor_uuid) {
      try {
        await fetch("https://hook.us1.make.com/cywd3qzow6ha9b5r3hlhnljbx4dktvo4", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: payer_email,
            uuid: visitor_uuid,
            transaction_id,
            redirect_url: `https://ezstreamto.com/premium-success?uuid=${visitor_uuid}`
          })
        });
      } catch (error) {
        console.error("⚠️ Make.com webhook failed:", error);
        // Non-blocking error
      }
    }

    console.log("✅ Support record created successfully");
    return new Response("Success", { 
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error("❌ Server error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }), 
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});