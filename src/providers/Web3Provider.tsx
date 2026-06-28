// src/providers/Web3Provider.tsx
import { createWeb3Modal } from '@web3modal/wagmi/react'
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { WagmiProvider } from 'wagmi'
import { WALLETCONNECT_PROJECT_ID, SUPPORTED_CHAINS } from '../lib/constants'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, Component, ErrorInfo, useEffect, useState } from 'react'

console.log("Project ID value:", WALLETCONNECT_PROJECT_ID);
console.log("Project ID type:", typeof WALLETCONNECT_PROJECT_ID);

// 1. Get projectId from https://cloud.walletconnect.com
const projectId = WALLETCONNECT_PROJECT_ID;

// ─── Check if projectId is valid ──────────────────────────────────
if (!projectId || projectId === 'undefined' || projectId === 'null') {
  console.error('❌ Invalid WalletConnect Project ID');
}

// 2. Create wagmiConfig (wrapped in try-catch)
let config: ReturnType<typeof defaultWagmiConfig> | null = null;
let initError: string | null = null;

try {
  const metadata = {
    name: 'Filling Game',
    description: 'Filling Game Multichain',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://fillingdartgame.vercel.app',
    icons: ['https://avatars.githubusercontent.com/u/37784886']
  }

  // Use only the first few chains to avoid conflicts
  const chains = SUPPORTED_CHAINS.slice(0, 6);

  config = defaultWagmiConfig({
    chains: chains,
    projectId,
    metadata,
  })

} catch (e) {
  console.error("Web3 initialization failed:", e);
  initError = e instanceof Error ? e.message : String(e);
}

const queryClient = new QueryClient()

// Error boundary to catch runtime crashes in child components
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
  const [modalError, setModalError] = useState<string | null>(null);

  // ─── CRITICAL: Initialize Web3Modal AFTER mount ──────────────
  useEffect(() => {
    // Only run once
    if (isReady || modalError) return;

    try {
      // Small delay to ensure DOM is fully ready
      const timer = setTimeout(() => {
        try {
          createWeb3Modal({
            wagmiConfig: config!,
            projectId,
            enableAnalytics: true,
            enableOnramp: true,
          });
          setIsReady(true);
          console.log('✅ Web3Modal initialized successfully');
        } catch (err) {
          console.error("Web3Modal creation failed:", err);
          setModalError(err instanceof Error ? err.message : String(err));
        }
      }, 100);
      
      return () => clearTimeout(timer);
    } catch (err) {
      console.error("Web3Modal setup error:", err);
      setModalError(err instanceof Error ? err.message : String(err));
    }
  }, [isReady, modalError]);

  // ─── Show error if Web3Modal fails ────────────────────────────
  if (modalError) {
    return (
      <div style={{ padding: '2rem', color: '#ff6b6b', background: '#1a1a2e', minHeight: '100vh', fontFamily: 'monospace' }}>
        <h2>⚠️ Wallet Connection Error</h2>
        <p>Failed to initialize wallet connection. The game may still work in solo mode.</p>
        <pre style={{ background: '#0d0d1a', padding: '1rem', borderRadius: '8px', overflow: 'auto' }}>
          {modalError}
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
