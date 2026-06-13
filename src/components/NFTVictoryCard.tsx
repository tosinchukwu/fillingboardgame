import React, { useState } from 'react';
import { Trophy, ShieldCheck, ExternalLink, Loader2, Sparkles } from 'lucide-react';

interface NFTVictoryCardProps {
  winnerName: string;
  score: number;
  matchId: string;
  isMinting: boolean;
  isMinted: boolean;
  txHash?: string;
  chainName?: string;
  explorerUrl?: string;
  theme?: 'neon' | 'avalanche' | 'gold' | 'midnight';
}

export const NFTVictoryCard: React.FC<NFTVictoryCardProps> = ({
  winnerName,
  score,
  matchId,
  isMinting,
  isMinted,
  txHash,
  chainName = 'Avalanche Fuji',
  explorerUrl,
  theme = 'neon',
}) => {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left - box.width / 2;
    const y = e.clientY - box.top - box.height / 2;
    
    // Rotate max 15 degrees depending on pointer position
    setRotateX(-y / (box.height / 30));
    setRotateY(x / (box.width / 30));
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  // Color mapping based on theme
  const themeColors = {
    neon: {
      border: 'border-[#10B981]',
      glow: 'shadow-[0_0_25px_rgba(16,185,129,0.35)]',
      bgGradients: 'from-[#052e16]/80 via-[#020617]/95 to-[#0f172a]/90',
      accentText: 'text-[#10B981]',
      bar: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    },
    avalanche: {
      border: 'border-[#E84142]',
      glow: 'shadow-[0_0_25px_rgba(232,65,66,0.35)]',
      bgGradients: 'from-[#450a0a]/80 via-[#020617]/95 to-[#0f172a]/90',
      accentText: 'text-[#E84142]',
      bar: 'bg-gradient-to-r from-red-500 to-rose-600',
    },
    gold: {
      border: 'border-[#F59E0B]',
      glow: 'shadow-[0_0_25px_rgba(245,158,11,0.35)]',
      bgGradients: 'from-[#451a03]/80 via-[#020617]/95 to-[#0f172a]/90',
      accentText: 'text-[#F59E0B]',
      bar: 'bg-gradient-to-r from-amber-500 to-yellow-500',
    },
    midnight: {
      border: 'border-[#3B82F6]',
      glow: 'shadow-[0_0_25px_rgba(59,130,246,0.35)]',
      bgGradients: 'from-[#1e3a8a]/80 via-[#020617]/95 to-[#0f172a]/90',
      accentText: 'text-[#3B82F6]',
      bar: 'bg-gradient-to-r from-blue-500 to-indigo-500',
    },
  }[theme] || {
    border: 'border-[#10B981]',
    glow: 'shadow-[0_0_25px_rgba(16,185,129,0.35)]',
    bgGradients: 'from-[#052e16]/80 via-[#020617]/95 to-[#0f172a]/90',
    accentText: 'text-[#10B981]',
    bar: 'bg-gradient-to-r from-emerald-500 to-teal-500',
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {/* Interactive 3D Perspective Card Wrapper */}
      <div
        className="perspective-[1000px] cursor-pointer"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className={`relative w-80 h-[440px] rounded-[2rem] border ${themeColors.border} ${themeColors.glow} p-6 flex flex-col justify-between overflow-hidden bg-gradient-to-br ${themeColors.bgGradients} transition-transform duration-200 ease-out`}
          style={{
            transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${isHovered ? 1.03 : 1})`,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Futuristic Holographic Shimmer Effect Overlay */}
          <div 
            className="absolute inset-0 pointer-events-none transition-opacity duration-300 opacity-30 mix-blend-overlay"
            style={{
              background: isHovered 
                ? `linear-gradient(${135 + rotateY * 3}deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.1) 100%)`
                : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
            }}
          />

          {/* Background Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

          {/* Top Status Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3 z-10" style={{ transform: 'translateZ(30px)' }}>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isMinted ? 'bg-emerald-400' : 'bg-primary'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isMinted ? 'bg-emerald-500' : 'bg-primary'}`}></span>
              </span>
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/50">
                {isMinted ? 'VERIFIED ERC-721' : isMinting ? 'MINTING IN PROGRESS...' : 'DIGITAL TROPHY'}
              </span>
            </div>
            <span className="text-[9px] font-mono font-black text-white/40 tracking-wider">
              ID: {matchId ? matchId.slice(0, 8) : '0xLOCAL'}
            </span>
          </div>

          {/* Interactive Card Core Showcase */}
          <div className="flex flex-col items-center justify-center my-6 z-10" style={{ transform: 'translateZ(50px)' }}>
            <div className="relative w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-inner group mb-4">
              {/* Outer Pulsing Aura */}
              <div className={`absolute inset-0 rounded-full bg-gradient-to-tr ${isMinted ? 'from-emerald-500/20 to-teal-500/20' : 'from-primary/20 to-secondary/20'} blur-xl animate-pulse`} />
              
              {isMinting ? (
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
              ) : isMinted ? (
                <ShieldCheck className="w-12 h-12 text-emerald-400 animate-bounce" />
              ) : (
                <Trophy className={`w-12 h-12 ${themeColors.accentText}`} />
              )}
            </div>

            <h3 className="text-xl font-mono-game tracking-widest uppercase font-black italic text-white text-center">
              TACTICAL VICTOR
            </h3>
            
            <div className={`h-1 w-20 ${themeColors.bar} rounded-full my-2`} />
            
            <span className="text-xs font-black tracking-widest text-white/50 uppercase mt-1">
              AWARDED TO
            </span>
            <span className="text-lg font-black tracking-wide text-white uppercase mt-0.5 max-w-[240px] truncate">
              {winnerName || 'Anonymous Player'}
            </span>
          </div>

          {/* Stats & Metadata Details */}
          <div className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-2.5 z-10" style={{ transform: 'translateZ(35px)' }}>
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/40 font-mono tracking-wider">COMBAT SCORE:</span>
              <span className="font-mono-game text-white font-black italic">{score} pts</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/40 font-mono tracking-wider">DEPLOYMENT:</span>
              <span className="font-black text-white/70 uppercase tracking-widest text-[9px]">{chainName}</span>
            </div>
            {isMinted && txHash && (
              <div className="flex items-center justify-between text-xs pt-1.5 border-t border-white/5">
                <span className="text-emerald-400/80 font-black tracking-widest text-[9px] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 animate-pulse" /> MINT SUCCESS!
                </span>
                <span className="font-mono text-[9px] text-white/40">
                  {txHash.slice(0, 6)}...{txHash.slice(-4)}
                </span>
              </div>
            )}
          </div>

          {/* Interactive Footer & Actions */}
          <div className="mt-4 z-10" style={{ transform: 'translateZ(20px)' }}>
            {isMinted && explorerUrl ? (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 rounded-xl text-emerald-400 font-black text-xs uppercase tracking-widest transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" /> View NFT in Wallet Explorer
              </a>
            ) : isMinting ? (
              <div className="flex items-center justify-center gap-2 w-full py-2.5 bg-white/5 border border-white/10 rounded-xl text-white/40 font-black text-xs uppercase tracking-widest">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> Minting Block NFT...
              </div>
            ) : (
              <div className="text-center text-[8.5px] font-black text-white/30 uppercase tracking-[0.2em]">
                Ready for On-Chain Broadcast
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
