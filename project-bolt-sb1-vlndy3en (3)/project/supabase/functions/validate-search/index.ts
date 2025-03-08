import { serve } from 'https://deno.fresh.dev/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { corsHeaders } from '../_shared/cors.ts';

const DAILY_LIMIT = 5;

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

    if (!ip) {
      throw new Error('IP address is required');
    }

    // Check if user has unlimited searches
    const { data: supporter } = await supabase
      .from('supporters')
      .select('unlimited_searches')
      .eq('ip_address', ip)
      .eq('verified', true)
      .single();

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

    // Get or create search record
    const { data: searchRecord } = await supabase
      .from('ip_searches')
      .select('*')
      .eq('ip_address', ip)
      .single();

    // Reset daily searches if needed
    const now = new Date();
    const lastSearch = searchRecord ? new Date(searchRecord.last_search) : null;
    const needsReset = !lastSearch || 
      lastSearch.getUTCDate() !== now.getUTCDate() ||
      lastSearch.getUTCMonth() !== now.getUTCMonth() ||
      lastSearch.getUTCFullYear() !== now.getUTCFullYear();

    if (needsReset) {
      await supabase
        .from('ip_searches')
        .upsert({ 
          ip_address: ip, 
          search_count: 1,
          last_search: now.toISOString()
        });

      return new Response(
        JSON.stringify({ 
          status: 'ok',
          canSearch: true,
          remaining: DAILY_LIMIT - 1,
          total: DAILY_LIMIT
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (searchRecord && searchRecord.search_count >= DAILY_LIMIT) {
      return new Response(
        JSON.stringify({ 
          status: 'limit_reached',
          canSearch: false,
          message: 'Daily search limit reached. Support us to get unlimited searches!'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Increment search count
    const newCount = (searchRecord?.search_count || 0) + 1;
    await supabase
      .from('ip_searches')
      .upsert({ 
        ip_address: ip,
        search_count: newCount,
        last_search: now.toISOString()
      });

    return new Response(
      JSON.stringify({
        status: 'ok',
        canSearch: true,
        remaining: DAILY_LIMIT - newCount,
        total: DAILY_LIMIT
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