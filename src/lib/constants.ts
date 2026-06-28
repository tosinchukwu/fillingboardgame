// lib/constants.ts - FillingBoardGame (Game Page)
import {
  avalancheFuji,
  avalanche,
  baseSepolia,
  base,
  arbitrumSepolia,
  arbitrum,
  optimismSepolia,
  optimism,
  bscTestnet,
  bsc,
  polygonAmoy,
  polygon,
} from 'viem/chains';
import { defineChain } from 'viem';

// ─── CONTRACT ADDRESSES ───────────────────────────────────────────

// ─── ESCROW CONTRACT ADDRESSES ────────────────────────────────────
export const ESCROW_CONTRACT_ADDRESSES = {
  avalancheFuji: '0x0E1c198Cd586A2fE9d090A274310a351578f6C28',
  baseSepolia: '0x3182945d96Cd66568910805C324EEC0B26cFa897',
  arbitrumSepolia: '0xDFaDa953298F04C322480D73e53436FBA4204349',
  optimismSepolia: '0x145f9c9088C7c09dfD9c00e889B044A63a85564F',
  bscTestnet: '0x5D96085343D83C2100dbB82B22bE5E7f70377b53',
  polygonAmoy: '0x0000000000000000000000000000000000000000',
  arcTestnet: '0x9E70F5ca6120670C479f42A8f40fdFFf97bD0FDb',
  // Mainnets
  avalanche: '0x0000000000000000000000000000000000000000',
  base: '0x0000000000000000000000000000000000000000',
  arbitrum: '0x0000000000000000000000000000000000000000',
  optimism: '0x0000000000000000000000000000000000000000',
  bsc: '0x0000000000000000000000000000000000000000',
  polygon: '0x0000000000000000000000000000000000000000',
  arcMainnet: '0x0000000000000000000000000000000000000000',
};

export const isEscrowConfigured = (chainId: number) => {
  return !!ESCROW_CONTRACT_ADDRESSES[chainId as keyof typeof ESCROW_CONTRACT_ADDRESSES];
};

// ─── USDC ADDRESSES ────────────────────────────────────────────────
export const USDC_ADDRESS_MAP: Record<number, `0x${string}`> = {
  // Testnets
  [avalancheFuji.id]: '0x5425890298aed601595a70AB815c96711a31Bc65',
  [baseSepolia.id]: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  [arbitrumSepolia.id]: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
  [optimismSepolia.id]: '0x5fd84259d66Cd46123540766Be93DFE6D28330B7',
  [bscTestnet.id]: '0x28fC65CF1F2bDe09ab2876fddaA7788340bAf1D7',
  [polygonAmoy.id]: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',
  [arcTestnet.id]: '0x3600000000000000000000000000000000000000',
  // Mainnets
  [avalanche.id]: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
  [base.id]: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  [arbitrum.id]: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  [optimism.id]: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
  [bsc.id]: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
  [polygon.id]: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
  [arcMainnet.id]: '0x0000000000000000000000000000000000000000',
};

// ─── TOURNAMENT CONTRACT ADDRESSES ────────────────────────────────
export const CONTRACT_ADDRESS_MAP: Record<number, `0x${string}`> = {
  // Testnets
  [avalancheFuji.id]: '0xB546e013bEF78beF80c2B0DC0edAe72B0be5F008',
  [baseSepolia.id]: '0x809E719EbB89e415c5d3A249D4a40172C28E4c99',
  [arbitrumSepolia.id]: '0xD0597E10A5E99a0aD9318d31265ef1d99B6DBeF8',
  [optimismSepolia.id]: '0x306beA249FF7ee1057a5A0a5a17f108F5a1C7DF8',
  [bscTestnet.id]: '0x4A0FFd38EBcD6352C8801cB2a5ccc60Dd2C3463C',
  [polygonAmoy.id]: '0x306beA249FF7ee1057a5A0a5a17f108F5a1C7DF8',
  [arcTestnet.id]: '0xD56bDb436a26421F76B8a975402784Fbc5536910',
  // Mainnets (placeholders)
  [avalanche.id]: '0x306beA249FF7ee1057a5A0a5a17f108F5a1C7DF8',
  [base.id]: '0x306beA249FF7ee1057a5A0a5a17f108F5a1C7DF8',
  [arbitrum.id]: '0x306beA249FF7ee1057a5A0a5a17f108F5a1C7DF8',
  [optimism.id]: '0x306beA249FF7ee1057a5A0a5a17f108F5a1C7DF8',
  [bsc.id]: '0x306beA249FF7ee1057a5A0a5a17f108F5a1C7DF8',
  [polygon.id]: '0x306beA249FF7ee1057a5A0a5a17f108F5a1C7DF8',
  [arcMainnet.id]: '0x306beA249FF7ee1057a5A0a5a17f108F5a1C7DF8',
};

