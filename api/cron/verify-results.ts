// api/cron/verify-results.ts
import { createClient } from '@supabase/supabase-js';
import { createPublicClient, http } from 'viem';
import { avalancheFuji, avalanche, baseSepolia, base } from 'viem/chains';

export const config = { runtime: 'edge' };

// ─── SUPABASE CLIENT ──────────────────────────────────────────────

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── ARC NETWORK CONFIG ──────────────────────────────────────────

// Arc Testnet (Chain ID: 7200)
const arcTestnet = {
  id: 7200,
  name: 'Arc Testnet',
  network: 'arc-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'ARC',
    symbol: 'ARC',
  },
  rpcUrls: {
    public: { http: ['https://testnet.arc.network'] },
    default: { http: ['https://testnet.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.net' },
  },
  testnet: true,
} as const;

// Arc Mainnet (Chain ID: 7201)
const arcMainnet = {
  id: 7201,
  name: 'Arc Mainnet',
  network: 'arc-mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'ARC',
    symbol: 'ARC',
  },
  rpcUrls: {
    public: { http: ['https://mainnet.arc.network'] },
    default: { http: ['https://mainnet.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://arcscan.net' },
  },
  testnet: false,
} as const;

// ─── RPC URLS PER CHAIN ──────────────────────────────────────────

const RPC_URLS: Record<number, string> = {
  // ─── TESTNETS ──────────────────────────────────────────────────
  43113: 'https://api.avax-test.network/ext/bc/C/rpc',          // Avalanche Fuji
  84532: 'https://sepolia.base.org',                            // Base Sepolia
  7200: 'https://testnet.arc.network',                          // Arc Testnet

  // ─── MAINNETS ──────────────────────────────────────────────────
  43114: 'https://api.avax.network/ext/bc/C/rpc',               // Avalanche Mainnet
  8453: 'https://mainnet.base.org',                             // Base Mainnet
  7201: 'https://mainnet.arc.network',                          // Arc Mainnet

  // ─── ADD MORE MAINNETS HERE (fill in when ready) ──────────────
  // 1: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',         // Ethereum
  // 10: 'https://mainnet.optimism.io',                         // Optimism
  // 56: 'https://bsc-dataseed.binance.org/',                   // BSC
  // 100: 'https://rpc.gnosischain.com',                        // Gnosis
  // 137: 'https://polygon-rpc.com/',                           // Polygon
  // 250: 'https://rpc.ftm.tools/',                             // Fantom
  // 324: 'https://mainnet.zksync.io',                          // zkSync Era
  // 1101: 'https://zkevm-rpc.com',                             // Polygon zkEVM
  // 42161: 'https://arb1.arbitrum.io/rpc',                     // Arbitrum
  // 42220: 'https://forno.celo.org',                           // Celo
  // 59144: 'https://linea.drpc.org',                           // Linea
  // 81457: 'https://blast.drpc.org',                           // Blast
  // 534352: 'https://rpc.scroll.io',                           // Scroll
};

// ─── CONTRACT ADDRESSES PER CHAIN ──────────────────────────────

const CONTRACT_ADDRESS_MAP: Record<number, string> = {
  // ─── TESTNETS ──────────────────────────────────────────────────
  43113: '0x3C9b881dF5d7A5219B887F2bf0e3ba2a96EE72D4',     // Avalanche Fuji Tournament
  84532: '0x7056a1628f8afD8D9413b3Ffc701F6B357ED5ED8',    // Base Sepolia Tournament
  7200: '0x3B8abC0a3B8dA8cbc384D76bDac33E5eF4b13d7D',     // Arc Testnet Tournament

  // ─── MAINNETS ──────────────────────────────────────────────────
  43114: '0x306beA249FF7ee1057a5A0a5a17f108F5a1C7DF8',    // Avalanche Mainnet Tournament
  8453: '0x306beA249FF7ee1057a5A0a5a17f108F5a1C7DF8',     // Base Mainnet Tournament
  7201: '0x0000000000000000000000000000000000000000',     // ← ARC MAINNET TOURNAMENT (UPDATE AFTER DEPLOYMENT)

  // ─── ADD MORE MAINNETS HERE (fill in when ready) ──────────────
  // 1: '0x0000000000000000000000000000000000000000',     // Ethereum
  // 10: '0x0000000000000000000000000000000000000000',    // Optimism
  // 56: '0x0000000000000000000000000000000000000000',    // BSC
  // 100: '0x0000000000000000000000000000000000000000',   // Gnosis
  // 137: '0x0000000000000000000000000000000000000000',   // Polygon
  // 250: '0x0000000000000000000000000000000000000000',   // Fantom
  // 324: '0x0000000000000000000000000000000000000000',   // zkSync Era
  // 1101: '0x0000000000000000000000000000000000000000',  // Polygon zkEVM
  // 42161: '0x0000000000000000000000000000000000000000', // Arbitrum
  // 42220: '0x0000000000000000000000000000000000000000', // Celo
  // 59144: '0x0000000000000000000000000000000000000000', // Linea
  // 81457: '0x0000000000000000000000000000000000000000', // Blast
  // 534352: '0x0000000000000000000000000000000000000000',// Scroll
};

