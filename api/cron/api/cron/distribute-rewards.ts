import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

/**
 * =========================
 * SUPABASE (BACKEND SAFE)
 * =========================
 */
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * =========================
 * CIRCLE CONFIG (SANDBOX W3S)
 * =========================
 */
const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY!;
const CIRCLE_API_URL =
  process.env.CIRCLE_API_URL || 'https://api-sandbox.circle.com/v1/w3s';

/**
 * =========================
 * CIRCLE API HELPER (W3S ONLY)
 * =========================
 */
async function circleAPI(endpoint: string, method: string = 'POST', data?: any) {
  try {
    const response = await axios({
      method,
      url: `${CIRCLE_API_URL}${endpoint}`,
      headers: {
        Authorization: `Bearer ${CIRCLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data,
    });

    return response.data;
  } catch (error: any) {
    console.error(
      `[Circle API Error] ${endpoint}:`,
      error.response?.data || error.message
    );
    throw error;
  }
}

/**
 * =========================
 * MAIN CRON HANDLER
 * =========================
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Cron security
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('[Distributor] Starting reward distribution...');

    const { data: rewards, error } = await supabase
      .from('escrow_rewards')
      .select('*')
      .eq('escrow_status', 'verified')
      .is('tx_hash_winner', null);

    if (error) {
      console.error('[Supabase Error]', error);
      return res.status(500).json({ error: 'DB error' });
    }

    if (!rewards || rewards.length === 0) {
      return res.status(200).json({
        message: 'No rewards to distribute',
        processed: 0,
      });
    }

    let distributed = 0;
    let failed = 0;

    for (const reward of rewards) {
      try {
        await distributeReward(reward);
        distributed++;
      } catch (err) {
        console.error('[Reward Failed]', err);
        failed++;

        await supabase
          .from('escrow_rewards')
          .update({
            escrow_status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', reward.id);
      }
    }

    return res.status(200).json({
      message: 'Done',
      processed: rewards.length,
      distributed,
      failed,
    });
  } catch (err: any) {
    console.error('[Cron Error]', err);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * =========================
 * DISTRIBUTE REWARD (W3S ONLY)
 * =========================
 */
async function distributeReward(reward: any) {
  console.log(`[Reward] Processing match ${reward.match_id}`);

  const walletId = await getSourceWalletId();

  // Winner transfer
  const winnerTx = await circleAPI('/developer/transactions/transfer', 'POST', {
    idempotencyKey: `${reward.match_id}-winner-${Date.now()}`,
    walletId,
    tokenId: 'usd-coin',
    destinationAddress: reward.winner_address,
    amounts: [reward.winner_reward_usdc.toString()],
    feeLevel: 'MEDIUM',
  });

  let runnerTx = null;

  // Runner-up transfer
  if (reward.runner_up_reward_usdc > 0 && reward.runner_up_address) {
    runnerTx = await circleAPI('/developer/transactions/transfer', 'POST', {
      idempotencyKey: `${reward.match_id}-runner-${Date.now()}`,
      walletId,
      tokenId: 'usd-coin',
      destinationAddress: reward.runner_up_address,
      amounts: [reward.runner_up_reward_usdc.toString()],
      feeLevel: 'MEDIUM',
    });
  }

  // Save logs
  await supabase.from('reward_distributions').insert([
    {
      match_id: reward.match_id,
      recipient_address: reward.winner_address,
      reward_type: 'winner',
      amount_usdc: reward.winner_reward_usdc,
      status: 'success',
      tx_hash: winnerTx?.id || null,
      created_at: new Date().toISOString(),
    },
    ...(runnerTx
      ? [
          {
            match_id: reward.match_id,
            recipient_address: reward.runner_up_address,
            reward_type: 'runner_up',
            amount_usdc: reward.runner_up_reward_usdc,
            status: 'success',
            tx_hash: runnerTx?.id || null,
            created_at: new Date().toISOString(),
          },
        ]
      : []),
  ]);

  // Update escrow
  await supabase
    .from('escrow_rewards')
    .update({
      escrow_status: 'released',
      tx_hash_winner: winnerTx?.id,
      tx_hash_runner_up: runnerTx?.id || null,
      release_time: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('match_id', reward.match_id);

  console.log(`[Reward] Completed ${reward.match_id}`);
}

/**
 * =========================
 * GET WALLET ID (W3S ONLY)
 * =========================
 */
async function getSourceWalletId(): Promise<string> {
  if (process.env.CIRCLE_WALLET_ID) {
    return process.env.CIRCLE_WALLET_ID;
  }

  const response = await circleAPI('/developer/wallets', 'GET');

  if (!response?.data?.wallets?.length) {
    throw new Error('No wallet found in Circle sandbox');
  }

  return response.data.wallets[0].id;
}
