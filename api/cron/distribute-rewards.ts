// api/cron/distribute-rewards.ts
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

export const config = { runtime: 'edge' };

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── CIRCLE API ─────────────────────────────────────────────────

const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY!;
const CIRCLE_API_URL = process.env.CIRCLE_API_URL || 'https://api-sandbox.circle.com/v1/w3s';
const CIRCLE_WALLET_ID = process.env.CIRCLE_WALLET_ID!;

async function circleTransfer(toAddress: string, amount: number, matchId: string, type: string) {
  const response = await axios.post(
    `${CIRCLE_API_URL}/developer/transactions/transfer`,
    {
      idempotencyKey: `${matchId}-${type}-${Date.now()}`,
      walletId: CIRCLE_WALLET_ID,
      tokenId: 'usd-coin',
      destinationAddress: toAddress,
      amounts: [amount.toString()],
      feeLevel: 'MEDIUM',
    },
    {
      headers: {
        Authorization: `Bearer ${CIRCLE_API_KEY}`,
        'Content-Type': 'application/json',
      }
    }
  );
  return response.data;
}

// ─── ON-CHAIN VERIFICATION (Optional - for extra security) ────

async function verifyOnChain(matchId: string, chainId: number) {
  // This is OPTIONAL - you can skip this if you trust your game data
  // But it adds an extra layer of security
  
  try {
    // Use public RPC to verify match on-chain
    const response = await axios.post(
      process.env.RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc',
      {
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [
          {
            to: getContractAddress(chainId),
            data: `0x...` // Encode getMatch call
          },
          'latest'
        ],
        id: 1
      }
    );
    return response.data;
  } catch (err) {
    console.warn('[Verify] On-chain verification failed, using Supabase data');
    return null;
  }
}

// ─── HANDLER ────────────────────────────────────────────────────

export default async function handler(request: Request): Promise<Response> {
  try {
    const cronSecret = request.headers.get('x-cron-secret') || request.headers.get('authorization');

    if (cronSecret && cronSecret !== process.env.CRON_SECRET) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    console.log('[Distributor] Starting reward distribution...');

    // Get verified rewards that haven't been released
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
        console.log(`[Distributor] Sending USDC to winner for match: ${reward.match_id}`);

        // ─── OPTIONAL: Verify on-chain before sending ──────────
        // const onChainData = await verifyOnChain(reward.match_id, reward.chain_id || 43113);
        // if (!onChainData || !onChainData.winner) {
        //   throw new Error('On-chain verification failed');
        // }

        // ─── SEND REWARD VIA CIRCLE API ──────────────────────
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

        // ─── UPDATE SUPABASE ──────────────────────────────────
        await supabase
          .from('escrow_rewards')
          .update({
            escrow_status: 'released',
            tx_hash_winner: winnerTx?.data?.id || winnerTx?.id,
            tx_hash_runner_up: runnerTx?.data?.id || runnerTx?.id,
            release_time: new Date().toISOString(),
          })
          .eq('match_id', reward.match_id);

        // Update matches
        await supabase
          .from('matches')
          .update({
            reward_released: true,
            reward_tx_hash: winnerTx?.data?.id || winnerTx?.id,
            reward_released_at: new Date().toISOString(),
          })
          .eq('match_id', reward.match_id);

        success++;
        console.log(`✅ USDC sent for match: ${reward.match_id}`);

      } catch (err: any) {
        console.error(`Failed to send USDC for ${reward.match_id}:`, err);
        
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
      processed: rewards.length,
      success,
      failed
    }), { status: 200 });

  } catch (err: any) {
    console.error("[Distributor Critical Error]", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}