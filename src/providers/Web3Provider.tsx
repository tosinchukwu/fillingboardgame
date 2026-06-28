// src/providers/Web3Provider.tsx
import { createWeb3Modal } from '@web3modal/wagmi/react'
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { WagmiProvider } from 'wagmi'
import { WALLETCONNECT_PROJECT_ID, SUPPORTED_CHAINS } from '../lib/constants'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, Component, ErrorInfo } from 'react'
import { Chain } from 'viem'  // <-- required for casting

console.log("Project ID value:", WALLETCONNECT_PROJECT_ID)
console.log("Project ID type:", typeof WALLETCONNECT_PROJECT_ID)

const projectId = WALLETCONNECT_PROJECT_ID

if (!projectId || projectId === 'undefined' || projectId === 'null') {
  console.error('❌ Invalid WalletConnect Project ID')
}

// ─── Create Wagmi config ──────────────────────────────────────────
let config: ReturnType<typeof defaultWagmiConfig> | null = null
let initError: string | null = null

try {
  const metadata = {
    name: 'Filling Game',
    description: 'Filling Game Multichain',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://fillingdartgame.vercel.app',
    icons: ['https://avatars.githubusercontent.com/u/37784886'],
  }

  // ✅ FIX: cast SUPPORTED_CHAINS to the required tuple type
  const chains = SUPPORTED_CHAINS as readonly [Chain, ...Chain[]]

  config = defaultWagmiConfig({
    chains,
    projectId,
    metadata,
  })
} catch (e) {
  console.error("Web3 initialization failed:", e)
  initError = e instanceof Error ? e.message : String(e)
}

// ─── IMMEDIATELY initialize Web3Modal (module level) ──────────
let modalInitError: string | null = null
if (config && projectId && projectId !== 'undefined' && projectId !== 'null') {
  try {
    createWeb3Modal({
      wagmiConfig: config,
      projectId,
      enableAnalytics: true,
      enableOnramp: true,
    })
    console.log('✅ Web3Modal initialized successfully')
  } catch (e) {
    console.error("Web3Modal creation failed:", e)
    modalInitError = e instanceof Error ? e.message : String(e)
  }
} else {
  modalInitError = 'Missing or invalid project ID or config'
}

const queryClient = new QueryClient()

// ─── Error Boundary ──────────────────────────────────────────────
class Web3ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Web3Provider Error Boundary caught:", error, errorInfo)
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
      )
    }
    return this.props.children
  }
}

// ─── Provider Component ──────────────────────────────────────────
export function Web3Provider({ children }: { children: ReactNode }) {
  const error = initError || modalInitError
  if (error || !config) {
    return (
      <div style={{ padding: '2rem', color: '#ff6b6b', background: '#1a1a2e', minHeight: '100vh', fontFamily: 'monospace' }}>
        <h2>⚠️ Web3 Initialization Failed</h2>
        <p>The wallet connection system failed to load. The game may still work in solo mode.</p>
        <pre style={{ background: '#0d0d1a', padding: '1rem', borderRadius: '8px', overflow: 'auto' }}>
          {error || 'Unknown error'}
        </pre>
        <button
          onClick={() => window.location.reload()}
          style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#4ecdc4', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#1a1a2e', fontWeight: 'bold' }}
        >
          Retry
        </button>
      </div>
    )
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