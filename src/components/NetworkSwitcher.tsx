import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown, Globe, Loader2 } from 'lucide-react';
import { useAccount, useSwitchChain, useChainId } from 'wagmi';
import { SUPPORTED_CHAINS } from '../lib/constants';
import { toast } from 'sonner';

const NETWORK_ICONS: Record<number, { icon: string; color: string; label: string }> = {
  1: { icon: '⟠', color: '#627EEA', label: 'Ethereum' },
  8453: { icon: '⬡', color: '#0052FF', label: 'Base' },
  42161: { icon: '🔷', color: '#2D374B', label: 'Arbitrum' },
  10: { icon: '🔴', color: '#FF0420', label: 'Optimism' },
  43114: { icon: '❄️', color: '#E84142', label: 'Avalanche' },
  137: { icon: '🟣', color: '#8247E5', label: 'Polygon' },
  56: { icon: '🟡', color: '#F0B90B', label: 'BNB' },
  250: { icon: '🔵', color: '#1969FF', label: 'Fantom' },
  5042002: { icon: '🌐', color: '#00D4AA', label: 'Arc Testnet' },
  11155111: { icon: '🧪', color: '#627EEA', label: 'Sepolia' },
  84532: { icon: '🧪', color: '#0052FF', label: 'Base Sepolia' },
  421614: { icon: '🧪', color: '#2D374B', label: 'Arb Sepolia' },
  11155420: { icon: '🧪', color: '#FF0420', label: 'Opt Sepolia' },
  43113: { icon: '🧪', color: '#E84142', label: 'Avalanche Fuji' },
};

export const NetworkSwitcher = () => {
  const { switchChain, isPending } = useSwitchChain();
  const chainId = useChainId();
  const { isConnected } = useAccount();
  const [isOpen, setIsOpen] = useState(false);
  const [currentChainId, setCurrentChainId] = useState<number>(chainId);

  useEffect(() => {
    if (chainId) {
      setCurrentChainId(chainId);
    }
  }, [chainId]);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleChainChanged = (chainIdHex: string) => {
      const newChainId = parseInt(chainIdHex, 16);
      setCurrentChainId(newChainId);
      toast.success(`Switched to ${getNetworkLabel(newChainId)}`);
    };

    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  const getNetworkLabel = (id: number) => {
    return NETWORK_ICONS[id]?.label || SUPPORTED_CHAINS.find(c => c.id === id)?.name || 'Unknown';
  };

  const getNetworkIcon = (id: number) => {
    return NETWORK_ICONS[id]?.icon || '🌐';
  };

  const getNetworkColor = (id: number) => {
    return NETWORK_ICONS[id]?.color || '#6B7280';
  };

  const handleSwitchNetwork = async (chainId: number) => {
    if (!isConnected) {
      toast.error('Please connect your wallet first!');
      return;
    }

    if (chainId === currentChainId) {
      setIsOpen(false);
      return;
    }

    try {
      await switchChain({ chainId });
      setCurrentChainId(chainId);
      setIsOpen(false);
      toast.success(`Switched to ${getNetworkLabel(chainId)}`);
    } catch (error: any) {
      console.error('Network switch error:', error);
      if (error.message?.includes('user rejected')) {
        toast.error('Network switch rejected');
      } else {
        toast.error('Failed to switch network. Please try again.');
      }
    }
  };

  if (!isConnected) {
    return null;
  }

  const currentLabel = getNetworkLabel(currentChainId);
  const currentIcon = getNetworkIcon(currentChainId);
  const currentColor = getNetworkColor(currentChainId);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-xl glass-panel border-white/10 text-white hover:bg-white/10 transition-all relative group"
        title={`Current Network: ${currentLabel}`}
      >
        {isPending ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <span className="text-lg">{currentIcon}</span>
            <div 
              className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: currentColor }}
            />
          </>
        )}
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-56 bg-[#1a1a2e] border border-gray-700 rounded-xl shadow-xl p-1 z-50">
            <div className="px-3 py-2 border-b border-gray-700">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                Switch Network
              </span>
            </div>

            {SUPPORTED_CHAINS.map((chain) => {
              const isActive = chain.id === currentChainId;
              const icon = getNetworkIcon(chain.id);
              const color = getNetworkColor(chain.id);
              const label = getNetworkLabel(chain.id);

              return (
                <button
                  key={chain.id}
                  onClick={() => handleSwitchNetwork(chain.id)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2.5 rounded-lg
                    transition-all duration-200 text-left
                    ${isActive 
                      ? 'bg-primary/20 text-white' 
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{icon}</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{label}</span>
                      <span className="text-[9px] text-white/30 font-mono">
                        {chain.id}
                      </span>
                    </div>
                  </div>
                  {isActive && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </button>
              );
            })}

            <div className="px-3 py-2 border-t border-gray-700 mt-1">
              <div className="flex items-center gap-2">
                <div 
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ backgroundColor: currentColor }}
                />
                <span className="text-[8px] text-white/30 font-mono uppercase tracking-wider">
                  Connected to {currentLabel}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NetworkSwitcher;