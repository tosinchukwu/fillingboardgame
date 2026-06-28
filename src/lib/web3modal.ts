// src/lib/web3modal.ts
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { mainnet, sepolia } from 'wagmi/chains';
import { defineChain } from 'viem';

// ─── Custom chains ────────────────────────────────────────────────
export const arcTestnet = defineChain({
    id: 5042002,
    name: 'Arc Testnet',
    nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
    rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'] } },
    blockExplorers: { default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' } },
});

export const arcMainnet = defineChain({
    id: 5042001,
    name: 'Arc Mainnet',
    nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
    rpcUrls: { default: { http: ['https://rpc.arc.network'] } },
    blockExplorers: { default: { name: 'ArcScan', url: 'https://arcscan.app' } },
});

// ─── Project ID ────────────────────────────────────────────────────
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
if (!projectId) {
    console.warn('⚠️ Missing VITE_WALLETCONNECT_PROJECT_ID in .env');
}

const metadata = {
    name: 'Filling Board Game',
    description: 'Filling Board Game Web3 App',
    url: window.location.origin,
    icons: ['https://avatars.githubusercontent.com/u/37784886'],
};

const chains = [mainnet, sepolia, arcTestnet] as const;

export const wagmiConfig = defaultWagmiConfig({
    chains,
    projectId,
    metadata,
});

// ─── Create modal (no `chains` property – it's already in config) ──
createWeb3Modal({
    wagmiConfig,
    projectId,
    // 'chains' is NOT needed here – remove it
    themeMode: 'light',
    themeVariables: {
        '--w3m-color-mix': '#00BB7F',
        '--w3m-color-mix-strength': 40,
    },
});

console.log('✅ Web3Modal initialized from web3modal.ts');