// ─── NFT CONTRACT ADDRESSES ───────────────────────────────────────
export const NFT_ADDRESS_MAP: Record<number, `0x${string}`> = {
  // Testnets
  [avalancheFuji.id]: '0xC233C77d9964Ca55393D1298E38655Bb5D8A39C5',
  [baseSepolia.id]: '0x85B1d2F9de6048232DfDf1E738e284a69F5ff79c',
  [arbitrumSepolia.id]: '0x90f8e7466a6eaDA70E475da899e4D9aD77f0cE21',
  [optimismSepolia.id]: '0xCA255bC9162167160337fd1f0c12909C78855d95',
  [bscTestnet.id]: '0x5D96085343D83C2100dbB82B22bE5E7f70377b53',
  [polygonAmoy.id]: '0x0000000000000000000000000000000000000000',
  [arcTestnet.id]: '0xd105A71F0aCD88Af84BB4d9692De5ce8aFcEd367',
  // Mainnets (placeholders)
  [avalanche.id]: '0x0000000000000000000000000000000000000000',
  [base.id]: '0x0000000000000000000000000000000000000000',
  [arbitrum.id]: '0x0000000000000000000000000000000000000000',
  [optimism.id]: '0x0000000000000000000000000000000000000000',
  [bsc.id]: '0x0000000000000000000000000000000000000000',
  [polygon.id]: '0x0000000000000000000000000000000000000000',
  [arcMainnet.id]: '0x0000000000000000000000000000000000000000',
};

// ─── SCOREBOARD (VERIFIER) ADDRESSES ─────────────────────────────
// NOTE: This is now only used as a reference. We're using Supabase for scoreboard storage.
export const VERIFIER_ADDRESS_MAP: Record<number, `0x${string}`> = {
  // Testnets
  [avalancheFuji.id]: '0xE43d015Eb9b36048b4b78862BF80623c7cACCa80',
  [baseSepolia.id]: '0xA7f86B92b284e9767bABfb798D0278695Eb527fB',
  [arbitrumSepolia.id]: '0x3F1fF508b61E86Bd775e304DCEc9EbBE6261Ca2e',
  [optimismSepolia.id]: '0x8eE3C5cfEaF70299E0c16487Fa6219b79B0C71a4',
  [bscTestnet.id]: '0x437AC06671a3927186442EF7A580c092e36BAB6b',
  [polygonAmoy.id]: '0xf3fa437B722441301c8ec041D4e2dd704869e995',
  [arcTestnet.id]: '0xde748944D78Ed11A786751392Ec8923D3314B451',
  // Mainnets
  [avalanche.id]: '0x809E719EbB89e415c5d3A249D4a40172C28E4c99',
  [base.id]: '0xf3fa437B722441301c8ec041D4e2dd704869e995',
  [arbitrum.id]: '0xf3fa437B722441301c8ec041D4e2dd704869e995',
  [optimism.id]: '0xf3fa437B722441301c8ec041D4e2dd704869e995',
  [bsc.id]: '0xf3fa437B722441301c8ec041D4e2dd704869e995',
  [polygon.id]: '0xf3fa437B722441301c8ec041D4e2dd704869e995',
  [arcMainnet.id]: '0xf3fa437B722441301c8ec041D4e2dd704869e995',
};

// ─── CHAIN CONFIG ──────────────────────────────────────────────────

// Define custom Arc Testnet
export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
  },
});

// Define custom Arc Mainnet (placeholder)
export const arcMainnet = defineChain({
  id: 5042001,
  name: 'Arc Mainnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://arcscan.app' },
  },
});

// Toggle this to switch between testnets and mainnets easily
export const IS_MAINNET = false;

