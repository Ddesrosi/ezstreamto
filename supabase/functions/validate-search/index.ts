import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { corsHeaders } from '../_shared/cors.ts';

const LIFETIME_LIMIT = 5;

serve(async (req) => {
console.log("🧪 validate-search called");
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { ip, uuid, mode } = await req.json();

    if (!ip && !uuid) {
      throw new Error('IP address or UUID is required');
    }

    // Check if user has unlimited searches via IP or UUID
    const { data: supporter } = await supabase
      .from('supporters')
      .select('unlimited_searches')
      .or(`ip_address.eq.${ip},visitor_uuid.eq.${uuid}`)
      .eq('verified', true)
      .maybeSingle();

    if (supporter?.unlimited_searches) {
      return new Response(
        JSON.stringify({ 
          status: 'premium',
          canSearch: true,
          unlimited: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current search record
    const { data: searchRecord } = await supabase
      .from('ip_searches')
      .select('*')
      .eq('ip_address', ip)
      .maybeSingle();

    const currentCount = searchRecord?.search_count ?? 0;

    // If limit reached, block search
    if (currentCount >= LIFETIME_LIMIT) {
      return new Response(
        JSON.stringify({ 
          status: 'limit_reached',
          canSearch: false,
          remaining: 0,
          message: 'You have used all your free searches. Support us to get unlimited searches!'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If mode is 'check', return remaining count without increment
    if (mode === 'check') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          canSearch: true,
          remaining: LIFETIME_LIMIT - currentCount,
          total: LIFETIME_LIMIT
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Otherwise (mode === 'consume'), increment search count
    const newCount = currentCount + 1;
    await supabase
      .from('ip_searches')
      .upsert({ 
        ip_address: ip,
        search_count: newCount,
        last_search: new Date().toISOString()
      });

    return new Response(
      JSON.stringify({
        status: 'ok',
        canSearch: true,
        remaining: LIFETIME_LIMIT - newCount,
        total: LIFETIME_LIMIT
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'error',
        message: error instanceof Error ? error.message : 'An error occurred',
        canSearch: false
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
