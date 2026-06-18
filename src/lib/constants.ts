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

// ─── Tournament contract addresses ───────────────────────────────────────────
export const CONTRACT_ADDRESS_MAP: Record<number, `0x${string}`> = {
  // Testnets
  [avalancheFuji.id]: '0x3C9b881dF5d7A5219B887F2bf0e3ba2a96EE72D4',
  [baseSepolia.id]: '0x7056a1628f8afD8D9413b3Ffc701F6B357ED5ED8',
  [arbitrumSepolia.id]: '0x85c1B5304c00C2d09432C24B2f0F76Ac54a1D51F',
  [optimismSepolia.id]: '0x85c1B5304c00C2d09432C24B2f0F76Ac54a1D51F',
  [bscTestnet.id]: '0x85c1B5304c00C2d09432C24B2f0F76Ac54a1D51F',
  [polygonAmoy.id]: '0x306beA249FF7ee1057a5A0a5a17f108F5a1C7DF8',
  [arcTestnet.id]: '0x3B8abC0a3B8dA8cbc384D76bDac33E5eF4b13d7D',
  // Mainnets (placeholders — fill in after mainnet deploy)
  [avalanche.id]: '0x306beA249FF7ee1057a5A0a5a17f108F5a1C7DF8',
  [base.id]: '0x306beA249FF7ee1057a5A0a5a17f108F5a1C7DF8',
  [arbitrum.id]: '0x306beA249FF7ee1057a5A0a5a17f108F5a1C7DF8',
  [optimism.id]: '0x306beA249FF7ee1057a5A0a5a17f108F5a1C7DF8',
  [bsc.id]: '0x306beA249FF7ee1057a5A0a5a17f108F5a1C7DF8',
  [polygon.id]: '0x306beA249FF7ee1057a5A0a5a17f108F5a1C7DF8',
  [arcMainnet.id]: '0x306beA249FF7ee1057a5A0a5a17f108F5a1C7DF8',
};

// ─── Scoreboard contract addresses ───────────────────────────────────────────
export const VERIFIER_ADDRESS_MAP: Record<number, `0x${string}`> = {
  // Testnets
  [avalancheFuji.id]: '0xE43d015Eb9b36048b4b78862BF80623c7cACCa80',
  [baseSepolia.id]: '0xA7f86B92b284e9767bABfb798D0278695Eb527fB',
  [arbitrumSepolia.id]: '0x3F1fF508b61E86Bd775e304DCEc9EbBE6261Ca2e',
  [optimismSepolia.id]: '0x8eE3C5cfEaF70299E0c16487Fa6219b79B0C71a4',
  [bscTestnet.id]: '0x437AC06671a3927186442EF7A580c092e36BAB6b',
  [polygonAmoy.id]: '0xf3fa437B722441301c8ec041D4e2dd704869e995',
  [arcTestnet.id]: '0xde748944D78Ed11A786751392Ec8923D3314B451',
  // Mainnets (placeholders — fill in after mainnet deploy)
  [avalanche.id]: '0x809E719EbB89e415c5d3A249D4a40172C28E4c99',
  [base.id]: '0xf3fa437B722441301c8ec041D4e2dd704869e995',
  [arbitrum.id]: '0xf3fa437B722441301c8ec041D4e2dd704869e995',
  [optimism.id]: '0xf3fa437B722441301c8ec041D4e2dd704869e995',
  [bsc.id]: '0xf3fa437B722441301c8ec041D4e2dd704869e995',
  [polygon.id]: '0xf3fa437B722441301c8ec041D4e2dd704869e995',
  [arcMainnet.id]: '0xf3fa437B722441301c8ec041D4e2dd704869e995',
};

// ─── NFT contract addresses ───────────────────────────────────────────────────
export const NFT_ADDRESS_MAP: Record<number, `0x${string}`> = {
  // Testnets
  [avalancheFuji.id]: '0x5A32680e16260Ec4041FbEa17c624DCCC4E01646',
  [baseSepolia.id]: '0xf6cd8203779f3dc88f542a70D499df1495f18FB4',
  [arbitrumSepolia.id]: '0x374d1d57045f663A31618CEa74bbA87CA78726E7',
  [optimismSepolia.id]: '0x374d1d57045f663A31618CEa74bbA87CA78726E7',
  [bscTestnet.id]: '0x374d1d57045f663A31618CEa74bbA87CA78726E7',
  [polygonAmoy.id]: '0x0000000000000000000000000000000000000000',
  [arcTestnet.id]: '0x3008408537Ce8571cFE96ad49f406A1161B9DF29',
  // Mainnets (placeholders — fill in after mainnet deploy)
  [avalanche.id]: '0x0000000000000000000000000000000000000000',
  [base.id]: '0x0000000000000000000000000000000000000000',
  [arbitrum.id]: '0x0000000000000000000000000000000000000000',
  [optimism.id]: '0x0000000000000000000000000000000000000000',
  [bsc.id]: '0x0000000000000000000000000000000000000000',
  [polygon.id]: '0x0000000000000000000000000000000000000000',
  [arcMainnet.id]: '0x0000000000000000000000000000000000000000',
};

