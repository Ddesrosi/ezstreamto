console.log
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, transactionId, subscriptionType = 'monthly' } = await req.json();

    if (!userId || !transactionId) {
      throw new Error('User ID and transaction ID are required');
    }

    // Calculate expiration date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Create or update premium user record
    const { data, error } = await supabase
      .from('premium_users')
      .upsert({
        user_id: userId,
        subscription_type: subscriptionType,
        transaction_id: transactionId,
        starts_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        is_active: true
      }, {
        onConflict: 'user_id'
      });

    if (error) throw error;

    return new Response(
      JSON.stringify({
        status: 'success',
        data: {
          expiresAt,
          subscriptionType
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'error',
        message: error instanceof Error ? error.message : 'An error occurred'
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});