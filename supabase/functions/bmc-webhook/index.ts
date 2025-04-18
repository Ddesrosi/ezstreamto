import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import crypto from "https://esm.sh/crypto-js@4.1.1";

serve(async (req) => {
  try {
    const rawBody = await req.text();
    const secret = Deno.env.get("BMC_SECRET") || "";
    const signature = req.headers.get("x-signature-sha256");

    // Configuration Check
    if (!secret) {
      console.error(JSON.stringify({
        code: "BMC_SECRET_MISSING",
        message: "BMC_SECRET environment variable is not set.",
        severity: "CRITICAL"
      }));
      return new Response("Server error", { status: 500 });
    }

    // Signature Verification
    if (!signature) {
      console.error(JSON.stringify({
        code: "SIGNATURE_MISSING",
        message: "X-Signature-SHA256 header is missing.",
        severity: "ERROR"
      }));
      return new Response("Unauthorized", { status: 401 });
    }

    const hash = crypto.HmacSHA256(rawBody, secret).toString();
    if (hash !== signature) {
      console.error(JSON.stringify({
        code: "SIGNATURE_INVALID",
        message: "Invalid BMC signature.",
        receivedSignature: signature,
        calculatedSignature: hash,
        severity: "ERROR"
      }));
      return new Response("Unauthorized", { status: 401 });
    }

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (parseError) {
      console.error(JSON.stringify({
        code: "PAYLOAD_PARSE_ERROR",
        message: "Failed to parse raw body as JSON.",
        error: parseError.message,
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

    // Payload Validation
    if (!email || !amount || !transaction_id) {
      console.error(JSON.stringify({
        code: "PAYLOAD_MISSING_FIELDS",
        message: "Missing essential fields in payload.",
        missingFields: { email: !email, amount: !amount, transaction_id: !transaction_id },
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

    let ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
    let visitor_uuid = null;

    // IP Lookup
    if (ip) {
      try {
        const { data: ipMatch, error: ipError } = await supabase
          .from("ip_searches")
          .select("id")
          .eq("ip_address", ip)
          .maybeSingle();

        if (ipError) {
          console.error(JSON.stringify({
            code: "IP_LOOKUP_ERROR",
            message: "Error looking up visitor_uuid from ip_searches.",
            dbError: ipError.message,
            ip: ip,
            severity: "WARNING"
          }));
        }

        visitor_uuid = ipMatch?.id || null;

        console.log(JSON.stringify({
          code: "IP_LOOKUP_RESULT",
          message: "Result of lookup from ip_searches.",
          ip: ip,
          visitor_uuid: visitor_uuid,
          query: `SELECT id FROM ip_searches WHERE ip_address = '${ip}'` // Log the query
        }));
      } catch (ipLookupError) {
        console.error(JSON.stringify({
          code: "IP_LOOKUP_FAILED",
          message: "Failed to lookup IP address in ip_searches.",
          ip: ip,
          error: ipLookupError.message,
          severity: "WARNING"
        }));
      }
    }

    // Check for existing transaction ID
    const { data: existingSupport, error: existingSupportError } = await supabase
      .from('supporters')
      .select('id')
      .eq('transaction_id', transaction_id)
      .maybeSingle();

    if (existingSupportError) {
      console.error(JSON.stringify({
        code: "TRANSACTION_CHECK_ERROR",
        message: "Error checking for existing transaction ID.",
        transactionId: transaction_id,
        dbError: existingSupportError.message,
        severity: "WARNING"
      }));
    }

    if (existingSupport) {
      console.warn(JSON.stringify({
        code: "DUPLICATE_TRANSACTION",
        message: "Duplicate transaction ID found. Skipping insertion.",
        transactionId: transaction_id,
        severity: "WARNING"
      }));
      return new Response("Transaction already processed", { status: 200 });
    }

    // Database Insertion
    try {
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
          visitor_uuid: visitor_uuid,
          metadata: {
            platform: 'buymeacoffee',
            supporter_name: supporter_name || null,
            message: message || null,
            verified_at: new Date().toISOString()
          }
        },
      ]);

      if (error) {
        console.error(JSON.stringify({
          code: "DB_INSERT_ERROR",
          message: "Supabase insert error.",
          dbError: error.message,
          severity: "ERROR"
        }));
        return new Response("Database error", { status: 500 });
      }

      console.log(JSON.stringify({
        code: "SUPPORT_RECORD_CREATED",
        message: "Successfully created support record.",
        transactionId: transaction_id,
        email: email,
        amount: amount,
        visitor_uuid: visitor_uuid
      }));
      return new Response("Success", { status: 200 });

    } catch (dbError) {
      console.error(JSON.stringify({
        code: "UNEXPECTED_DB_ERROR",
        message: "Unexpected database error.",
        dbError: dbError.message,
        severity: "CRITICAL"
      }));
      return new Response("Database error", { status: 500 });
    }

  } catch (err) {
    console.error(JSON.stringify({
      code: "UNEXPECTED_SERVER_ERROR",
      message: "Unexpected server error.",
      error: err.message,
      severity: "CRITICAL"
    }));
    return new Response("Server error", { status: 500 });
  }
});