// ─── Switchboard On-Demand configuration ─────────────────────────────────────
// Replaces the Chainlink Functions setup. Populate router addresses per chain
// from https://docs.switchboard.xyz/docs-by-chain/evm and the feed id from
// https://app.switchboard.xyz after publishing the off-chain Function.

/** Switchboard Crossbar gateway (used by `src/lib/switchboard.ts` to fetch signed updates). */
export const SWITCHBOARD_CROSSBAR_URL =
  import.meta.env.VITE_SWITCHBOARD_CROSSBAR_URL || 'https://crossbar.switchboard.xyz';

/** Switchboard router contract per chain (canonical addresses from Switchboard docs). */
export const SWITCHBOARD_ROUTER_MAP: Record<number, `0x${string}`> = {
  // Testnets — TODO: replace 0x000… with the canonical router for each chain.
  [avalancheFuji.id]: '0x0000000000000000000000000000000000000000',
  [baseSepolia.id]: '0x0000000000000000000000000000000000000000',
  [arbitrumSepolia.id]: '0x0d251E9F64Fb3a146af61bB99d80471893b20cCF',
  [optimismSepolia.id]: '0x0000000000000000000000000000000000000000',
  [bscTestnet.id]: '0x0000000000000000000000000000000000000000',
  [polygonAmoy.id]: '0x0000000000000000000000000000000000000000',
  [arcTestnet.id]: '0x0000000000000000000000000000000000000000',
  // Mainnets
  [avalanche.id]: '0x0000000000000000000000000000000000000000',
  [base.id]: '0x0000000000000000000000000000000000000000',
  [arbitrum.id]: '0xad9b8604b6b97187cde9e826cdeb7033c8c37198',
  [optimism.id]: '0x0000000000000000000000000000000000000000',
  [bsc.id]: '0x0000000000000000000000000000000000000000',
  [polygon.id]: '0x0000000000000000000000000000000000000000',
  [arcMainnet.id]: '0x0000000000000000000000000000000000000000',
};

/**
 * Switchboard Function feed id per chain.
 * The same Switchboard Function (game replay verifier) is published once and
 * may be referenced on every chain — but each chain has its own deployed feed
 * id. Replace these after running through `contracts/README-MIGRATION.md`.
 */
export const SWITCHBOARD_FEED_ID_MAP: Record<number, `0x${string}`> = {
  // Testnets
  [avalancheFuji.id]: '0x0000000000000000000000000000000000000000000000000000000000000000',
  [baseSepolia.id]: '0x0000000000000000000000000000000000000000000000000000000000000000',
  [arbitrumSepolia.id]: '0x07546a4cbebf9b22dc3d4fba088ef4bdcaa892ae2028fc589d502e311e52e7e0',
  [optimismSepolia.id]: '0x0000000000000000000000000000000000000000000000000000000000000000',
  [bscTestnet.id]: '0x0000000000000000000000000000000000000000000000000000000000000000',
  [polygonAmoy.id]: '0x0000000000000000000000000000000000000000000000000000000000000000',
  [arcTestnet.id]: '0x0000000000000000000000000000000000000000000000000000000000000000',
  // Mainnets
  [avalanche.id]: '0x0000000000000000000000000000000000000000000000000000000000000000',
  [base.id]: '0x0000000000000000000000000000000000000000000000000000000000000000',
  [arbitrum.id]: '0x0000000000000000000000000000000000000000000000000000000000000000',
  [optimism.id]: '0x0000000000000000000000000000000000000000000000000000000000000000',
  [bsc.id]: '0x0000000000000000000000000000000000000000000000000000000000000000',
  [polygon.id]: '0x0000000000000000000000000000000000000000000000000000000000000000',
  [arcMainnet.id]: '0x0000000000000000000000000000000000000000000000000000000000000000',
};

