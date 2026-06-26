// supabase/functions/game-api/index.ts
// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

Deno.serve(async (req: Request) => {
  // ─── CORS ──────────────────────────────────────────────────
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    // ─── HEALTH CHECK ──────────────────────────────────────
    if (path === 'health') {
      return new Response(JSON.stringify({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        message: 'Game API is running (AI agents disabled)'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'content-type': 'application/json' }
      });
    }

    // ─── GET MATCH ──────────────────────────────────────────
    if (path === 'match') {
      const matchId = url.searchParams.get('matchId');
      
      if (!matchId) {
        return new Response(JSON.stringify({ error: 'matchId required' }), {
          status: 400,
          headers: { ...corsHeaders, 'content-type': 'application/json' }
        });
      }

      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('match_id', matchId)
        .single();

      if (error || !data) {
        return new Response(JSON.stringify({ error: 'Match not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'content-type': 'application/json' }
        });
      }

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, 'content-type': 'application/json' }
      });
    }

    // ─── DEFAULT ────────────────────────────────────────────
    return new Response(JSON.stringify({ 
      error: 'Not found',
      available: ['/health', '/match?matchId=XXX']
    }), {
      status: 404,
      headers: { ...corsHeaders, 'content-type': 'application/json' }
    });

  } catch (e) {
    console.error('[GameAPI] Error:', e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' }
    });
  }
});
