import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import crypto from "https://esm.sh/crypto-js@4.1.1";

// 🔵 Fonction pour notifier Make.com
async function notifyMakeWebhook(payer_email: string, visitor_uuid: string, transaction_id: string, amount: number) {
  try {
    await fetch('https://hook.us1.make.com/72rmijhq6prsglukc5eo97aouahdrs9w', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: payer_email,
    transaction_id,
    amount
  }),
});

    console.log('📨 Notification envoyée à Make.com avec email + uuid + transaction_id');
  } catch (error) {
    console.error('❌ Erreur en envoyant la notification à Make.com:', error);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req.headers.get("origin")) });
  }

  try {
    console.log("📩 BMC webhook received");

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const rawBody = await req.text();
    const signature = req.headers.get("x-signature-sha256");
    const secret = Deno.env.get("BMC_SECRET") || '';

    const calculated_signature = crypto.HmacSHA256(rawBody, secret).toString();

    if (calculated_signature !== signature) {
      console.error("❌ Invalid signature");
      return new Response("Unauthorized", { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const pre_payment_uuid = body.data?.pre_payment_uuid || null;
    const { supporter_email: payer_email, amount, transaction_id } = body.data || {}; // 🔵 déplacé ici
    console.log("🧾 pre_payment_uuid received from BMC:", pre_payment_uuid);
    console.log("📦 Full Raw BMC body:", body);

    // ✅ Vérifie que le montant est suffisant (minimum $5)
if (typeof amount !== 'number' || amount < 5) {
  console.warn(`⚠️ Payment too low: $${amount}. Premium not granted.`);
  return new Response("Payment amount too low. Minimum $5 required for Premium access.", { status: 200 });
}


    if (!payer_email || !amount || !transaction_id) {
      console.error("❌ Missing required fields");
      return new Response("Invalid data", { status: 400 });
    }

    let visitor_uuid = null;

    if (pre_payment_uuid) {
      console.log("🔍 Searching visitor_uuid in pre_payments using pre_payment_uuid:", pre_payment_uuid);

      const { data: prePayment, error: prePaymentError } = await supabase
        .from('pre_payments')
        .select('visitor_uuid')
        .eq('id', pre_payment_uuid)
        .maybeSingle();

      if (prePaymentError) {
        console.error("❌ Error fetching from pre_payments:", prePaymentError);
      } else if (prePayment?.visitor_uuid) {
        visitor_uuid = prePayment.visitor_uuid;
        console.log("✅ visitor_uuid found via pre_payments:", visitor_uuid);
      }
    }

    if (payer_email) {
      console.log('🔎 Searching visitor_uuid in pre_payments table using payer_email:', payer_email);

      const { data: prePaymentData, error: prePaymentError } = await supabase
        .from('pre_payments')
        .select('visitor_uuid')
        .eq('email', payer_email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (prePaymentError) {
        console.error('❌ Error fetching from pre_payments by email:', prePaymentError);
      } else if (prePaymentData?.visitor_uuid) {
        visitor_uuid = prePaymentData.visitor_uuid;
        console.log('✅ Found visitor_uuid from pre_payments by email:', visitor_uuid);
      } else {
        console.warn('⚠️ No visitor_uuid found in pre_payments for this email.');
      }
    }

    if (!visitor_uuid) {
      console.warn('⚠️ No visitor_uuid could be found, fallback to null.');
    }

    console.log("🔍 Final visitor_uuid value:", visitor_uuid);

    // ✅ Met à jour la ligne pre_payments avec le email après avoir trouvé le visitor_uuid
if (visitor_uuid && payer_email) {
  const { error: updateError } = await supabase
    .from('pre_payments')
    .update({ email: payer_email })
    .eq('visitor_uuid', visitor_uuid);

  if (updateError) {
    console.error("❌ Failed to update pre_payments with email:", updateError);
  } else {
    console.log("✅ Email successfully linked to visitor_uuid in pre_payments:", visitor_uuid);
  }
}

    const { data: existingSupport } = await supabase
      .from('supporters')
      .select('id')
      .eq('transaction_id', transaction_id)
      .maybeSingle();

    if (existingSupport) {
      console.log("⚠️ Duplicate transaction detected:", transaction_id);
      return new Response("Transaction already processed", { status: 200 });
    }

    console.log("📝 Preparing to insert new supporter record:", {
      email: payer_email,
      amount,
      transaction_id,
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
        visitor_uuid: visitor_uuid || null,
        support_status: 'active',
        support_date: new Date().toISOString(),
        metadata: {
          platform: 'buymeacoffee',
          verified_at: new Date().toISOString()
        }
      }]);

    if (insertError) {
      console.error("❌ Error inserting supporter:", insertError);
      return new Response("Database error", { status: 500 });
    }

    console.log("✅ Supporter inserted successfully!");

   try {
  await notifyMakeWebhook(payer_email, visitor_uuid || 'null', transaction_id, amount);
} catch (error) {
  console.error('⚠️ Failed to notify Make.com:', error);
}
 
    return new Response("Success", {
  status: 200,
  headers: {
    ...getCorsHeaders(req.headers.get("origin")),
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
