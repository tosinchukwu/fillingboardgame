// src/providers/Web3Provider.tsx (or wherever your Web3 provider is)
import { createWeb3Modal } from '@web3modal/wagmi/react'
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { WagmiProvider } from 'wagmi'
import { WALLET_CONNECT_PROJECT_ID, SUPPORTED_CHAINS } from '../lib/constants'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, Component, ErrorInfo, useEffect, useState } from 'react'

console.log("Project ID value:", WALLET_CONNECT_PROJECT_ID);
console.log("Project ID type:", typeof WALLET_CONNECT_PROJECT_ID);

// ─── FIX: Delay Web3Modal initialization ──────────────────────────
let config: ReturnType<typeof defaultWagmiConfig> | null = null;
let initError: string | null = null;

// 1. Get projectId from https://cloud.walletconnect.com
const projectId = WALLET_CONNECT_PROJECT_ID;

// ─── Check if projectId is valid ──────────────────────────────────
if (!projectId || projectId === 'undefined' || projectId === 'null') {
  console.error('❌ Invalid WalletConnect Project ID');
}

// 2. Create wagmiConfig (wrapped in try-catch)
try {
  const metadata = {
    name: 'Filling Game',
    description: 'Filling Game Multichain',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://fillingdartgame.vercel.app',
    icons: ['https://avatars.githubusercontent.com/u/37784886']
  }

  config = defaultWagmiConfig({
    chains: SUPPORTED_CHAINS,
    projectId,
    metadata,
  })

  // 3. Create modal (but delay it)
  // We'll create it in the component after mount
} catch (e) {
  console.error("Web3 initialization failed:", e);
  initError = e instanceof Error ? e.message : String(e);
}

const queryClient = new QueryClient()

// Error boundary
class Web3ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Web3Provider Error Boundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: '#ff6b6b', background: '#1a1a2e', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h2>⚠️ Application Error</h2>
          <p>Something went wrong loading the application.</p>
          <pre style={{ background: '#0d0d1a', padding: '1rem', borderRadius: '8px', overflow: 'auto' }}>
            {this.state.error}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#4ecdc4', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#1a1a2e', fontWeight: 'bold' }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function Web3Provider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  // ─── Initialize Web3Modal after mount ────────────────────────────
  useEffect(() => {
    if (!isReady && config && !initError) {
      try {
        // Delay initialization to avoid TDZ issues
        const timer = setTimeout(() => {
          // Create modal only after mount
          const { createWeb3Modal } = require('@web3modal/wagmi/react');
          createWeb3Modal({
            wagmiConfig: config!,
            projectId,
            enableAnalytics: true,
            enableOnramp: true,
          });
          setIsReady(true);
        }, 100);
        return () => clearTimeout(timer);
      } catch (e) {
        console.error("Web3Modal creation failed:", e);
        initError = e instanceof Error ? e.message : String(e);
      }
    }
  }, [isReady]);

  if (initError || !config) {
    return (
      <Web3ErrorBoundary>
        <div style={{ padding: '2rem', color: '#ff6b6b', background: '#1a1a2e', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h2>⚠️ Web3 Initialization Failed</h2>
          <p>The wallet connection system failed to load. The game may still work in solo mode.</p>
          {initError && (
            <pre style={{ background: '#0d0d1a', padding: '1rem', borderRadius: '8px', overflow: 'auto' }}>
              {initError}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#4ecdc4', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#1a1a2e', fontWeight: 'bold' }}
          >
            Retry
          </button>
        </div>
      </Web3ErrorBoundary>
    );
  }

  return (
    <Web3ErrorBoundary>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </Web3ErrorBoundary>
  )
}
