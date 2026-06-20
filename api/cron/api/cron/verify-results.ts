import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * =========================
 * SUPABASE (FIXED BACKEND SETUP)
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
 * CRON HANDLER
 * =========================
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Cron security check
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('[Bot] Starting match verification...');

    const { data: pending, error } = await supabase
      .from('bot_verifications')
      .select('match_id, created_at')
      .eq('verification_status', 'pending')
      .lte(
        'created_at',
        new Date(Date.now() - 3 * 60 * 1000).toISOString()
      );

    if (error) {
      console.error('[Bot] DB error:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!pending?.length) {
      return res.status(200).json({
        message: 'No matches to verify',
        checked: 0,
        verified: 0,
      });
    }

    let verified = 0;
    let failed = 0;

    for (const item of pending) {
      try {
        const result = await verifyMatch(item.match_id);

        if (result.success) verified++;
        else failed++;
      } catch (err) {
        console.error('[Bot] Failed match:', item.match_id, err);
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

    return res.status(200).json({
      message: 'Verification complete',
      checked: pending.length,
      verified,
      failed,
    });
  } catch (err: any) {
    return res.status(500).json({
      error: err.message || 'Unknown error',
    });
  }
}

/**
 * =========================
 * MATCH VERIFICATION LOGIC
 * =========================
 */
async function verifyMatch(matchId: string): Promise<{ success: boolean }> {
  console.log(`[Bot] Verifying match ${matchId}`);

  const { data: match, error } = await supabase
    .from('matches')
    .select('*')
    .eq('match_id', matchId)
    .single();

  if (error || !match) {
    throw new Error('Match not found');
  }

  const gameState = match.game_state || {};

  const winner =
    gameState.winner_address || match.lobby_host?.address;

  const runnerUp =
    gameState.runner_up_address || match.lobby_guest?.address;

  if (!winner) {
    throw new Error('No winner found');
  }

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
        error_message: 'No payments found',
        updated_at: new Date().toISOString(),
      })
      .eq('match_id', matchId);

    return { success: false };
  }

  const total = payments.reduce(
    (sum, p) => sum + Number(p.amount_usdc),
    0
  );

  const winnerReward = total * 0.6;
  const runnerReward = total * 0.3;

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

  console.log(`[Bot] Match ${matchId} verified`);
  return { success: true };
}
