import { Button } from "@/components/ui/button";
import { Settings, Coins } from 'lucide-react';
import { useState } from 'react';
import { NetworkSwitcher } from './NetworkSwitcher';
import { BridgeDialog } from './BridgeDialog';
import SettingsDialog, { CustomTrack } from './SettingsDialog';
import { CircleWalletButton } from './CircleWalletButton';

interface GlobalHeaderProps {
  onThemeChange?: (theme: 'neon' | 'avalanche' | 'gold' | 'midnight' | 'royal' | 'ivory' | 'obsidian' | 'sapphire' | 'rosewood' | 'emerald' | 'platinum' | 'crimson') => void;
  theme?: 'neon' | 'avalanche' | 'gold' | 'midnight' | 'royal' | 'ivory' | 'obsidian' | 'sapphire' | 'rosewood' | 'emerald' | 'platinum' | 'crimson';
  onVolumeChange?: (volume: number) => void;
  volume?: number;
  onMusicToggle?: (enabled: boolean) => void;
  musicEnabled?: boolean;
  onSfxToggle?: (enabled: boolean) => void;
  sfxEnabled?: boolean;
  onMusicChange?: (music: string) => void;
  selectedMusic?: string;
  onBackgroundChange?: (background: any) => void;
  background?: any;
  onCustomWallpaperChange?: (url: string | undefined) => void;
  customWallpaperUrl?: string | undefined;
  customTracks?: any[];
  onCustomTrackAdd?: (track: any) => void;
  onCustomTrackDelete?: (index: number) => void;
}

export const GlobalHeader = ({
  onThemeChange,
  theme = 'avalanche',
  onVolumeChange,
  volume,
  onMusicToggle,
  musicEnabled,
  onSfxToggle,
  sfxEnabled,
  onMusicChange,
  selectedMusic,
  onBackgroundChange,
  background,
  onCustomWallpaperChange,
  customWallpaperUrl,
  customTracks,
  onCustomTrackAdd,
  onCustomTrackDelete,
}: GlobalHeaderProps) => {
  const [isBridgeOpen, setIsBridgeOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Get theme accent color for styling
  const getThemeAccent = () => {
    const accents: Record<string, string> = {
      neon: '#00f2fe',
      avalanche: '#E84142',
      gold: '#ffb400',
      midnight: '#00ff88',
      royal: '#D4AF37',
      ivory: '#C9A84C',
      obsidian: '#C0C0C0',
      sapphire: '#B8C6DB',
      rosewood: '#E8B4B8',
      emerald: '#D4AF37',
      platinum: '#2D2D2D',
      crimson: '#F7E7CE',
    };
    return accents[theme] || '#E84142';
  };

  const accentColor = getThemeAccent();

  const BridgeButton = () => (
    <Button 
      variant="ghost" 
      onClick={() => setIsBridgeOpen(true)} 
      className="h-10 px-4 rounded-xl glass-panel text-white flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
      style={{ 
        borderColor: `${accentColor}40`,
        boxShadow: `0 0 15px ${accentColor}20`
      }}
      title="Bridge Funds to Arc"
    >
      <Coins className="w-4 h-4" style={{ color: accentColor }} />
      <span>Bridge</span>
    </Button>
  );

  const RegisterButton = () => (
    <a
      href="https://fillinggame.vercel.app/"
      rel="noopener noreferrer"
      className="flex items-center gap-2 py-2 px-4 rounded-xl transition-all h-10"
      style={{ 
        backgroundColor: `${accentColor}15`,
        border: `1px solid ${accentColor}30`,
        boxShadow: `0 0 15px ${accentColor}10`
      }}
    >
      <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: accentColor }} />
      <span className="font-black uppercase tracking-[0.15em] text-[10px]" style={{ color: accentColor }}>Register</span>
    </a>
  );

  return (
    <>
      {/* Left Side - Bridge, Settings, Register */}
      <div className="fixed top-4 left-4 z-[9999] flex items-center gap-2">
        <BridgeButton />
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsSettingsOpen(true)} 
          className="w-10 h-10 rounded-xl glass-panel text-white hover:bg-white/10 transition-all"
          style={{ borderColor: `${accentColor}40` }}
        >
          <Settings className="w-5 h-5" style={{ color: accentColor }} />
        </Button>
        <RegisterButton />
      </div>

      {/* Right Side - Wallet Button + Network Switcher */}
      <div className="fixed top-4 right-4 z-[9999] flex items-center gap-2">
        <CircleWalletButton />
        <NetworkSwitcher />
      </div>

      {/* Bridge Dialog */}
      <BridgeDialog
        isOpen={isBridgeOpen}
        onClose={() => setIsBridgeOpen(false)}
      />

      {/* Settings Dialog */}
      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        onThemeChange={onThemeChange || (() => {})}
        volume={volume || 0.5}
        onVolumeChange={onVolumeChange || (() => {})}
        musicEnabled={musicEnabled || false}
        onMusicToggle={onMusicToggle || (() => {})}
        sfxEnabled={sfxEnabled || true}
        onSfxToggle={onSfxToggle || (() => {})}
        selectedMusic={selectedMusic || 'synth_wave'}
        onMusicChange={onMusicChange || (() => {})}
        customTracks={customTracks || []}
        onCustomTrackAdd={onCustomTrackAdd || (() => {})}
        onCustomTrackDelete={onCustomTrackDelete || (() => {})}
        background={background || 'sky'}
        onBackgroundChange={onBackgroundChange || (() => {})}
        customWallpaperUrl={customWallpaperUrl}
        onCustomWallpaperChange={onCustomWallpaperChange || (() => {})}
      />
    </>
  );
};
