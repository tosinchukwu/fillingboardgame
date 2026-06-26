// supabase/functions/distribute-rewards/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

// ─── CORS HEADERS ──────────────────────────────────────────────────

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

// ─── CONFIG ──────────────────────────────────────────────────────

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

const CIRCLE_API_KEY = Deno.env.get('CIRCLE_API_KEY') || '';
const CIRCLE_API_URL = Deno.env.get('CIRCLE_API_URL') || 'https://api-sandbox.circle.com/v1/w3s';
const CIRCLE_WALLET_ID = Deno.env.get('CIRCLE_WALLET_ID') || '';

// ─── CIRCLE API ──────────────────────────────────────────────────

async function circleTransfer(toAddress: string, amount: number, matchId: string, type: string) {
  const response = await fetch(
    `${CIRCLE_API_URL}/developer/transactions/transfer`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CIRCLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idempotencyKey: `${matchId}-${type}-${Date.now()}`,
        walletId: CIRCLE_WALLET_ID,
        tokenId: 'usd-coin',
        destinationAddress: toAddress,
        amounts: [amount.toString()],
        feeLevel: 'MEDIUM',
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Circle API error: ${response.status} - ${error}`);
  }

  return response.json();
}

// ─── MAIN HANDLER ───────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // ─── CORS ──────────────────────────────────────────────────────
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ─── AUTHENTICATION ──────────────────────────────────────────
    const cronSecret = req.headers.get('x-cron-secret') || req.headers.get('authorization');
    if (cronSecret !== Deno.env.get('CRON_SECRET')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { ...corsHeaders, 'content-type': 'application/json' }
      });
    }

    console.log('[Distributor] Starting reward distribution...');

    // ─── GET VERIFIED REWARDS ──────────────────────────────────
    const { data: rewards, error } = await supabase
      .from('escrow_rewards')
      .select('*')
      .eq('escrow_status', 'verified')
      .is('tx_hash_winner', null)
      .limit(10);

    if (error) throw error;

    if (!rewards || rewards.length === 0) {
      return new Response(JSON.stringify({
        status: "success",
        message: "No rewards ready for distribution",
        processed: 0,
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { ...corsHeaders, 'content-type': 'application/json' }
      });
    }

    console.log(`[Distributor] Found ${rewards.length} rewards to distribute`);

    let success = 0;
    let failed = 0;

    for (const reward of rewards) {
      try {
        console.log(`[Distributor] Processing match: ${reward.match_id}`);
        console.log(`  → Winner: ${reward.winner_address}`);
        console.log(`  → Amount: ${reward.winner_reward_usdc} USDC`);

        // ─── SEND REWARD VIA CIRCLE API ──────────────────────────
        const winnerTx = await circleTransfer(
          reward.winner_address,
          reward.winner_reward_usdc,
          reward.match_id,
          'winner'
        );

        const winnerTxId = winnerTx?.data?.id || winnerTx?.id;

        let runnerTxId = null;
        if (reward.runner_up_address && reward.runner_up_reward_usdc > 0) {
          const runnerTx = await circleTransfer(
            reward.runner_up_address,
            reward.runner_up_reward_usdc,
            reward.match_id,
            'runner'
          );
          runnerTxId = runnerTx?.data?.id || runnerTx?.id;
        }

        // ─── UPDATE ESCROW_REWARDS ──────────────────────────────
        await supabase
          .from('escrow_rewards')
          .update({
            escrow_status: 'released',
            tx_hash_winner: winnerTxId,
            tx_hash_runner_up: runnerTxId,
            release_time: new Date().toISOString(),
          })
          .eq('match_id', reward.match_id);

        // ─── UPDATE MATCHES ──────────────────────────────────────
        await supabase
          .from('matches')
          .update({
            reward_released: true,
            reward_tx_hash: winnerTxId,
            reward_released_at: new Date().toISOString(),
          })
          .eq('match_id', reward.match_id);

        success++;
        console.log(`✅ USDC sent for match: ${reward.match_id} (TX: ${winnerTxId})`);

      } catch (err: any) {
        console.error(`❌ Failed to send USDC for ${reward.match_id}:`, err.message);

        await supabase
          .from('escrow_rewards')
          .update({
            escrow_status: 'failed',
            failure_reason: err.message || 'Unknown error',
            failure_time: new Date().toISOString(),
          })
          .eq('match_id', reward.match_id);

        failed++;
      }
    }

    return new Response(JSON.stringify({
      status: "success",
      message: "Distribution cycle completed",
      processed: rewards.length,
      success,
      failed,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { ...corsHeaders, 'content-type': 'application/json' }
    });

  } catch (err: any) {
    console.error("[Distributor Critical Error]", err);
    return new Response(JSON.stringify({
      error: err.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' }
    });
  }
});
