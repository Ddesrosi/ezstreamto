import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const TMDB_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0MTNjZDMzZjdjNDViNjUwMTQ4NzljYWVhZDcyY2FiYSIsIm5iZiI6MTczODAwNTE3Ni43MjMsInN1YiI6IjY3OTdkYWI4YTZlNDEyODNmMTJiNDU2NSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.dM4keiy2kA6XcUufnGGSnCDCUJGwFMg91pq4I5Bziq8';
const TMDB_API_URL = 'https://api.themoviedb.org/3';
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba';

interface MovieDetails {
  id: string;
  title: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  videos?: {
    results: {
      key: string;
      site: string;
      type: string;
    }[];
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { title, year } = await req.json().catch(() => ({}));

    if (!title) {
      return new Response(
        JSON.stringify({ 
          error: 'Title is required',
          fallbackImageUrl: FALLBACK_IMAGE
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Check cache first
    const normalizedTitle = title.toLowerCase().trim();
    const { data: cachedMovie } = await supabaseClient
      .from('movies')
      .select('*')
      .eq('title', normalizedTitle)
      .eq('year', year)
      .single();

    if (cachedMovie) {
      return new Response(
        JSON.stringify({
          imageUrl: cachedMovie.poster_path || FALLBACK_IMAGE,
          backdropUrl: cachedMovie.backdrop_path,
          youtubeUrl: cachedMovie.youtube_url || `https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} ${year} trailer`)}`
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
          } 
        }
      );
    }

    // Search TMDB
    const searchUrl = new URL(`${TMDB_API_URL}/search/multi`);
    searchUrl.searchParams.append('query', `${title}${year ? ` ${year}` : ''}`);
    searchUrl.searchParams.append('include_adult', 'false');
    searchUrl.searchParams.append('language', 'en-US');
    searchUrl.searchParams.append('page', '1');

    const searchResponse = await fetch(searchUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${TMDB_ACCESS_TOKEN}`,
        'Accept': 'application/json'
      }
    });

    if (!searchResponse.ok) {
      throw new Error(`TMDB search failed: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    
    // Find best match
    const result = searchData.results?.find(r => {
      if (!r || !['movie', 'tv'].includes(r.media_type)) return false;
      const resultTitle = (r.title || r.name || '').toLowerCase();
      return resultTitle.includes(normalizedTitle) || normalizedTitle.includes(resultTitle);
    });

    if (!result) {
      const fallbackResponse = {
        error: 'No matching results found',
        fallbackImageUrl: FALLBACK_IMAGE,
        youtubeUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} ${year} trailer`)}`
      };

      // Cache the fallback response
      await supabaseClient.from('movies').insert({
        tmdb_id: crypto.randomUUID(),
        title: normalizedTitle,
        year,
        poster_path: FALLBACK_IMAGE,
        youtube_url: fallbackResponse.youtubeUrl
      });

      return new Response(
        JSON.stringify(fallbackResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get full details
    const detailsResponse = await fetch(
      `${TMDB_API_URL}/${result.media_type}/${result.id}?append_to_response=videos`,
      {
        headers: {
          'Authorization': `Bearer ${TMDB_ACCESS_TOKEN}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!detailsResponse.ok) {
      throw new Error(`TMDB details failed: ${detailsResponse.status}`);
    }

    const details: MovieDetails = await detailsResponse.json();

    // Find trailer
    const trailer = details.videos?.results?.find(
      video => video?.site === 'YouTube' && 
        (video.type === 'Trailer' || video.type === 'Teaser')
    );

    const response = {
      imageUrl: details.poster_path
        ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
        : FALLBACK_IMAGE,
      backdropUrl: details.backdrop_path
        ? `https://image.tmdb.org/t/p/original${details.backdrop_path}`
        : null,
      youtubeUrl: trailer
        ? `https://www.youtube.com/watch?v=${trailer.key}`
        : `https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} ${year} trailer`)}`
    };

    // Cache the successful response
    await supabaseClient.from('movies').insert({
      tmdb_id: details.id,
      title: normalizedTitle,
      year,
      poster_path: response.imageUrl,
      backdrop_path: response.backdropUrl,
      youtube_url: response.youtubeUrl
    });

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
        } 
      }
    );
  } catch (error) {
    console.error('TMDB API Error:', error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
        fallbackImageUrl: FALLBACK_IMAGE,
        youtubeUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} ${year} trailer`)}`
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});