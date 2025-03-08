import { serve } from 'https://deno.fresh.dev/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { corsHeaders } from '../_shared/cors.ts';

const DAILY_LIMIT = 5;
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

    const { ip, userId } = await req.json();

    if (!ip) {
      throw new Error('IP address is required');
    }

    // Check if user is premium
    let isPremium = false;
    if (userId) {
      const { data: user } = await supabase
        .from('users')
        .select('is_premium')
        .eq('id', userId)
        .single();
      
      isPremium = user?.is_premium ?? false;
    }

    // Get or create search record
    const { data: searchRecord } = await supabase
      .from('ip_searches')
      .select('*')
      .eq('ip_address', ip)
      .single();

    const limit = isPremium ? PREMIUM_LIMIT : DAILY_LIMIT;

    if (!searchRecord) {
      // Create new record
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

    // Check if we need to reset daily count
    const lastSearchDate = new Date(searchRecord.last_search);
    const today = new Date();
    if (lastSearchDate.getUTCDate() !== today.getUTCDate() ||
        lastSearchDate.getUTCMonth() !== today.getUTCMonth() ||
        lastSearchDate.getUTCFullYear() !== today.getUTCFullYear()) {
      
      await supabase
        .from('ip_searches')
        .update({
          search_count: 1,
          last_search: today.toISOString()
        })
        .eq('ip_address', ip);

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

    // Check if limit reached
    if (searchRecord.search_count >= limit) {
      return new Response(
        JSON.stringify({
          canSearch: false,
          remaining: 0,
          total: limit,
          isPremium,
          message: isPremium 
            ? 'Premium search limit reached for today'
            : 'Daily search limit reached. Upgrade to premium for more searches!'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Increment search count
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