const ESCROW_ADDRESS_MAP: Record<number, string> = {
  // ─── TESTNETS ──────────────────────────────────────────────────
  43113: '0x0000000000000000000000000000000000000000',     // ← UPDATE AFTER DEPLOYMENT
  84532: '0x0000000000000000000000000000000000000000',     // ← UPDATE AFTER DEPLOYMENT
  7200: '0x0000000000000000000000000000000000000000',      // ← UPDATE AFTER DEPLOYMENT

  // ─── MAINNETS ──────────────────────────────────────────────────
  43114: '0x0000000000000000000000000000000000000000',     // ← UPDATE AFTER DEPLOYMENT
  8453: '0x0000000000000000000000000000000000000000',      // ← UPDATE AFTER DEPLOYMENT
  7201: '0x0000000000000000000000000000000000000000',      // ← UPDATE AFTER DEPLOYMENT

  // ─── ADD MORE MAINNETS HERE (fill in when ready) ──────────────
  // 1: '0x0000000000000000000000000000000000000000',
  // 10: '0x0000000000000000000000000000000000000000',
  // 56: '0x0000000000000000000000000000000000000000',
  // 100: '0x0000000000000000000000000000000000000000',
  // 137: '0x0000000000000000000000000000000000000000',
  // 250: '0x0000000000000000000000000000000000000000',
  // 324: '0x0000000000000000000000000000000000000000',
  // 1101: '0x0000000000000000000000000000000000000000',
  // 42161: '0x0000000000000000000000000000000000000000',
  // 42220: '0x0000000000000000000000000000000000000000',
  // 59144: '0x0000000000000000000000000000000000000000',
  // 81457: '0x0000000000000000000000000000000000000000',
  // 534352: '0x0000000000000000000000000000000000000000',
};

// ─── ABIs ────────────────────────────────────────────────────────