/** Optional: cap for over-estimating the Switchboard fee (wei). */
export const SWITCHBOARD_MAX_FEE_WEI = BigInt(
  import.meta.env.VITE_SWITCHBOARD_MAX_FEE_WEI || '500000000000000', // 0.0005 ETH default
);

/** True if this chain has a configured Switchboard verifier feed. */
export function isSwitchboardConfigured(chainId: number): boolean {
  const router = SWITCHBOARD_ROUTER_MAP[chainId];
  const feed = SWITCHBOARD_FEED_ID_MAP[chainId];
  const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';
  return (
    !!router && router !== ZERO_ADDRESS &&
    !!feed && feed !== ZERO_BYTES32
  );
}

export const WALLET_CONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

// ─── Address getter functions ────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// ABIs — one export per contract, completely separated.
//
// Adding a new chain? Only update the address maps above.
// These ABIs apply to every chain — never duplicate them.
//
// Import guide:
//   Tournament  →  TOURNAMENT_ABI  +  CONTRACT_ADDRESS_MAP
//   Scoreboard  →  SCOREBOARD_ABI  +  VERIFIER_ADDRESS_MAP
//   NFT         →  NFT_ABI         +  NFT_ADDRESS_MAP
// ─────────────────────────────────────────────────────────────────────────────