export const SUPPORTED_CHAINS = IS_MAINNET
  ? [avalanche, base, arbitrum, optimism, bsc, polygon, arcMainnet] as const
  : [avalanche, avalancheFuji, baseSepolia, arbitrumSepolia, optimismSepolia, bscTestnet, polygonAmoy, arcTestnet] as const;

// ─── HELPERS ──────────────────────────────────────────────────────

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as `0x${string}`;

export function getContractAddress(chainId: number): `0x${string}` {
  return CONTRACT_ADDRESS_MAP[chainId] ?? ZERO_ADDRESS;
}

export function getNftAddress(chainId: number): `0x${string}` {
  return NFT_ADDRESS_MAP[chainId] ?? ZERO_ADDRESS;
}

export function getVerifierAddress(chainId: number): `0x${string}` {
  return VERIFIER_ADDRESS_MAP[chainId] ?? ZERO_ADDRESS;
}

export function getUSDCAddress(chainId: number): `0x${string}` {
  return USDC_ADDRESS_MAP[chainId] ?? ZERO_ADDRESS;
}

export function getEscrowAddress(chainId: number): `0x${string}` {
  const address = ESCROW_CONTRACT_ADDRESSES[chainId as keyof typeof ESCROW_CONTRACT_ADDRESSES];
  return (address as `0x${string}`) ?? ZERO_ADDRESS;
}

export const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

// ─── ABIs ─────────────────────────────────────────────────────────

