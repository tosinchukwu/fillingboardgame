import React, { useState, useRef, useEffect } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { SUPPORTED_CHAINS } from '../lib/constants';
import { Activity } from 'lucide-react';

// Chain brand colors for visual distinction
const CHAIN_COLORS: Record<number, string> = {
  // Avalanche
  43113: '#E84142', 43114: '#E84142',
  // Base
  84532: '#0052FF', 8453: '#0052FF',
  // Arbitrum
  421614: '#28A0F0', 42161: '#28A0F0',
  // Optimism
  11155420: '#FF0420', 10: '#FF0420',
  // BNB
  97: '#F0B90B', 56: '#F0B90B',
  // Polygon
  80002: '#8247E5', 137: '#8247E5',
  // Arc
  5042002: '#00D4AA', 5042001: '#00D4AA',
};

const CHAIN_ICONS: Record<number, string> = {
  43113: '🏔️', 43114: '🏔️',
  84532: '🔵', 8453: '🔵',
  421614: '🔷', 42161: '🔷',
  11155420: '🔴', 10: '🔴',
  97: '🟡', 56: '🟡',
  80002: '🟣', 137: '🟣',
  5042002: '🟢', 5042001: '🟢',
};

export const NetworkSwitcher: React.FC = () => {
  const { chain } = useAccount();
  const { switchChain, isPending } = useSwitchChain();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeColor = chain ? (CHAIN_COLORS[chain.id] || '#888') : '#888';
  const activeIcon = chain ? (CHAIN_ICONS[chain.id] || '⛓️') : '⛓️';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl glass-panel border border-white/10 hover:border-white/20 transition-all text-white group"
        style={{ boxShadow: `0 0 12px ${activeColor}22` }}
      >
        <span className="text-sm">{activeIcon}</span>
        <span className="text-[10px] font-black uppercase tracking-widest max-w-[100px] truncate">
          {chain?.name || 'No Network'}
        </span>
        <div
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ backgroundColor: activeColor }}
        />
        <Activity className="w-3 h-3 text-white/40 group-hover:text-white/70 transition-colors" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 glass-panel border border-white/10 rounded-xl overflow-hidden z-[100] shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-3 py-2 border-b border-white/5">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/30">
              Select Network
            </span>
          </div>
          <div className="max-h-[320px] overflow-y-auto py-1">
            {SUPPORTED_CHAINS.map((c) => {
              const isActive = chain?.id === c.id;
              const color = CHAIN_COLORS[c.id] || '#888';
              const icon = CHAIN_ICONS[c.id] || '⛓️';

              return (
                <button
                  key={c.id}
                  onClick={() => {
                    if (!isActive) {
                      switchChain({ chainId: c.id });
                    }
                    setIsOpen(false);
                  }}
                  disabled={isPending}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="text-base">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-black uppercase tracking-wider truncate">
                      {c.name}
                    </div>
                    <div className="text-[8px] text-white/30 font-mono tracking-wider">
                      Chain ID: {c.id}
                    </div>
                  </div>
                  {isActive && (
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-1.5 h-1.5 rounded-full animate-pulse"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-[8px] font-black uppercase tracking-widest" style={{ color }}>
                        Active
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {isPending && (
            <div className="px-3 py-2 border-t border-white/5 flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-[9px] font-black uppercase tracking-widest text-primary">
                Switching Network...
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NetworkSwitcher;
