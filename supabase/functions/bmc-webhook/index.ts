import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import crypto from "https://esm.sh/crypto-js@4.1.1";

// 🔵 Fonction pour notifier Make.com
async function notifyMakeWebhook(visitor_uuid: string) {
  try {
    await fetch('https://hook.us1.make.com/72rmijhq6prsglukc5eo97aouahdrs9w', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitor_uuid }),
    });
    console.log('📨 Notification envoyée à Make.com avec visitor_uuid:', visitor_uuid);
  } catch (error) {
    console.error('❌ Erreur en envoyant la notification à Make.com:', error);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("\ud83d\udce5 BMC webhook received");

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const rawBody = await req.text();
    const signature = req.headers.get("x-signature-sha256");
    const secret = Deno.env.get("BMC_SECRET") || '';

    const calculated_signature = crypto.HmacSHA256(rawBody, secret).toString();

    if (calculated_signature !== signature) {
      console.error("\u274c Invalid signature");
      return new Response("Unauthorized", { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const pre_payment_uuid = body.data?.pre_payment_uuid || null;
    console.log("🧾 pre_payment_uuid received from BMC:", pre_payment_uuid);
    const { supporter_email: payer_email, amount, transaction_id } = body.data || {};
    const ip_address = req.headers.get("cf-connecting-ip") ||
                   req.headers.get("x-forwarded-for")?.split(",")[0] ||
                   null;
   let visitor_uuid = null;

if (pre_payment_uuid) {
  console.log('🔎 Searching pre_payments table for visitor_uuid using pre_payment_uuid:', pre_payment_uuid);

  const { data: prePayment } = await supabase
    .from('pre_payments')
    .select('visitor_uuid')
    .eq('visitor_uuid', pre_payment_uuid)
    .maybeSingle();

  if (prePayment?.visitor_uuid) {
    visitor_uuid = prePayment.visitor_uuid;
    console.log('✅ Visitor UUID found via pre_payments table:', visitor_uuid);
  } else {
    console.warn('⚠️ No matching visitor_uuid found in pre_payments for pre_payment_uuid:', pre_payment_uuid);
  }
}

    console.log("🌍 IP address used for lookup:", ip_address);

   console.log("📦 Full Raw BMC body:", body);
 
    if (!payer_email || !amount || !transaction_id) {
      console.error("\u274c Missing required fields");
      return new Response("Invalid data", { status: 400 });
    }

    console.log("🔍 Executing UUID lookup in ip_searches for IP:", ip_address);
    
  if (pre_payment_uuid) {
  const { data: prePaymentData, error: prePaymentError } = await supabase
    .from('pre_payments')
    .select('visitor_uuid')
    .eq('id', pre_payment_uuid)
    .single();

  if (prePaymentData?.visitor_uuid) {
    visitor_uuid = prePaymentData.visitor_uuid;
    console.log('✅ Found visitor_uuid from pre_payments:', visitor_uuid);
  } else {
    console.warn('⚠️ No visitor_uuid found in pre_payments for ID:', pre_payment_uuid);
  }
}

if (!visitor_uuid) {
  console.warn("⚠️ No visitor UUID found from page_views or ip_searches. Attempting fallback...");

  if (body?.pre_payment_uuid) {
    console.log("🧾 Fallback: using pre_payment_uuid:", body.pre_payment_uuid);
    visitor_uuid = body.pre_payment_uuid;
  } else {
    console.warn("❌ No fallback UUID available.");
  }
}

    console.log("\ud83d\udd0d Found visitor UUID:", visitor_uuid);

    const { data: existingSupport } = await supabase
      .from('supporters')
      .select('id')
      .eq('transaction_id', transaction_id)
      .single();

    if (existingSupport) {
      console.log("\u26a0\ufe0f Duplicate transaction:", transaction_id);
      return new Response("Transaction already processed", { status: 200 });
    }

    console.log("📝 Preparing to insert into supporters with values:", {
  email: payer_email,
  amount,
  transaction_id,
  ip_address,
  visitor_uuid
});

    console.log("📝 Preparing to insert into supporters with values:", {
  email: payer_email,
  amount,
  transaction_id,
  ip_address,
  visitor_uuid
});

   const { error: insertError } = await supabase
  .from('supporters')
  .insert([{
    email: payer_email,
    amount,
    transaction_id,
    verified: true,
    unlimited_searches: true,
    ip_address,
    visitor_uuid, // ✅ TRÈS IMPORTANT : insérer ici
    support_status: 'active',
    support_date: new Date().toISOString(),
    metadata: {
      platform: 'buymeacoffee',
      verified_at: new Date().toISOString()
    }
  }]);

    if (insertError) {
      console.error("\u274c Insert error:", insertError);
      return new Response("Database error", { status: 500 });
    }

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
        console.error("\u26a0\ufe0f Make.com webhook failed:", error);
      }
    }

    console.log("\u2705 Support record created successfully");
    return new Response("Success", {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error("\u274c Server error:", error);
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
