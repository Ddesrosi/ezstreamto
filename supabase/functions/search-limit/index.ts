import { serve } from 'https://deno.fresh.dev/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { corsHeaders } from '../_shared/cors.ts';

const FREE_LIMIT = 5;
const PREMIUM_LIMIT = 100;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { ip } = await req.json();

    console.log('🔍 Incoming request → IP:', ip);

    if (!ip) {
      throw new Error('IP address is required');
    }

    // ✅ Vérifie uniquement si verified = true et unlimited_search = true
    let isPremium = false;
    const { data: supporter } = await supabase
      .from('supporters')
      .select('verified, unlimited_search')
      .eq('ip_address', ip)
      .eq('verified', true)
      .eq('unlimited_search', true)
      .single();

    isPremium = !!supporter;

    const { data: searchRecord } = await supabase
      .from('ip_searches')
      .select('*')
      .eq('ip_address', ip)
      .single();

    const limit = isPremium ? PREMIUM_LIMIT : FREE_LIMIT;

    if (!searchRecord) {
      await supabase
        .from('ip_searches')
        .insert({
          ip_address: ip,
          search_count: 1,
          last_search: new Date().toISOString()
        });

      return new Response(
        JSON.stringify({
          canSearch: true,
          remaining: limit - 1,
          total: limit,
          isPremium
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (searchRecord.search_count >= limit) {
      return new Response(
        JSON.stringify({
          canSearch: false,
          remaining: 0,
          total: limit,
          isPremium,
          message: isPremium
            ? 'Premium search limit reached.'
            : 'You have used all your free searches. Support us to get unlimited access!'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await supabase
      .from('ip_searches')
      .update({
        search_count: searchRecord.search_count + 1,
        last_search: new Date().toISOString()
      })
      .eq('ip_address', ip);

    return new Response(
      JSON.stringify({
        canSearch: true,
        remaining: limit - (searchRecord.search_count + 1),
        total: limit,
        isPremium
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error in search-limit function:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An error occurred',
        canSearch: false
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
