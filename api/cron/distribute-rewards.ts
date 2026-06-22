// api/cron/distribute-rewards.ts
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

export const config = { runtime: 'edge' };

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY!;
const CIRCLE_API_URL = process.env.CIRCLE_API_URL || 'https://api-sandbox.circle.com/v1/w3s';

async function circleTransfer(toAddress: string, amount: number, matchId: string, type: string) {
  const response = await axios.post(`${CIRCLE_API_URL}/developer/transactions/transfer`, {
    idempotencyKey: `${matchId}-${type}-${Date.now()}`,
    walletId: process.env.CIRCLE_WALLET_ID,
    tokenId: 'usd-coin',
    destinationAddress: toAddress,
    amounts: [amount.toString()],
    feeLevel: 'MEDIUM',
  }, {
    headers: {
      Authorization: `Bearer ${CIRCLE_API_KEY}`,
      'Content-Type': 'application/json',
    }
  });
  return response.data;
}

export default async function handler(request: Request): Promise<Response> {
  try {
    const cronSecret = request.headers.get('x-cron-secret') || request.headers.get('authorization');
    
    if (cronSecret && cronSecret !== process.env.CRON_SECRET) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    console.log('[Distributor] Starting reward distribution...');

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
        processed: 0
      }), { status: 200 });
    }

    let success = 0;
    let failed = 0;

    for (const reward of rewards) {
      try {
        const winnerTx = await circleTransfer(
          reward.winner_address, 
          reward.winner_reward_usdc, 
          reward.match_id, 
          'winner'
        );

        let runnerTx = null;
        if (reward.runner_up_address && reward.runner_up_reward_usdc > 0) {
          runnerTx = await circleTransfer(
            reward.runner_up_address, 
            reward.runner_up_reward_usdc, 
            reward.match_id, 
            'runner'
          );
        }

        await supabase
          .from('escrow_rewards')
          .update({
            escrow_status: 'released',
            tx_hash_winner: winnerTx?.data?.id || winnerTx?.id,
            tx_hash_runner_up: runnerTx?.data?.id || runnerTx?.id,
            release_time: new Date().toISOString(),
          })
          .eq('match_id', reward.match_id);

        success++;
        console.log(`✅ Distributed rewards for match: ${reward.match_id}`);

      } catch (err) {
        console.error(`Failed to distribute ${reward.match_id}:`, err);
        failed++;
      }
    }

    return new Response(JSON.stringify({
      status: "success",
      processed: rewards.length,
      success,
      failed
    }), { status: 200 });

  } catch (err: any) {
    console.error("[Distributor Critical Error]", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