// ── FillGameTournament ────────────────────────────────────────────────────────
export const TOURNAMENT_ABI = [
  {
    inputs: [{ internalType: 'address', name: '_initialTreasury', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  { inputs: [], name: 'AlreadyPaid', type: 'error' },
  { inputs: [], name: 'BothPlayersMustPay', type: 'error' },
  { inputs: [], name: 'CasualMatchNoFee', type: 'error' },
  { inputs: [], name: 'EnforcedPause', type: 'error' },
  { inputs: [], name: 'ExactFeeRequired', type: 'error' },
  { inputs: [], name: 'ExpectedPause', type: 'error' },
  { inputs: [], name: 'InvalidEntryFee', type: 'error' },
  { inputs: [], name: 'InvalidMatchId', type: 'error' },
  { inputs: [], name: 'InvalidParticipants', type: 'error' },
  { inputs: [], name: 'InvalidTreasury', type: 'error' },
  { inputs: [], name: 'InvalidWinner', type: 'error' },
  { inputs: [], name: 'MatchAlreadyExists', type: 'error' },
  { inputs: [], name: 'MatchInactive', type: 'error' },
  { inputs: [], name: 'NoBalanceToWithdraw', type: 'error' },
  { inputs: [], name: 'NotParticipant', type: 'error' },
  { inputs: [], name: 'NotYetRefundable', type: 'error' },
  { inputs: [], name: 'NothingToRefund', type: 'error' },
  { inputs: [], name: 'OnlyOwnerForOfficial', type: 'error' },
  { inputs: [{ internalType: 'address', name: 'owner', type: 'address' }], name: 'OwnableInvalidOwner', type: 'error' },
  { inputs: [{ internalType: 'address', name: 'account', type: 'address' }], name: 'OwnableUnauthorizedAccount', type: 'error' },
  { inputs: [], name: 'PendingFeesNotWithdrawn', type: 'error' },
  { inputs: [], name: 'ReentrancyGuardReentrantCall', type: 'error' },
  { inputs: [], name: 'ResultSubmissionTimedOut', type: 'error' },
  { inputs: [{ internalType: 'address', name: 'token', type: 'address' }], name: 'SafeERC20FailedOperation', type: 'error' },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'uint256', name: 'oldFee', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'newFee', type: 'uint256' },
    ],
    name: 'EntryFeeUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'matchId', type: 'uint256' },
      { indexed: false, internalType: 'address', name: 'cancelledBy', type: 'address' },
    ],
    name: 'MatchCancelled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'matchId', type: 'uint256' },
      { indexed: false, internalType: 'address', name: 'creator', type: 'address' },
      { indexed: false, internalType: 'bool', name: 'isCasual', type: 'bool' },
    ],
    name: 'MatchCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'uint256', name: 'oldTimeout', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'newTimeout', type: 'uint256' },
    ],
    name: 'MatchTimeoutUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'address', name: 'oldContract', type: 'address' },
      { indexed: false, internalType: 'address', name: 'newContract', type: 'address' },
    ],
    name: 'NftContractUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'previousOwner', type: 'address' },
      { indexed: true, internalType: 'address', name: 'newOwner', type: 'address' },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: 'address', name: 'account', type: 'address' }],
    name: 'Paused',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'address', name: 'oldToken', type: 'address' },
      { indexed: false, internalType: 'address', name: 'newToken', type: 'address' },
    ],
    name: 'PaymentTokenUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'matchId', type: 'uint256' },
      { indexed: false, internalType: 'address', name: 'player', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'PlayerJoined',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'matchId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'winner', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'PrizeDistributed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'uint256', name: 'oldBps', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'newBps', type: 'uint256' },
    ],
    name: 'ProtocolFeeBpsUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'matchId', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'ProtocolFeeCollected',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'to', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
      { indexed: false, internalType: 'address', name: 'token', type: 'address' },
    ],
    name: 'ProtocolFeesWithdrawn',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'matchId', type: 'uint256' },
      { indexed: false, internalType: 'address', name: 'player', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'RefundClaimed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'matchId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'winner', type: 'address' },
      { indexed: false, internalType: 'string', name: 'scoreline', type: 'string' },
      { indexed: false, internalType: 'uint256', name: 'prizeToWinner', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'protocolFee', type: 'uint256' },
    ],
    name: 'ResultSubmitted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'address', name: 'oldTreasury', type: 'address' },
      { indexed: false, internalType: 'address', name: 'newTreasury', type: 'address' },
    ],
    name: 'TreasuryUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: 'address', name: 'account', type: 'address' }],
    name: 'Unpaused',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'matchId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'winner', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
    ],
    name: 'VictoryNFTMinted',
    type: 'event',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'matchId', type: 'uint256' }],
    name: 'cancelMatch',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'matchId', type: 'uint256' }],
    name: 'claimRefund',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { internalType: 'uint256', name: 'matchId', type: 'uint256' },
          { internalType: 'address', name: 'player1', type: 'address' },
          { internalType: 'string', name: 'player1Name', type: 'string' },
          { internalType: 'address', name: 'player2', type: 'address' },
          { internalType: 'string', name: 'player2Name', type: 'string' },
          { internalType: 'bool', name: 'isCasual', type: 'bool' },
        ],
        internalType: 'struct FillGameTournament.CreateMatchParams',
        name: 'p',
        type: 'tuple',
      },
    ],
    name: 'createMatch',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'entryFee',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'matchId', type: 'uint256' }],
    name: 'getMatch',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'id', type: 'uint256' },
          { internalType: 'address', name: 'player1', type: 'address' },
          { internalType: 'string', name: 'player1Name', type: 'string' },
          { internalType: 'address', name: 'player2', type: 'address' },
          { internalType: 'string', name: 'player2Name', type: 'string' },
          { internalType: 'bool', name: 'player1Paid', type: 'bool' },
          { internalType: 'bool', name: 'player2Paid', type: 'bool' },
          { internalType: 'uint256', name: 'lockedEntryFee', type: 'uint256' },
          { internalType: 'address', name: 'lockedPaymentToken', type: 'address' },
          { internalType: 'address', name: 'winner', type: 'address' },
          { internalType: 'string', name: 'scoreline', type: 'string' },
          { internalType: 'bool', name: 'isCompleted', type: 'bool' },
          { internalType: 'bool', name: 'isCancelled', type: 'bool' },
          { internalType: 'uint256', name: 'prizePool', type: 'uint256' },
          { internalType: 'uint256', name: 'createdAt', type: 'uint256' },
          { internalType: 'bool', name: 'isCasual', type: 'bool' },
        ],
        internalType: 'struct FillGameTournament.Match',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'matchId', type: 'uint256' }],
    name: 'joinMatch',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'matchTimeout',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'nftContract',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'pause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'paused',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'paymentToken',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'protocolFeeBalance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'protocolFeeBps',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_fee', type: 'uint256' }],
    name: 'setEntryFee',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_seconds', type: 'uint256' }],
    name: 'setMatchTimeout',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_nft', type: 'address' }],
    name: 'setNftContract',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_token', type: 'address' }],
    name: 'setPaymentToken',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_bps', type: 'uint256' }],
    name: 'setProtocolFeeBps',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_treasury', type: 'address' }],
    name: 'setTreasury',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'matchId', type: 'uint256' },
      { internalType: 'address', name: 'winnerAddr', type: 'address' },
      { internalType: 'string', name: 'scoreline', type: 'string' },
    ],
    name: 'submitResult',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'treasury',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'unpause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'withdrawProtocolFees',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  { stateMutability: 'payable', type: 'receive' },
] as const;