export const TOURNAMENT_ABI = [{ "inputs": [{ "internalType": "address", "name": "_initialTreasury", "type": "address" }], "stateMutability": "nonpayable", "type": "constructor" }, { "inputs": [], "name": "AlreadyPaid", "type": "error" }, { "inputs": [], "name": "BothPlayersMustPay", "type": "error" }, { "inputs": [], "name": "CasualMatchNoFee", "type": "error" }, { "inputs": [], "name": "EnforcedPause", "type": "error" }, { "inputs": [], "name": "ExactFeeRequired", "type": "error" }, { "inputs": [], "name": "ExpectedPause", "type": "error" }, { "inputs": [], "name": "InvalidEntryFee", "type": "error" }, { "inputs": [], "name": "InvalidMatchId", "type": "error" }, { "inputs": [], "name": "InvalidParticipants", "type": "error" }, { "inputs": [], "name": "InvalidTreasury", "type": "error" }, { "inputs": [], "name": "InvalidWinner", "type": "error" }, { "inputs": [], "name": "MatchAlreadyExists", "type": "error" }, { "inputs": [], "name": "MatchInactive", "type": "error" }, { "inputs": [], "name": "NoBalanceToWithdraw", "type": "error" }, { "inputs": [], "name": "NotParticipant", "type": "error" }, { "inputs": [], "name": "NotYetRefundable", "type": "error" }, { "inputs": [], "name": "NothingToRefund", "type": "error" }, { "inputs": [], "name": "OnlyOwnerForOfficial", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }], "name": "OwnableInvalidOwner", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "OwnableUnauthorizedAccount", "type": "error" }, { "inputs": [], "name": "PendingFeesNotWithdrawn", "type": "error" }, { "inputs": [], "name": "ReentrancyGuardReentrantCall", "type": "error" }, { "inputs": [], "name": "ResultSubmissionTimedOut", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "token", "type": "address" }], "name": "SafeERC20FailedOperation", "type": "error" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "uint256", "name": "oldFee", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "newFee", "type": "uint256" }], "name": "EntryFeeUpdated", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "uint256", "name": "matchId", "type": "uint256" }, { "indexed": false, "internalType": "address", "name": "cancelledBy", "type": "address" }], "name": "MatchCancelled", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "uint256", "name": "matchId", "type": "uint256" }, { "indexed": false, "internalType": "address", "name": "creator", "type": "address" }, { "indexed": false, "internalType": "bool", "name": "isCasual", "type": "bool" }], "name": "MatchCreated", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "uint256", "name": "oldTimeout", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "newTimeout", "type": "uint256" }], "name": "MatchTimeoutUpdated", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "address", "name": "oldContract", "type": "address" }, { "indexed": false, "internalType": "address", "name": "newContract", "type": "address" }], "name": "NftContractUpdated", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }], "name": "OwnershipTransferred", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "address", "name": "account", "type": "address" }], "name": "Paused", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "address", "name": "oldToken", "type": "address" }, { "indexed": false, "internalType": "address", "name": "newToken", "type": "address" }], "name": "PaymentTokenUpdated", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "uint256", "name": "matchId", "type": "uint256" }, { "indexed": false, "internalType": "address", "name": "player", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "PlayerJoined", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "uint256", "name": "matchId", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "winner", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "PrizeDistributed", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "uint256", "name": "oldBps", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "newBps", "type": "uint256" }], "name": "ProtocolFeeBpsUpdated", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "uint256", "name": "matchId", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "ProtocolFeeCollected", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "address", "name": "token", "type": "address" }], "name": "ProtocolFeesWithdrawn", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "uint256", "name": "matchId", "type": "uint256" }, { "indexed": false, "internalType": "address", "name": "player", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "RefundClaimed", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "uint256", "name": "matchId", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "winner", "type": "address" }, { "indexed": false, "internalType": "string", "name": "scoreline", "type": "string" }, { "indexed": false, "internalType": "uint256", "name": "prizeToWinner", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "protocolFee", "type": "uint256" }], "name": "ResultSubmitted", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "address", "name": "oldTreasury", "type": "address" }, { "indexed": false, "internalType": "address", "name": "newTreasury", "type": "address" }], "name": "TreasuryUpdated", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "address", "name": "account", "type": "address" }], "name": "Unpaused", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "uint256", "name": "matchId", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "winner", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "tokenId", "type": "uint256" }], "name": "VictoryNFTMinted", "type": "event" }, { "inputs": [{ "internalType": "uint256", "name": "matchId", "type": "uint256" }], "name": "cancelMatch", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "matchId", "type": "uint256" }], "name": "claimRefund", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "components": [{ "internalType": "uint256", "name": "matchId", "type": "uint256" }, { "internalType": "address", "name": "player1", "type": "address" }, { "internalType": "string", "name": "player1Name", "type": "string" }, { "internalType": "address", "name": "player2", "type": "address" }, { "internalType": "string", "name": "player2Name", "type": "string" }, { "internalType": "bool", "name": "isCasual", "type": "bool" }], "internalType": "struct FillGameTournament.CreateMatchParams", "name": "p", "type": "tuple" }], "name": "createMatch", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "entryFee", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "matchId", "type": "uint256" }], "name": "getMatch", "outputs": [{ "components": [{ "internalType": "uint256", "name": "id", "type": "uint256" }, { "internalType": "address", "name": "player1", "type": "address" }, { "internalType": "string", "name": "player1Name", "type": "string" }, { "internalType": "address", "name": "player2", "type": "address" }, { "internalType": "string", "name": "player2Name", "type": "string" }, { "internalType": "bool", "name": "player1Paid", "type": "bool" }, { "internalType": "bool", "name": "player2Paid", "type": "bool" }, { "internalType": "uint256", "name": "lockedEntryFee", "type": "uint256" }, { "internalType": "address", "name": "lockedPaymentToken", "type": "address" }, { "internalType": "address", "name": "winner", "type": "address" }, { "internalType": "string", "name": "scoreline", "type": "string" }, { "internalType": "bool", "name": "isCompleted", "type": "bool" }, { "internalType": "bool", "name": "isCancelled", "type": "bool" }, { "internalType": "uint256", "name": "prizePool", "type": "uint256" }, { "internalType": "uint256", "name": "createdAt", "type": "uint256" }, { "internalType": "bool", "name": "isCasual", "type": "bool" }], "internalType": "struct FillGameTournament.Match", "name": "", "type": "tuple" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "matchId", "type": "uint256" }], "name": "joinMatch", "outputs": [], "stateMutability": "payable", "type": "function" }, { "inputs": [], "name": "matchTimeout", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "nftContract", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "owner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "pause", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "paused", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "paymentToken", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "protocolFeeBalance", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "protocolFeeBps", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "renounceOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_fee", "type": "uint256" }], "name": "setEntryFee", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_seconds", "type": "uint256" }], "name": "setMatchTimeout", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_nft", "type": "address" }], "name": "setNftContract", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_token", "type": "address" }], "name": "setPaymentToken", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_bps", "type": "uint256" }], "name": "setProtocolFeeBps", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_treasury", "type": "address" }], "name": "setTreasury", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "matchId", "type": "uint256" }, { "internalType": "address", "name": "winnerAddr", "type": "address" }, { "internalType": "string", "name": "scoreline", "type": "string" }], "name": "submitResult", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "newOwner", "type": "address" }], "name": "transferOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "treasury", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "unpause", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "withdrawProtocolFees", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "stateMutability": "payable", "type": "receive" }] as const;

