// api/cron/verify-results.ts
import { createClient } from '@supabase/supabase-js';
import { createPublicClient, http } from 'viem';
import { avalancheFuji, avalanche } from 'viem/chains';
import { getContractAddress, TOURNAMENT_ABI as tournamentABI, getEscrowAddress, ESCROW_ABI } from '@/lib/contracts';

export const config = { runtime: 'edge' };

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── ON-CHAIN CLIENT ──────────────────────────────────────────

function getChainConfig(chainId: number) {
  switch (chainId) {
    case 43113: return avalancheFuji;
    case 43114: return avalanche;
    default: return avalancheFuji;
  }
}

async function getMatchFromChain(matchId: string, chainId: number) {
  try {
    const chain = getChainConfig(chainId);
    const client = createPublicClient({
      chain,
      transport: http(process.env.RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc'),
    });

    const tournamentAddress = getContractAddress(chainId);
    const escrowAddress = getEscrowAddress(chainId);

    // Get match data from tournament contract
    const match = await client.readContract({
      address: tournamentAddress,
      abi: tournamentABI,
      functionName: 'getMatch',
      args: [BigInt(matchId)],
    }) as any;

    // Get funding status from escrow contract (if deployed)
    let escrowFunding = null;
    if (escrowAddress !== '0x0000000000000000000000000000000000000000') {
      try {
        const funding = await client.readContract({
          address: escrowAddress,
          abi: ESCROW_ABI,
          functionName: 'getMatchFunding',
          args: [BigInt(matchId)],
        }) as [boolean, boolean, bigint];
        
        escrowFunding = {
          player1Paid: funding[0],
          player2Paid: funding[1],
          totalAmount: funding[2],
        };
      } catch (err) {
        console.warn(`[Verify] Escrow not available for match ${matchId}`);
      }
    }

    return {
      match,
      escrowFunding,
      isCompleted: match.isCompleted,
      winner: match.winner,
      winnerName: match.winner === match.player1 ? match.player1Name : match.player2Name,
      player1: match.player1,
      player2: match.player2,
      player1Name: match.player1Name,
      player2Name: match.player2Name,
      isCasual: match.isCasual,
      prizePool: match.prizePool,
      scoreline: match.scoreline,
      player1Paid: match.player1Paid,
      player2Paid: match.player2Paid,
      escrowTotalAmount: escrowFunding?.totalAmount || 0n,
    };
  } catch (err: any) {
    console.error(`[Verify] Failed to fetch match ${matchId}:`, err.message);
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

    console.log('[VerifyBot] Starting verification cycle...');

    // ─── GET PENDING MATCHES FROM SUPABASE ────────────────────
    const { data: pendingMatches, error } = await supabase
      .from('matches')
      .select('*')
      .eq('is_completed', true)           // Match is finished
      .eq('reward_released', false)       // Rewards not yet released
      .is('winner_address', null)         // Winner not yet set in DB
      .limit(15);

    if (error) throw error;

    if (!pendingMatches || pendingMatches.length === 0) {
      return new Response(JSON.stringify({
        status: "success",
        message: "No pending matches to verify",
        processed: 0
      }), { status: 200 });
    }

    console.log(`[VerifyBot] Found ${pendingMatches.length} matches to verify`);

    let verified = 0;
    let failed = 0;
    let skipped = 0;

    for (const match of pendingMatches) {
      try {
        const matchId = match.match_id;
        const chainId = match.chain_id || 43113; // Default to Fuji

        console.log(`[VerifyBot] Verifying match: ${matchId} on chain ${chainId}`);

        // ─── VERIFY ON-CHAIN ──────────────────────────────────
        const onChainData = await getMatchFromChain(matchId, chainId);

        if (!onChainData) {
          console.log(`[VerifyBot] Failed to fetch on-chain data for ${matchId}`);
          skipped++;
          continue;
        }

        // ─── CHECK: Match completed on-chain? ─────────────────
        if (!onChainData.isCompleted) {
          console.log(`[VerifyBot] Match ${matchId} not completed on-chain`);
          skipped++;
          continue;
        }

        // ─── CHECK: Has winner? ──────────────────────────────
        const winnerAddress = onChainData.winner;
        if (!winnerAddress || winnerAddress === '0x0000000000000000000000000000000000000000') {
          console.log(`[VerifyBot] Match ${matchId} has no winner on-chain`);
          skipped++;
          continue;
        }

        // ─── CHECK: Casual match? Skip rewards ──────────────
        if (onChainData.isCasual) {
          console.log(`[VerifyBot] Match ${matchId} is casual - marking complete without rewards`);
          await supabase
            .from('matches')
            .update({
              winner_address: winnerAddress,
              winner_name: onChainData.winnerName,
              verified_at: new Date().toISOString(),
              reward_released: true, // No rewards for casual
            })
            .eq('match_id', matchId);
          verified++;
          continue;
        }

        // ─── CALCULATE REWARDS ────────────────────────────────
        // Use USDC escrow amount if available, else use native token prize pool
        let totalPool = 0;
        let useUSDC = false;

        if (onChainData.escrowTotalAmount && onChainData.escrowTotalAmount > 0n) {
          // USDC has 6 decimals
          totalPool = Number(onChainData.escrowTotalAmount) / 1_000_000;
          useUSDC = true;
        } else if (onChainData.prizePool && onChainData.prizePool > 0n) {
          // Native token has 18 decimals
          totalPool = Number(onChainData.prizePool) / 1_000_000_000_000_000_000;
          useUSDC = false;
        } else {
          // No pool found, use entry fee from match
          const entryFee = Number(match.entry_fee || 0);
          totalPool = entryFee * 2; // Player1 + Player2
          useUSDC = false;
        }

        if (totalPool <= 0) {
          console.log(`[VerifyBot] Match ${matchId} has zero pool - skipping`);
          skipped++;
          continue;
        }

        const winnerReward = Math.floor(totalPool * 0.60); // 60% to winner
        const platformFee = Math.floor(totalPool * 0.10); // 10% platform fee
        // Remaining 30% goes to runner-up (if applicable) or back to treasury

        console.log(`[VerifyBot] Match ${matchId}: Pool = ${totalPool} ${useUSDC ? 'USDC' : 'native'}, Winner = ${winnerReward}`);

        // ─── INSERT INTO ESCROW_REWARDS ──────────────────────
        const { error: insertError } = await supabase
          .from('escrow_rewards')
          .insert({
            match_id: matchId,
            winner_address: winnerAddress,
            winner_address_name: onChainData.winnerName,
            winner_reward_usdc: useUSDC ? winnerReward : 0,
            winner_reward_native: !useUSDC ? winnerReward : 0,
            platform_fee_usdc: useUSDC ? platformFee : 0,
            platform_fee_native: !useUSDC ? platformFee : 0,
            total_pool: totalPool,
            escrow_status: 'verified',
            verification_time: new Date().toISOString(),
            chain_id: chainId,
            use_usdc: useUSDC,
            scoreline: onChainData.scoreline || match.scoreline,
            player1_address: onChainData.player1,
            player1_name: onChainData.player1Name,
            player2_address: onChainData.player2,
            player2_name: onChainData.player2Name,
          });

        if (insertError) {
          console.error(`[VerifyBot] Failed to insert escrow_rewards for ${matchId}:`, insertError);
          failed++;
          continue;
        }

        // ─── UPDATE MATCHES TABLE ────────────────────────────
        await supabase
          .from('matches')
          .update({
            winner_address: winnerAddress,
            winner_name: onChainData.winnerName,
            verified_at: new Date().toISOString(),
            verified_on_chain: true,
            verified_by: 'cron-bot',
          })
          .eq('match_id', matchId);

        verified++;
        console.log(`✅ Verified match: ${matchId} | Winner: ${winnerAddress}`);

      } catch (err: any) {
        console.error(`Failed match ${match.match_id}:`, err);
        failed++;
      }
    }

    // ─── RETURN RESPONSE ──────────────────────────────────────
    return new Response(JSON.stringify({
      status: "success",
      message: "Verification cycle completed",
      processed: pendingMatches.length,
      verified,
      failed,
      skipped,
      timestamp: new Date().toISOString(),
    }), { status: 200 });

  } catch (err: any) {
    console.error("[VerifyBot Critical Error]", err);
    return new Response(JSON.stringify({
      error: err.message,
      timestamp: new Date().toISOString()
    }), { status: 500 });
  }
}