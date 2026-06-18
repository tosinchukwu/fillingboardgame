import { Button } from "@/components/ui/button";
import { Settings, Coins } from 'lucide-react';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount, useDisconnect } from 'wagmi';
import { useState } from 'react';
import { NetworkSwitcher } from './NetworkSwitcher';
import { BridgeDialog } from './BridgeDialog';
import SettingsDialog, { CustomTrack } from './SettingsDialog';

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
    const { open } = useWeb3Modal();
    const { address, isConnected } = useAccount();
    const { disconnect } = useDisconnect();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isBridgeOpen, setIsBridgeOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const formatAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    const WalletButton = () => {
        if (!isConnected) {
            return (
                <Button
                    onClick={() => open()}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 
                   text-white font-medium px-4 py-2.5 rounded-xl transition-all duration-200 
                   flex items-center gap-2 shadow-lg shadow-purple-500/20 h-10 text-xs"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Connect Wallet
                </Button>
            );
        }

        return (
            <div className="relative">
                <Button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="bg-[#1a1a2e] border border-gray-700 hover:border-gray-500 
                   text-white font-medium px-4 py-2.5 rounded-xl transition-all 
                   flex items-center gap-2 h-10 text-xs"
                >
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="font-mono">{formatAddress(address)}</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </Button>

                {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-[#1a1a2e] border border-gray-700 rounded-xl shadow-xl py-1 z-50">
                        <div className="px-4 py-2 border-b border-gray-700">
                            <p className="text-xs text-gray-400">Connected</p>
                            <p className="text-sm text-white font-mono">{formatAddress(address)}</p>
                        </div>
                        <button
                            onClick={() => {
                                disconnect();
                                setIsDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 
                       transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Disconnect
                        </button>
                    </div>
                )}
            </div>
        );
    };

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
                <WalletButton />
                <BridgeButton />
                <NetworkSwitcher />
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSettingsOpen(true)}
                    className="w-10 h-10 rounded-xl glass-panel border-white/10 text-white"
                >
                    <Settings className="w-5 h-5" />
                </Button>
            </div>

            {/* Bridge Dialog - Always Accessible */}
            <BridgeDialog
                isOpen={isBridgeOpen}
                onClose={() => setIsBridgeOpen(false)}
            />

            {/* Settings Dialog - Always Accessible */}
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