// ── FillingGameScoreboard ─────────────────────────────────────────────────────
// NOTE: This ABI is kept for reference but we're using Supabase for scoreboard storage.
export const SCOREBOARD_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'router', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  { inputs: [], name: 'ChainlinkNotAvailable', type: 'error' },
  { inputs: [], name: 'EmptyWinnerName', type: 'error' },
  { inputs: [], name: 'InvalidResponse', type: 'error' },
  { inputs: [], name: 'InvalidWinnerAddress', type: 'error' },
  { inputs: [{ internalType: 'address', name: 'owner', type: 'address' }], name: 'OwnableInvalidOwner', type: 'error' },
  { inputs: [{ internalType: 'address', name: 'account', type: 'address' }], name: 'OwnableUnauthorizedAccount', type: 'error' },
  { inputs: [], name: 'RequestNotFound', type: 'error' },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'address', name: 'oldRouter', type: 'address' },
      { indexed: false, internalType: 'address', name: 'newRouter', type: 'address' },
    ],
    name: 'ChainlinkRouterUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'previousOwner', type: 'address' },
      { indexed: true, internalType: 'address', name: 'newOwner', type: 'address' },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'winner', type: 'address' },
      { indexed: false, internalType: 'string', name: 'winnerName', type: 'string' },
      { indexed: false, internalType: 'uint256', name: 'score', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
      { indexed: false, internalType: 'bool', name: 'verified', type: 'bool' },
    ],
    name: 'ScoreRecorded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'requestId', type: 'bytes32' },
      { indexed: true, internalType: 'address', name: 'winner', type: 'address' },
      { indexed: false, internalType: 'string', name: 'winnerName', type: 'string' },
    ],
    name: 'VerificationRequested',
    type: 'event',
  },
  {
    inputs: [],
    name: 'chainlinkEnabled',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'chainlinkRouter',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'requestId', type: 'bytes32' },
      { internalType: 'bytes', name: 'response', type: 'bytes' },
      { internalType: 'bytes', name: 'err', type: 'bytes' },
    ],
    name: 'fulfillRequest',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getGameCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'count', type: 'uint256' }],
    name: 'getLatestResults',
    outputs: [
      {
        components: [
          { internalType: 'address', name: 'winner', type: 'address' },
          { internalType: 'string', name: 'winnerName', type: 'string' },
          { internalType: 'uint256', name: 'score', type: 'uint256' },
          { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
          { internalType: 'bool', name: 'verified', type: 'bool' },
        ],
        internalType: 'struct FillingGameScoreboard.GameResult[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'index', type: 'uint256' }],
    name: 'getResult',
    outputs: [
      {
        components: [
          { internalType: 'address', name: 'winner', type: 'address' },
          { internalType: 'string', name: 'winnerName', type: 'string' },
          { internalType: 'uint256', name: 'score', type: 'uint256' },
          { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
          { internalType: 'bool', name: 'verified', type: 'bool' },
        ],
        internalType: 'struct FillingGameScoreboard.GameResult',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'isChainlinkEnabled',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'winner', type: 'address' },
      { internalType: 'string', name: 'winnerName', type: 'string' },
      { internalType: 'uint256', name: 'score', type: 'uint256' },
      { internalType: 'bool', name: 'verified', type: 'bool' },
    ],
    name: 'recordScore',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'winner', type: 'address' },
      { internalType: 'string', name: 'winnerName', type: 'string' },
      { internalType: 'bytes', name: 'encodedRequest', type: 'bytes' },
      { internalType: 'uint64', name: 'subscriptionId', type: 'uint64' },
      { internalType: 'uint32', name: 'callbackGasLimit', type: 'uint32' },
      { internalType: 'bytes32', name: 'donId', type: 'bytes32' },
    ],
    name: 'sendVerificationRequest',
    outputs: [{ internalType: 'bytes32', name: 'requestId', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'router', type: 'address' }],
    name: 'setChainlinkRouter',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// ── FillGameVictoryNFT ────────────────────────────────────────────────────────
export const NFT_ABI = [
  { inputs: [], stateMutability: 'nonpayable', type: 'constructor' },
  { inputs: [], name: 'BaseURIAlreadyLocked', type: 'error' },
  {
    inputs: [
      { internalType: 'address', name: 'sender', type: 'address' },
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { internalType: 'address', name: 'owner', type: 'address' },
    ],
    name: 'ERC721IncorrectOwner',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'address', name: 'operator', type: 'address' },
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
    ],
    name: 'ERC721InsufficientApproval',
    type: 'error',
  },
  { inputs: [{ internalType: 'address', name: 'approver', type: 'address' }], name: 'ERC721InvalidApprover', type: 'error' },
  { inputs: [{ internalType: 'address', name: 'operator', type: 'address' }], name: 'ERC721InvalidOperator', type: 'error' },
  { inputs: [{ internalType: 'address', name: 'owner', type: 'address' }], name: 'ERC721InvalidOwner', type: 'error' },
  { inputs: [{ internalType: 'address', name: 'receiver', type: 'address' }], name: 'ERC721InvalidReceiver', type: 'error' },
  { inputs: [{ internalType: 'address', name: 'sender', type: 'address' }], name: 'ERC721InvalidSender', type: 'error' },
  { inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }], name: 'ERC721NonexistentToken', type: 'error' },
  { inputs: [], name: 'InvalidAddress', type: 'error' },
  { inputs: [], name: 'NotAuthorizedToBurn', type: 'error' },
  { inputs: [], name: 'NotAuthorizedToMint', type: 'error' },
  { inputs: [{ internalType: 'address', name: 'owner', type: 'address' }], name: 'OwnableInvalidOwner', type: 'error' },
  { inputs: [{ internalType: 'address', name: 'account', type: 'address' }], name: 'OwnableUnauthorizedAccount', type: 'error' },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'owner', type: 'address' },
      { indexed: true, internalType: 'address', name: 'approved', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
    ],
    name: 'Approval',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'owner', type: 'address' },
      { indexed: true, internalType: 'address', name: 'operator', type: 'address' },
      { indexed: false, internalType: 'bool', name: 'approved', type: 'bool' },
    ],
    name: 'ApprovalForAll',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'string', name: 'oldURI', type: 'string' },
      { indexed: false, internalType: 'string', name: 'newURI', type: 'string' },
    ],
    name: 'BaseTokenURIUpdated',
    type: 'event',
  },
  { anonymous: false, inputs: [], name: 'BaseURILocked', type: 'event' },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'previousOwner', type: 'address' },
      { indexed: true, internalType: 'address', name: 'newOwner', type: 'address' },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'address', name: 'oldContract', type: 'address' },
      { indexed: false, internalType: 'address', name: 'newContract', type: 'address' },
    ],
    name: 'TournamentContractUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'from', type: 'address' },
      { indexed: true, internalType: 'address', name: 'to', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
    ],
    name: 'Transfer',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'winner', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'matchId', type: 'uint256' },
    ],
    name: 'VictoryNFTMinted',
    type: 'event',
  },
  {
    inputs: [
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'baseTokenURI',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'baseURILocked',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'burn',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'getApproved',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'operator', type: 'address' },
    ],
    name: 'isApprovedForAll',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'lockBaseURI',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'matchId', type: 'uint256' },
    ],
    name: 'mintVictoryNft',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'from', type: 'address' },
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'from', type: 'address' },
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { internalType: 'bytes', name: 'data', type: 'bytes' },
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'operator', type: 'address' },
      { internalType: 'bool', name: 'approved', type: 'bool' },
    ],
    name: 'setApprovalForAll',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'string', name: '_newBaseURI', type: 'string' }],
    name: 'setBaseTokenURI',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_tournament', type: 'address' }],
    name: 'setTournamentContract',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes4', name: 'interfaceId', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'tokenMatchId',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'tournamentContract',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'from', type: 'address' },
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// ─── Backward-compat aliases ──────────────────────────────────────────────────
export const CONTRACT_ABI = TOURNAMENT_ABI;
export const NFT_CONTRACT_ABI = NFT_ABI;
export const VERIFIER_CONTRACT_ABI = SCOREBOARD_ABI;