// Switchboard-powered Scoreboard ABI. Read-only struct shape is identical to
// the old Chainlink contract so `VerifiedScoreboard.tsx` keeps working.
export const SCOREBOARD_ABI = [
  { "inputs": [{ "internalType": "address", "name": "_switchboard", "type": "address" }, { "internalType": "bytes32", "name": "_feedId", "type": "bytes32" }], "stateMutability": "nonpayable", "type": "constructor" },
  { "inputs": [], "name": "EmptyWinnerName", "type": "error" },
  { "inputs": [{ "internalType": "uint256", "name": "required", "type": "uint256" }, { "internalType": "uint256", "name": "provided", "type": "uint256" }], "name": "InsufficientFee", "type": "error" },
  { "inputs": [], "name": "InvalidResponse", "type": "error" },
  { "inputs": [], "name": "InvalidWinnerAddress", "type": "error" },
  { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }], "name": "OwnableInvalidOwner", "type": "error" },
  { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "OwnableUnauthorizedAccount", "type": "error" },
  { "inputs": [], "name": "SwitchboardNotConfigured", "type": "error" },
  { "inputs": [{ "internalType": "uint256", "name": "updatedAt", "type": "uint256" }, { "internalType": "uint256", "name": "nowTs", "type": "uint256" }], "name": "StaleUpdate", "type": "error" },
  { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "bytes32", "name": "oldFeedId", "type": "bytes32" }, { "indexed": false, "internalType": "bytes32", "name": "newFeedId", "type": "bytes32" }], "name": "FeedIdUpdated", "type": "event" },
  { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "uint64", "name": "oldMax", "type": "uint64" }, { "indexed": false, "internalType": "uint64", "name": "newMax", "type": "uint64" }], "name": "MaxUpdateAgeUpdated", "type": "event" },
  { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }], "name": "OwnershipTransferred", "type": "event" },
  { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "winner", "type": "address" }, { "indexed": false, "internalType": "string", "name": "winnerName", "type": "string" }, { "indexed": false, "internalType": "uint256", "name": "score", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }, { "indexed": false, "internalType": "bool", "name": "verified", "type": "bool" }], "name": "ScoreRecorded", "type": "event" },
  { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "address", "name": "oldRouter", "type": "address" }, { "indexed": false, "internalType": "address", "name": "newRouter", "type": "address" }], "name": "SwitchboardRouterUpdated", "type": "event" },
  { "inputs": [], "name": "feedId", "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "getGameCount", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "count", "type": "uint256" }], "name": "getLatestResults", "outputs": [{ "components": [{ "internalType": "address", "name": "winner", "type": "address" }, { "internalType": "uint96", "name": "padding1", "type": "uint96" }, { "internalType": "uint128", "name": "score", "type": "uint128" }, { "internalType": "uint64", "name": "timestamp", "type": "uint64" }, { "internalType": "bool", "name": "verified", "type": "bool" }, { "internalType": "string", "name": "winnerName", "type": "string" }], "internalType": "struct FillingGameScoreboard.GameResult[]", "name": "", "type": "tuple[]" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "index", "type": "uint256" }], "name": "getResult", "outputs": [{ "components": [{ "internalType": "address", "name": "winner", "type": "address" }, { "internalType": "uint96", "name": "padding1", "type": "uint96" }, { "internalType": "uint128", "name": "score", "type": "uint128" }, { "internalType": "uint64", "name": "timestamp", "type": "uint64" }, { "internalType": "bool", "name": "verified", "type": "bool" }, { "internalType": "string", "name": "winnerName", "type": "string" }], "internalType": "struct FillingGameScoreboard.GameResult", "name": "", "type": "tuple" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "name": "history", "outputs": [{ "internalType": "address", "name": "winner", "type": "address" }, { "internalType": "uint96", "name": "padding1", "type": "uint96" }, { "internalType": "uint128", "name": "score", "type": "uint128" }, { "internalType": "uint64", "name": "timestamp", "type": "uint64" }, { "internalType": "bool", "name": "verified", "type": "bool" }, { "internalType": "string", "name": "winnerName", "type": "string" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "maxUpdateAge", "outputs": [{ "internalType": "uint64", "name": "", "type": "uint64" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "owner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "winner", "type": "address" }, { "internalType": "string", "name": "winnerName", "type": "string" }, { "internalType": "uint256", "name": "score", "type": "uint256" }, { "internalType": "bool", "name": "verified", "type": "bool" }], "name": "recordScore", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [], "name": "renounceOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "bytes32", "name": "newFeedId", "type": "bytes32" }], "name": "setFeedId", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "uint64", "name": "newMax", "type": "uint64" }], "name": "setMaxUpdateAge", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "router", "type": "address" }], "name": "setSwitchboardRouter", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "bytes[]", "name": "updates", "type": "bytes[]" }, { "internalType": "string", "name": "winnerName", "type": "string" }], "name": "submitVerifiedResult", "outputs": [], "stateMutability": "payable", "type": "function" },
  { "inputs": [], "name": "switchboard", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "newOwner", "type": "address" }], "name": "transferOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "stateMutability": "payable", "type": "receive" }
] as const;