const TOURNAMENT_ABI = [
  {
    inputs: [{ name: 'matchId', type: 'uint256' }],
    name: 'getMatch',
    outputs: [
      { name: 'id', type: 'uint256' },
      { name: 'player1', type: 'address' },
      { name: 'player1Name', type: 'string' },
      { name: 'player2', type: 'address' },
      { name: 'player2Name', type: 'string' },
      { name: 'player1Paid', type: 'bool' },
      { name: 'player2Paid', type: 'bool' },
      { name: 'lockedEntryFee', type: 'uint256' },
      { name: 'lockedPaymentToken', type: 'address' },
      { name: 'winner', type: 'address' },
      { name: 'scoreline', type: 'string' },
      { name: 'isCompleted', type: 'bool' },
      { name: 'isCancelled', type: 'bool' },
      { name: 'prizePool', type: 'uint256' },
      { name: 'createdAt', type: 'uint256' },
      { name: 'isCasual', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const ESCROW_ABI = [
  {
    inputs: [{ name: 'matchId', type: 'uint256' }],
    name: 'getMatchFunding',
    outputs: [
      { name: 'player1Paid', type: 'bool' },
      { name: 'player2Paid', type: 'bool' },
      { name: 'totalAmount', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// ─── HELPERS ─────────────────────────────────────────────────────

function getChainConfig(chainId: number) {
  switch (chainId) {
    case 43113: return avalancheFuji;
    case 43114: return avalanche;
    case 84532: return baseSepolia;
    case 8453: return base;
    case 7200: return arcTestnet;
    case 7201: return arcMainnet;
    default: return avalancheFuji;
  }
}

function getRpcUrl(chainId: number): string {
  return RPC_URLS[chainId] || RPC_URLS[43113]; // Fallback to Fuji
}

function getContractAddress(chainId: number): string {
  return CONTRACT_ADDRESS_MAP[chainId] || '0x0000000000000000000000000000000000000000';
}

function getEscrowAddress(chainId: number): string {
  return ESCROW_ADDRESS_MAP[chainId] || '0x0000000000000000000000000000000000000000';
}

// ─── ON-CHAIN VERIFICATION ──────────────────────────────────────

async function getMatchFromChain(matchId: string, chainId: number) {
  try {
    const chain = getChainConfig(chainId);
    const rpcUrl = getRpcUrl(chainId);

    const client = createPublicClient({
      chain,
      transport: http(rpcUrl),
    });

    const tournamentAddress = getContractAddress(chainId) as `0x${string}`;
    const escrowAddress = getEscrowAddress(chainId) as `0x${string}`;

    // Get match data from tournament contract
    const match = await client.readContract({
      address: tournamentAddress,
      abi: TOURNAMENT_ABI,
      functionName: 'getMatch',
      args: [BigInt(matchId)],
    }) as any;

    // Get funding status from escrow contract
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
        console.warn(`Escrow not available for match ${matchId}`);
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
      escrowTotalAmount: escrowFunding?.totalAmount || 0n,
    };
  } catch (err: any) {
    console.error(`Failed to fetch match ${matchId}:`, err.message);
    return null;
  }
}

// ─── HANDLER ────────────────────────────────────────────────────

export default async function handler(request: Request): Promise<Response> {
  try {
    // ─── AUTHENTICATION ──────────────────────────────────────────
    const cronSecret = request.headers.get('x-cron-secret') || request.headers.get('authorization');

    if (cronSecret && cronSecret !== process.env.CRON_SECRET) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    console.log('[VerifyBot] Starting verification cycle...');

    // ─── GET PENDING MATCHES ────────────────────────────────────
    const { data: pendingMatches, error } = await supabase
      .from('matches')
      .select('*')
      .eq('match_status', 'completed')
      .eq('reward_released', false)
      .is('winner_address', null)
      .limit(15);

    if (error) throw error;

    if (!pendingMatches || pendingMatches.length === 0) {
      return new Response(JSON.stringify({
        status: "success",
        message: "No pending matches to verify",
        processed: 0,
        timestamp: new Date().toISOString()
      }), { status: 200 });
    }

    console.log(`[VerifyBot] Found ${pendingMatches.length} matches to verify`);

    let verified = 0;
    let failed = 0;
    let skipped = 0;

    for (const match of pendingMatches) {
      try {
        const matchId = match.match_id;
        const chainId = match.payment_chain_id || 43113;

        console.log(`[VerifyBot] Verifying match: ${matchId} on chain ${chainId}`);

        // ─── VERIFY ON-CHAIN ──────────────────────────────────
        const onChainData = await getMatchFromChain(matchId, chainId);

        if (!onChainData) {
          console.log(`[VerifyBot] Failed to fetch on-chain data for ${matchId}`);
          skipped++;
          continue;
        }

        if (!onChainData.isCompleted) {
          console.log(`[VerifyBot] Match ${matchId} not completed on-chain`);
          skipped++;
          continue;
        }

        const winnerAddress = onChainData.winner;
        if (!winnerAddress || winnerAddress === '0x0000000000000000000000000000000000000000') {
          console.log(`[VerifyBot] Match ${matchId} has no winner on-chain`);
          skipped++;
          continue;
        }

        // ─── CHECK CASUAL MATCH ──────────────────────────────
        const entryFee = Number(match.entry_fee_usdc || 0);
        const isCasual = entryFee === 0;

        if (isCasual) {
          console.log(`[VerifyBot] Match ${matchId} is casual - marking complete`);
          await supabase
            .from('matches')
            .update({
              winner_address: winnerAddress,
              winner_name: onChainData.winnerName,
              is_completed: true,
              scoreline: onChainData.scoreline || match.scoreline,
              verified_at: new Date().toISOString(),
              verified_on_chain: true,
              verified_by: 'cron-bot',
              reward_released: true,
            })
            .eq('match_id', matchId);
          verified++;
          continue;
        }

        // ─── CALCULATE REWARDS ────────────────────────────────
        let totalPool = 0;
        if (onChainData.escrowTotalAmount && onChainData.escrowTotalAmount > 0n) {
          totalPool = Number(onChainData.escrowTotalAmount) / 1_000_000;
        } else {
          totalPool = Number(match.total_entry_fees || match.entry_fee_usdc || 0);
        }

        if (totalPool <= 0) {
          console.log(`[VerifyBot] Match ${matchId} has zero pool - skipping`);
          skipped++;
          continue;
        }

        const winnerReward = Math.floor(totalPool * 0.60);
        const platformFee = Math.floor(totalPool * 0.10);

        console.log(`[VerifyBot] Match ${matchId}: Pool = ${totalPool} USDC, Winner = ${winnerReward}`);

        // ─── INSERT INTO ESCROW_REWARDS ──────────────────────
        const { error: insertError } = await supabase
          .from('escrow_rewards')
          .insert({
            match_id: matchId,
            winner_address: winnerAddress,
            winner_address_name: onChainData.winnerName,
            winner_reward_usdc: winnerReward,
            runner_up_reward_usdc: 0,
            platform_fee_usdc: platformFee,
            total_pool: totalPool,
            escrow_status: 'verified',
            verification_time: new Date().toISOString(),
            chain_id: chainId,
            use_usdc: true,
            scoreline: onChainData.scoreline || match.scoreline,
            player1_address: onChainData.player1,
            player1_name: onChainData.player1Name,
            player2_address: onChainData.player2,
            player2_name: onChainData.player2Name,
          });

        if (insertError) {
          console.error(`[VerifyBot] Failed to insert escrow_rewards:`, insertError);
          failed++;
          continue;
        }

        // ─── UPDATE MATCHES ────────────────────────────────────
        await supabase
          .from('matches')
          .update({
            winner_address: winnerAddress,
            winner_name: onChainData.winnerName,
            is_completed: true,
            scoreline: onChainData.scoreline || match.scoreline,
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

    return new Response(JSON.stringify({
      status: "success",
      message: "Verification cycle completed",
      processed: pendingMatches.length,
      verified,
      failed,
      skipped,
      timestamp: new Date().toISOString()
    }), { status: 200 });

  } catch (err: any) {
    console.error("[VerifyBot Critical Error]", err);
    return new Response(JSON.stringify({
      error: err.message,
      timestamp: new Date().toISOString()
    }), { status: 500 });
  }
}
