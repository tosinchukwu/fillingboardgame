// api/cron/verify-results.ts
import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

/**
 * =========================
 * SUPABASE (SERVICE ROLE)
 * =========================
 */
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface MatchResult {
  match_id: string;
  winner_address: string;
  runner_up_address: string;
  completed_at: string;
}

/**
 * =========================
 * MAIN CRON HANDLER
 * =========================
 */
export default async function handler(request: Request): Promise<Response> {
  // Security Check - CRON_SECRET
  const authHeader = request.headers.get('authorization') || request.headers.get('x-cron-secret');
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && authHeader !== process.env.CRON_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    console.log('[VerifyBot] Starting match verification...');

    const { data: pending, error } = await supabase
      .from('bot_verifications')
      .select('match_id, created_at')
      .eq('verification_status', 'pending')
      .lte(
        'created_at',
        new Date(Date.now() - 3 * 60 * 1000).toISOString()
      );

    if (error) {
      console.error('[VerifyBot] DB error:', error);
      return new Response(JSON.stringify({ error: 'Database error' }), { status: 500 });
    }

    if (!pending?.length) {
      return new Response(
        JSON.stringify({
          message: 'No matches to verify',
          checked: 0,
          verified: 0,
        }),
        { status: 200 }
      );
    }

    let verified = 0;
    let failed = 0;

    for (const item of pending) {
      try {
        const result = await verifyMatch(item.match_id);
        if (result.success) verified++;
        else failed++;
      } catch (err) {
        console.error('[VerifyBot] Failed match:', item.match_id, err);
        failed++;

        await supabase
          .from('bot_verifications')
          .update({
            verification_status: 'failed',
            error_message: err instanceof Error ? err.message : 'Unknown error',
            updated_at: new Date().toISOString(),
          })
          .eq('match_id', item.match_id);
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Verification complete',
        checked: pending.length,
        verified,
        failed,
      }),
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[VerifyBot] Critical Error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), { status: 500 });
  }
}

/**
 * =========================
 * MATCH VERIFICATION LOGIC
 * =========================
 */
async function verifyMatch(matchId: string): Promise<{ success: boolean }> {
  console.log(`[VerifyBot] Verifying match ${matchId}`);

  const { data: match, error } = await supabase
    .from('matches')
    .select('*')
    .eq('match_id', matchId)
    .single();

  if (error || !match) {
    throw new Error('Match not found');
  }

  const gameState = match.game_state || {};

  const winner = gameState.winner_address || match.lobby_host?.address;
  const runnerUp = gameState.runner_up_address || match.lobby_guest?.address;

  if (!winner) {
    throw new Error('No winner found');
  }

  // Check confirmed payments
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('match_id', matchId)
    .eq('payment_status', 'confirmed');

  if (!payments?.length) {
    await supabase
      .from('bot_verifications')
      .update({
        verification_status: 'failed',
        error_message: 'No confirmed payments found',
        updated_at: new Date().toISOString(),
      })
      .eq('match_id', matchId);

    return { success: false };
  }

  const total = payments.reduce((sum, p) => sum + Number(p.amount_usdc), 0);

  const winnerReward = Math.floor(total * 0.6);
  const runnerReward = Math.floor(total * 0.3);

  // Insert into escrow_rewards for distribution
  await supabase.from('escrow_rewards').insert({
    match_id: matchId,
    winner_address: winner,
    runner_up_address: runnerUp,
    winner_reward_usdc: winnerReward,
    runner_up_reward_usdc: runnerReward,
    chain_id: match.payment_chain_id || 5042002,
    escrow_status: 'verified',
    verification_time: new Date().toISOString(),
  });

  // Mark as verified
  await supabase
    .from('bot_verifications')
    .update({
      verification_status: 'verified',
      verified_winner: winner,
      verified_runner_up: runnerUp,
      verification_timestamp: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('match_id', matchId);

  console.log(`[VerifyBot] Match ${matchId} successfully verified`);
  return { success: true };
}