export const NFT_ABI = [{ "inputs": [], "stateMutability": "nonpayable", "type": "constructor" }, { "inputs": [], "name": "BaseURIAlreadyLocked", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "sender", "type": "address" }, { "internalType": "uint256", "name": "tokenId", "type": "uint256" }, { "internalType": "address", "name": "owner", "type": "address" }], "name": "ERC721IncorrectOwner", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "operator", "type": "address" }, { "internalType": "uint256", "name": "tokenId", "type": "uint256" }], "name": "ERC721InsufficientApproval", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "approver", "type": "address" }], "name": "ERC721InvalidApprover", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "operator", "type": "address" }], "name": "ERC721InvalidOperator", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }], "name": "ERC721InvalidOwner", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "receiver", "type": "address" }], "name": "ERC721InvalidReceiver", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "sender", "type": "address" }], "name": "ERC721InvalidSender", "type": "error" }, { "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }], "name": "ERC721NonexistentToken", "type": "error" }, { "inputs": [], "name": "InvalidAddress", "type": "error" }, { "inputs": [], "name": "NotAuthorizedToBurn", "type": "error" }, { "inputs": [], "name": "NotAuthorizedToMint", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }], "name": "OwnableInvalidOwner", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "OwnableUnauthorizedAccount", "type": "error" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "approved", "type": "address" }, { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" }], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "operator", "type": "address" }, { "indexed": false, "internalType": "bool", "name": "approved", "type": "bool" }], "name": "ApprovalForAll", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "string", "name": "oldURI", "type": "string" }, { "indexed": false, "internalType": "string", "name": "newURI", "type": "string" }], "name": "BaseTokenURIUpdated", "type": "event" }, { "anonymous": false, "inputs": [], "name": "BaseURILocked", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }], "name": "OwnershipTransferred", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "address", "name": "oldContract", "type": "address" }, { "indexed": false, "internalType": "address", "name": "newContract", "type": "address" }], "name": "TournamentContractUpdated", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" }], "name": "Transfer", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "winner", "type": "address" }, { "indexed": true, "internalType": "uint256", "name": "matchId", "type": "uint256" }], "name": "VictoryNFTMinted", "type": "event" }, { "inputs": [{ "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "tokenId", "type": "uint256" }], "name": "approve", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "baseTokenURI", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "baseURILocked", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }], "name": "burn", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }], "name": "getApproved", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "operator", "type": "address" }], "name": "isApprovedForAll", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "lockBaseURI", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "matchId", "type": "uint256" }], "name": "mintVictoryNft", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "name", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "owner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }], "name": "ownerOf", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "renounceOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "tokenId", "type": "uint256" }], "name": "safeTransferFrom", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "tokenId", "type": "uint256" }, { "internalType": "bytes", "name": "data", "type": "bytes" }], "name": "safeTransferFrom", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "operator", "type": "address" }, { "internalType": "bool", "name": "approved", "type": "bool" }], "name": "setApprovalForAll", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "string", "name": "_newBaseURI", "type": "string" }], "name": "setBaseTokenURI", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_tournament", "type": "address" }], "name": "setTournamentContract", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "bytes4", "name": "interfaceId", "type": "bytes4" }], "name": "supportsInterface", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "symbol", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "name": "tokenMatchId", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }], "name": "tokenURI", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "tournamentContract", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "tokenId", "type": "uint256" }], "name": "transferFrom", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "newOwner", "type": "address" }], "name": "transferOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }] as const;

// ─── Backward-compat aliases ──────────────────────────────────────────────────
// Existing components that import CONTRACT_ABI or NFT_CONTRACT_ABI keep working.
// New components should use TOURNAMENT_ABI / SCOREBOARD_ABI / NFT_ABI directly.
export const CONTRACT_ABI = TOURNAMENT_ABI;
export const NFT_CONTRACT_ABI = NFT_ABI;
export const VERIFIER_CONTRACT_ABI = SCOREBOARD_ABI;
