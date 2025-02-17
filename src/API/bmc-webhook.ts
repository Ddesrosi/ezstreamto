import { supabase } from "@/lib/supabaseClient";
import crypto from "crypto";

// Function to verify BMC webhook signature
function verifySignature(request: Request, secret: string): boolean {
    const signature = request.headers.get("x-signature-sha256");
    if (!signature) return false;
    
    if (!secret) {
        console.error('BMC secret is not configured');
        return false;
    }
    
    const rawBody = JSON.stringify(request.body);
    const hash = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

    return signature === hash;
}

export async function POST(request: Request) {
    try {
        // Verify the webhook signature
        const secret = import.meta.env.VITE_BMC_SECRET || '';
        if (!verifySignature(request, secret)) {
            return new Response("Unauthorized", { status: 401 });
        }

        const body = await request.json();
        const { payer_email, amount, transaction_id } = body.data || {};
        
        if (!payer_email || !amount || !transaction_id) {
            return new Response("Invalid data", { status: 400 });
        }

        // Add supporter and remove search limits
        const { data, error } = await supabase
            .from('supporters')
            .insert([{ 
                email: payer_email, 
                amount, 
                transaction_id, 
                verified: true,
                unlimited_searches: true
            }]);

        if (error) {
            return new Response("Database error", { status: 500 });
        }

        return new Response("Success", { status: 200 });
    } catch (error) {
        return new Response("Server error", { status: 500 });
    }
}