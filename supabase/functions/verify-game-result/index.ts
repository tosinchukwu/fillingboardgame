// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function packResult(winner: number | null, score0: number, score1: number) {
  const w = winner === null ? 255n : BigInt(winner);
  const s0 = BigInt(Math.max(0, Math.floor(score0 * 10)));
  const s1 = BigInt(Math.max(0, Math.floor(score1 * 10)));
  return (w << 248n) | (s0 << 128n) | s1;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const matchId = url.searchParams.get('matchId');

    if (!matchId) {
      return new Response(JSON.stringify({ error: 'matchId required' }),
        { status: 400, headers: { ...corsHeaders, 'content-type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    );

    const { data, error } = await supabase
      .from('matches')
      .select('game_state')
      .eq('match_id', matchId)
      .single();

    if (error || !data?.game_state) {
      return new Response(JSON.stringify({ error: 'match not found', matchId }),
        { status: 404, headers: { ...corsHeaders, 'content-type': 'application/json' } });
    }

    const gs = data.game_state;

    const winner = gs.winner ?? null;
    const score0 = gs.players?.[0]?.totalScore ?? 0;
    const score1 = gs.players?.[1]?.totalScore ?? 0;

    const packed = packResult(winner, score0, score1);

    return new Response(JSON.stringify({ 
      result: packed.toString() 
    }), {
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });

  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }),
      { status: 500, headers: { ...corsHeaders, 'content-type': 'application/json' } });
  }
});