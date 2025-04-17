import { supabase } from "@/lib/supabaseClient";
import crypto from "crypto";

// Function to verify BMC webhook signature
function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
    if (!signature || !secret) return false;
    const hash = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    return signature === hash;
}

// Function to validate support amount
function validateSupportAmount(amount: number): boolean {
    return amount >= 5; // Minimum support amount for premium
}

export async function POST(request: Request) {
    try {
        const secret = import.meta.env.VITE_BMC_SECRET || '';

        const rawBody = await request.text();
        const signature = request.headers.get("x-signature-sha256");

        console.log("📥 Received BMC webhook");

        if (!verifySignature(rawBody, signature, secret)) {
            console.error("❌ Invalid BMC signature");
            return new Response("Unauthorized", { status: 401 });
        }

        const body = JSON.parse(rawBody);
        const { payer_email, amount, transaction_id, ip_address } = body.data || {};

        if (!payer_email || !amount || !transaction_id) {
            console.error("❌ Missing required fields:", { payer_email, amount, transaction_id });
            return new Response("Invalid data", { status: 400 });
        }

        if (!validateSupportAmount(amount)) {
            console.error("❌ Invalid support amount:", amount);
            return new Response("Invalid support amount", { status: 400 });
        }

        console.log("✅ Processing BMC support:", {
            email: payer_email,
            amount,
            transaction_id,
            ip_address
        });

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

        const { error } = await supabase
            .from('supporters')
            .insert([{ 
                email: payer_email,
                amount,
                transaction_id,
                verified: true,
                unlimited_searches: true,
                ip_address: ip_address || null,
                support_type: 'bmc',
                support_status: 'active',
                support_date: new Date().toISOString(),
                metadata: {
                    platform: 'buymeacoffee',
                    verified_at: new Date().toISOString()
                }
            }]);

        if (error) {
            console.error("❌ Database error:", error);
            if (error.code === '23505') { // Unique violation
                return new Response("Transaction already processed", { status: 200 });
            }
            return new Response("Database error", { status: 500 });
        }

        console.log("✅ Support record created successfully");
        return new Response("Success", { status: 200 });
    } catch (error) {
        console.error("❌ Server error:", error);
        return new Response("Server error", { status: 500 });
    }
}
