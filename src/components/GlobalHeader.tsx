import { Button } from "@/components/ui/button";
import { Settings, Coins } from 'lucide-react';
import { useState } from 'react';
import { NetworkSwitcher } from './NetworkSwitcher';
import { BridgeDialog } from './BridgeDialog';
import SettingsDialog, { CustomTrack } from './SettingsDialog';
import { CircleWalletButton } from './CircleWalletButton';

interface GlobalHeaderProps {
  onThemeChange?: (theme: 'neon' | 'avalanche' | 'gold' | 'midnight') => void;
  theme?: 'neon' | 'avalanche' | 'gold' | 'midnight';
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
  theme,
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

  const BridgeButton = () => (
    <Button
      variant="ghost"
      onClick={() => setIsBridgeOpen(true)}
      className="h-10 px-4 rounded-xl glass-panel border-white/10 text-white flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
      title="Bridge Funds to Arc"
    >
      <Coins className="w-4 h-4 text-primary" />
      <span>Bridge</span>
    </Button>
  );

  // ✅ NEW REGISTER BUTTON - This is what you want
  const RegisterButton = () => (
    <a
      href="https://fillinggame.vercel.app/"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 py-2 px-5 rounded-xl transition-all shadow-[0_0_15px_rgba(232,65,66,0.1)]"
    >
      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
      <span className="text-primary font-black uppercase tracking-[0.2em] text-[11px]">Register Match</span>
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
          className="w-10 h-10 rounded-xl glass-panel border-white/10 text-white hover:bg-white/10 transition-all"
        >
          <Settings className="w-5 h-5" />
        </Button>
        {/* ✅ REGISTER BUTTON - Right here, next to Settings */}
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
        theme={theme || 'neon'}
        onThemeChange={onThemeChange || (() => { })}
        volume={volume || 0.5}
        onVolumeChange={onVolumeChange || (() => { })}
        musicEnabled={musicEnabled || false}
        onMusicToggle={onMusicToggle || (() => { })}
        sfxEnabled={sfxEnabled || true}
        onSfxToggle={onSfxToggle || (() => { })}
        selectedMusic={selectedMusic || 'synth_wave'}
        onMusicChange={onMusicChange || (() => { })}
        customTracks={customTracks || []}
        onCustomTrackAdd={onCustomTrackAdd || (() => { })}
        onCustomTrackDelete={onCustomTrackDelete || (() => { })}
        background={background || 'sky'}
        onBackgroundChange={onBackgroundChange || (() => { })}
        customWallpaperUrl={customWallpaperUrl}
        onCustomWallpaperChange={onCustomWallpaperChange || (() => { })}
      />
    </>
  );
};