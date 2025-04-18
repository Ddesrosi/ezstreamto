import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import crypto from "https://esm.sh/crypto-js@4.1.1";

serve(async (req) => {
  try {
    const rawBody = await req.text();

    // 🔓 Signature verification temporarily disabled for testing
    /*
    const secret = Deno.env.get("BMC_SECRET") || "";
    const signature = req.headers.get("x-signature-sha256");

    if (!signature || !secret) {
      console.error("❌ Missing signature or secret");
      return new Response("Unauthorized", { status: 401 });
    }

    const hash = crypto.HmacSHA256(rawBody, secret).toString();
    if (hash !== signature) {
      console.error("❌ Invalid signature");
      return new Response("Unauthorized", { status: 401 });
    }
    */

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (err) {
      console.error(JSON.stringify({
        code: "PAYLOAD_PARSE_ERROR",
        message: "Failed to parse body",
        error: err.message,
        severity: "ERROR"
      }));
      return new Response("Invalid data", { status: 400 });
    }

    const {
      supporter_email: email,
      amount,
      transaction_id,
      support_type,
      supporter_name,
      message,
    } = payload.data || {};

    if (!email || !amount || !transaction_id) {
      console.error(JSON.stringify({
        code: "PAYLOAD_MISSING_FIELDS",
        message: "Missing required fields",
        missing: {
          email: !email,
          amount: !amount,
          transaction_id: !transaction_id
        },
        severity: "ERROR"
      }));
      return new Response("Invalid data", { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null;

    let visitor_uuid = null;
    if (ip) {
      const { data: ipMatch, error: ipError } = await supabase
        .from("ip_searches")
        .select("id")
        .eq("ip_address", ip)
        .maybeSingle();

      if (ipError) {
        console.error(JSON.stringify({
          code: "IP_LOOKUP_ERROR",
          message: "Error looking up visitor_uuid from ip_searches",
          dbError: ipError.message,
          ip,
          severity: "WARNING"
        }));
      }

      visitor_uuid = ipMatch?.id || null;

      console.log(JSON.stringify({
        code: "IP_LOOKUP_RESULT",
        message: "Result of lookup from ip_searches",
        ip,
        ipMatch
      }));
    }

    const { error } = await supabase.from("supporters").insert([
      {
        email,
        amount,
        transaction_id,
        verified: true,
        unlimited_searches: true,
        support_status: support_type || null,
        support_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        visitor_uuid,
        metadata: {
          platform: "buymeacoffee",
          supporter_name: supporter_name || null,
          message: message || null,
          verified_at: new Date().toISOString()
        }
      },
    ]);

    if (error) {
      console.error(JSON.stringify({
        code: "DB_INSERT_ERROR",
        message: "Supabase insert error",
        dbError: error.message,
        severity: "ERROR"
      }));
      return new Response("Database error", { status: 500 });
    }

    console.log(JSON.stringify({
      code: "SUPPORT_RECORD_CREATED",
      message: "Support record inserted successfully",
      transaction_id,
      email,
      amount,
      visitor_uuid
    }));

    return new Response("✅ Success", { status: 200 });
  } catch (err) {
    console.error(JSON.stringify({
      code: "UNEXPECTED_ERROR",
      message: "Unexpected error occurred",
      error: err.message,
      severity: "CRITICAL"
    }));
    return new Response("Server error", { status: 500 });
  }
});
