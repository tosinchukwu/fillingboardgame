// supabase/functions/verify-results/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { createPublicClient, http } from 'https://esm.sh/viem@2.21.0';
import { avalancheFuji, avalanche, baseSepolia, base } from 'https://esm.sh/viem@2.21.0/chains';

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
  421614: 'https://sepolia-rollup.arbitrum.io/rpc',             // Arbitrum Sepolia
  11155420: 'https://sepolia.optimism.io',                      // Optimism Sepolia
  97: 'https://data-seed-prebsc-1-s1.binance.org:8545',         // BSC Testnet
  80002: 'https://rpc-amoy.polygon.technology',                 // Polygon Amoy
  7200: 'https://testnet.arc.network',                          // Arc Testnet

  // ─── MAINNETS ──────────────────────────────────────────────────
  43114: 'https://api.avax.network/ext/bc/C/rpc',               // Avalanche Mainnet
  8453: 'https://mainnet.base.org',                             // Base Mainnet
  42161: 'https://arb1.arbitrum.io/rpc',                        // Arbitrum
  10: 'https://mainnet.optimism.io',                            // Optimism
  56: 'https://bsc-dataseed.binance.org/',                      // BSC
  137: 'https://polygon-rpc.com/',                              // Polygon
  7201: 'https://mainnet.arc.network',                          // Arc Mainnet
};

// ─── CONTRACT ADDRESSES PER CHAIN (FROM YOUR CONSTANTS.TS) ────

const CONTRACT_ADDRESS_MAP: Record<number, string> = {
  // ─── TESTNETS ──────────────────────────────────────────────────
  43113: '0xB546e013bEF78beF80c2B0DC0edAe72B0be5F008',      // Avalanche Fuji Tournament
  84532: '0x809E719EbB89e415c5d3A249D4a40172C28E4c99',      // Base Sepolia Tournament
  421614: '0xD0597E10A5E99a0aD9318d31265ef1d99B6DBeF8',     // Arbitrum Sepolia Tournament
  11155420: '0x306beA249FF7ee1057a5A0a5a17f108F5a1C7DF8',   // Optimism Sepolia Tournament
  97: '0x4A0FFd38EBcD6352C8801cB2a5ccc60Dd2C3463C',          // BSC Testnet Tournament
  80002: '0x306beA249FF7ee1057a5A0a5a17f108F5a1C7DF8',       // Polygon Amoy Tournament
  7200: '0xD56bDb436a26421F76B8a975402784Fbc5536910',        // Arc Testnet Tournament

  // ─── MAINNETS ──────────────────────────────────────────────────
  43114: '0x306beA249FF7ee1057a5A0a5a17f108F5a1C7DF8',       // Avalanche Mainnet
  8453: '0x306beA249FF7ee1057a5A0a5a17f108F5a1C7DF8',        // Base Mainnet
  42161: '0x306beA249FF7ee1057a5A0a5a17f108F5a1C7DF8',       // Arbitrum
  10: '0x306beA249FF7ee1057a5A0a5a17f108F5a1C7DF8',          // Optimism
  56: '0x306beA249FF7ee1057a5A0a5a17f108F5a1C7DF8',          // BSC
  137: '0x306beA249FF7ee1057a5A0a5a17f108F5a1C7DF8',         // Polygon
  7201: '0x306beA249FF7ee1057a5A0a5a17f108F5a1C7DF8',        // Arc Mainnet
};

const ESCROW_ADDRESS_MAP: Record<number, string> = {
  // ─── TESTNETS ──────────────────────────────────────────────────
  43113: '0x0E1c198Cd586A2fE9d090A274310a351578f6C28',      // Avalanche Fuji Escrow
  84532: '0x3182945d96Cd66568910805C324EEC0B26cFa897',      // Base Sepolia Escrow
  421614: '0xDFaDa953298F04C322480D73e53436FBA4204349',     // Arbitrum Sepolia Escrow
  11155420: '0x145f9c9088C7c09dfD9c00e889B044A63a85564F',   // Optimism Sepolia Escrow
  97: '0x5D96085343D83C2100dbB82B22bE5E7f70377b53',          // BSC Testnet Escrow
  80002: '0x0000000000000000000000000000000000000000',       // Polygon Amoy Escrow (TODO)
  7200: '0x9E70F5ca6120670C479f42A8f40fdFFf97bD0FDb',        // Arc Testnet Escrow

  // ─── MAINNETS ──────────────────────────────────────────────────
  43114: '0x0000000000000000000000000000000000000000',       // Avalanche Mainnet (TODO)
  8453: '0x0000000000000000000000000000000000000000',        // Base Mainnet (TODO)
  42161: '0x0000000000000000000000000000000000000000',       // Arbitrum (TODO)
  10: '0x0000000000000000000000000000000000000000',          // Optimism (TODO)
  56: '0x0000000000000000000000000000000000000000',          // BSC (TODO)
  137: '0x0000000000000000000000000000000000000000',         // Polygon (TODO)
  7201: '0x0000000000000000000000000000000000000000',        // Arc Mainnet (TODO)
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
  return RPC_URLS[chainId] || RPC_URLS[43113];
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

    const match = await client.readContract({
      address: tournamentAddress,
      abi: TOURNAMENT_ABI,
      functionName: 'getMatch',
      args: [BigInt(matchId)],
    }) as any;

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

// ─── MAIN HANDLER ───────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  try {
    // ─── AUTHENTICATION ──────────────────────────────────────────
    const cronSecret = req.headers.get('x-cron-secret') || req.headers.get('authorization');
    if (cronSecret !== Deno.env.get('CRON_SECRET')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

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

    console.log(`Found ${pendingMatches.length} matches to verify`);

    let verified = 0;
    let failed = 0;
    let skipped = 0;

    for (const match of pendingMatches) {
      try {
        const matchId = match.match_id;
        const chainId = match.payment_chain_id || 43113;

        console.log(`Verifying match: ${matchId} on chain ${chainId}`);

        const onChainData = await getMatchFromChain(matchId, chainId);

        if (!onChainData) {
          console.log(`Failed to fetch on-chain data for ${matchId}`);
          skipped++;
          continue;
        }

        if (!onChainData.isCompleted) {
          console.log(`Match ${matchId} not completed on-chain`);
          skipped++;
          continue;
        }

        const winnerAddress = onChainData.winner;
        if (!winnerAddress || winnerAddress === '0x0000000000000000000000000000000000000000') {
          console.log(`Match ${matchId} has no winner on-chain`);
          skipped++;
          continue;
        }

        // ─── CHECK CASUAL MATCH ──────────────────────────────
        const entryFee = Number(match.entry_fee_usdc || 0);
        const isCasual = entryFee === 0;

        if (isCasual) {
          console.log(`Match ${matchId} is casual - marking complete`);
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
          console.log(`Match ${matchId} has zero pool - skipping`);
          skipped++;
          continue;
        }

        const winnerReward = Math.floor(totalPool * 0.60);
        const platformFee = Math.floor(totalPool * 0.10);

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
          console.error(`Failed to insert escrow_rewards:`, insertError);
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
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
