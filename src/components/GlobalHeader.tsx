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

    return (
        <>
            {/* Global Header - Always Visible */}
            <div className="fixed top-4 right-4 z-[9999] flex items-center gap-2">
                {/* ✅ Circle Wallet Button with Balance */}
                <CircleWalletButton />

                {/* Bridge Button */}
                <BridgeButton />

                {/* Network Switcher */}
                <NetworkSwitcher />

                {/* Settings Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSettingsOpen(true)}
                    className="w-10 h-10 rounded-xl glass-panel border-white/10 text-white"
                >
                    <Settings className="w-5 h-5" />
                </Button>
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