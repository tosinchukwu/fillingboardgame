import React, { useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Volume2, Music, Palette, Upload, Trash2, ImageIcon, X } from 'lucide-react';
import { BackgroundMode } from './BackgroundLayer';

export interface CustomTrack {
    name: string;
    url: string;
}

interface SettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    theme: string;
    onThemeChange: (theme: any) => void;
    volume: number;
    onVolumeChange: (val: number) => void;
    musicEnabled: boolean;
    onMusicToggle: (val: boolean) => void;
    sfxEnabled: boolean;
    onSfxToggle: (val: boolean) => void;
    selectedMusic: string;
    onMusicChange: (val: string) => void;
    customTracks: CustomTrack[];
    onCustomTrackAdd: (track: CustomTrack) => void;
    onCustomTrackDelete: (index: number) => void;
    background: BackgroundMode;
    onBackgroundChange: (mode: BackgroundMode) => void;
    customWallpaperUrl?: string;
    onCustomWallpaperChange: (url: string) => void;
}

const MAX_DURATION_SECONDS = 300;

const SettingsDialog: React.FC<SettingsDialogProps> = ({
    isOpen,
    onClose,
    theme,
    onThemeChange,
    volume,
    onVolumeChange,
    musicEnabled,
    onMusicToggle,
    sfxEnabled,
    onSfxToggle,
    selectedMusic,
    onMusicChange,
    customTracks,
    onCustomTrackAdd,
    onCustomTrackDelete,
    background,
    onBackgroundChange,
    customWallpaperUrl,
    onCustomWallpaperChange,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const wallpaperInputRef = useRef<HTMLInputElement>(null);

    const themes = [
        { id: 'neon', label: 'Neon', icon: '💜', category: 'Modern', color: '#00f2fe' },
        { id: 'avalanche', label: 'Avalanche', icon: '❄️', category: 'Modern', color: '#E84142' },
        { id: 'gold', label: 'Gold', icon: '✨', category: 'Modern', color: '#ffb400' },
        { id: 'midnight', label: 'Midnight', icon: '🌙', category: 'Modern', color: '#00ff88' },
        { id: 'royal', label: 'Royal', icon: '👑', category: 'Classical', color: '#D4AF37' },
        { id: 'ivory', label: 'Ivory', icon: '🤍', category: 'Classical', color: '#C9A84C' },
        { id: 'obsidian', label: 'Obsidian', icon: '🖤', category: 'Classical', color: '#C0C0C0' },
        { id: 'sapphire', label: 'Sapphire', icon: '💎', category: 'Classical', color: '#B8C6DB' },
        { id: 'rosewood', label: 'Rosewood', icon: '🌹', category: 'Classical', color: '#E8B4B8' },
        { id: 'emerald', label: 'Emerald', icon: '💚', category: 'Classical', color: '#D4AF37' },
        { id: 'platinum', label: 'Platinum', icon: '⭐', category: 'Classical', color: '#2D2D2D' },
        { id: 'crimson', label: 'Crimson', icon: '❤️', category: 'Classical', color: '#F7E7CE' },
    ];

    const musicTracks = [
        { id: 'synth_wave', label: 'Neon Pulsar (Synth)' },
        { id: 'lofi_chill', label: 'Orbit Chill (Lo-Fi)' },
        { id: 'high_energy', label: 'Hyperdrive (Energy)' },
        { id: 'stand_up', label: 'Stand Up (Victory)' },
    ];

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.type !== 'audio/mpeg' && !file.name.toLowerCase().endsWith('.mp3')) {
            alert('Only MP3 files are allowed.');
            e.target.value = '';
            return;
        }
        const url = URL.createObjectURL(file);
        const audio = new Audio(url);
        audio.addEventListener('loadedmetadata', () => {
            if (audio.duration > MAX_DURATION_SECONDS) {
                alert(`Track is too long (${Math.round(audio.duration / 60)} min). Maximum is 5 minutes.`);
                URL.revokeObjectURL(url);
            } else {
                onCustomTrackAdd({ name: file.name.replace(/\.mp3$/i, ''), url });
                onMusicChange(`custom_${customTracks.length}`);
            }
            e.target.value = '';
        });
        audio.addEventListener('error', () => {
            alert('Could not read this file. Please choose a valid MP3.');
            URL.revokeObjectURL(url);
            e.target.value = '';
        });
    };

    const handleDeleteCustomTrack = (index: number) => {
        if (selectedMusic === `custom_${index}`) {
            onMusicChange('synth_wave');
        }
        onCustomTrackDelete(index);
    };

    const bgOptions: { id: BackgroundMode; label: string; preview: string }[] = [
        { id: 'sky', label: 'Default Sky', preview: '☁️' },
        { id: 'galaxy', label: 'Galaxy', preview: '🌌' },
        { id: 'globe', label: 'World Map', preview: '🌍' },
        { id: 'stadium', label: 'Stadium', preview: '🏟️' },
        { id: 'dartArena', label: 'Dart Arena', preview: '🎯' },
        { id: 'neonAlley', label: 'Neon Alley', preview: '💜' },
        { id: 'royalChamber', label: 'Royal Chamber', preview: '👑' },
        { id: 'custom', label: 'Custom Image', preview: '🖼️' },
    ];

    const handleWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert('Please upload a valid image file (JPG, PNG, WebP, etc.).');
            e.target.value = '';
            return;
        }
        const url = URL.createObjectURL(file);
        onCustomWallpaperChange(url);
        onBackgroundChange('custom');
        e.target.value = '';
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[95vw] max-w-[500px] max-h-[92vh] overflow-y-auto rounded-[1.5rem] p-4 sm:p-6 md:p-8 shadow-2xl custom-scrollbar animate-in zoom-in-95 duration-200"
                style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.96)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                }}
            >
                {/* Close Button - Bigger touch target */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2.5 sm:p-2 rounded-xl hover:bg-white/10 transition-colors text-white/60 hover:text-white/90 z-10 touch-target"
                    aria-label="Close settings"
                >
                    <X className="w-5 h-5 sm:w-5 sm:h-5" />
                </button>

                <DialogHeader className="mb-4 sm:mb-6 pr-10">
                    <DialogTitle className="text-xl sm:text-2xl md:text-3xl font-black italic tracking-tighter text-indigo-400 flex items-center gap-3 drop-shadow-sm">
                        MISSION CONTROL
                    </DialogTitle>
                    <DialogDescription className="text-white/50 font-mono-game uppercase tracking-[0.2em] text-[10px] sm:text-[9px] font-bold">
                        Adjust your tactical experience
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 sm:space-y-8">
                    {/* Wallpaper / Background Section */}
                    <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center gap-3 sm:gap-4 text-indigo-400">
                            <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 drop-shadow-sm" />
                            <span className="text-[11px] sm:text-xs font-mono-game uppercase tracking-[0.2em] font-black text-white/80">Background Wallpaper</span>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
                            {bgOptions.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => {
                                        if (opt.id === 'custom') {
                                            wallpaperInputRef.current?.click();
                                        } else {
                                            onBackgroundChange(opt.id);
                                        }
                                    }}
                                    className={`flex items-center gap-1.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl border transition-all hover:bg-white/5 touch-target ${
                                        background === opt.id ? 'border-primary bg-primary/15' : 'border-white/5 bg-transparent'
                                    }`}
                                >
                                    <span className="text-base sm:text-lg">{opt.preview}</span>
                                    <span className="text-[9px] sm:text-[10px] font-mono-game uppercase tracking-widest text-white/80 font-black truncate">
                                        {opt.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                        {background === 'custom' && customWallpaperUrl && (
                            <div className="flex items-center gap-2 sm:gap-3 p-2.5 bg-black/20 rounded-xl border border-white/10">
                                <img src={customWallpaperUrl} alt="Wallpaper preview" className="w-10 h-8 sm:w-14 sm:h-10 rounded-lg object-cover border border-white/10" />
                                <span className="text-[9px] sm:text-[9px] font-black text-white/80 uppercase tracking-widest flex-1 truncate">Custom wallpaper active</span>
                                <button onClick={() => wallpaperInputRef.current?.click()} className="text-[9px] sm:text-[9px] font-black text-indigo-400 underline uppercase tracking-widest touch-target">Change</button>
                            </div>
                        )}
                        <input
                            ref={wallpaperInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleWallpaperUpload}
                        />
                    </div>

                    <div className="h-px bg-white/5" />

                    {/* Theme Section */}
                    <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center gap-3 sm:gap-4 text-indigo-400">
                            <Palette className="w-4 h-4 sm:w-5 sm:h-5 drop-shadow-sm" />
                            <Label className="text-[11px] sm:text-xs font-mono-game uppercase tracking-[0.2em] font-black text-white/80">Visual Theme</Label>
                        </div>
                        
                        {/* Modern Themes */}
                        <div className="space-y-1.5">
                            <span className="text-[9px] sm:text-[8px] uppercase tracking-widest text-white/40 font-bold ml-1">Modern</span>
                            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                                {themes.filter(t => t.category === 'Modern').map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => onThemeChange(t.id)}
                                        className={`flex flex-col items-center gap-0.5 sm:gap-1 p-2 sm:p-3 rounded-xl border transition-all hover:bg-white/5 touch-target ${
                                            theme === t.id ? 'border-primary bg-primary/15 scale-105' : 'border-white/5 bg-transparent'
                                        }`}
                                    >
                                        <div 
                                            className="w-6 h-6 sm:w-6 sm:h-6 rounded-full shadow-[0_0_12px_currentColor]" 
                                            style={{ backgroundColor: t.color, color: t.color }} 
                                        />
                                        <span className="text-[8px] sm:text-[8px] font-black uppercase tracking-widest text-white/80">{t.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Classical & Elegance Themes */}
                        <div className="space-y-1.5 pt-2 border-t border-white/5">
                            <span className="text-[9px] sm:text-[8px] uppercase tracking-widest text-[#D4AF37]/60 font-bold ml-1 flex items-center gap-2">
                                <span>✦</span>
                                Classical &amp; Elegance
                                <span>✦</span>
                            </span>
                            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                                {themes.filter(t => t.category === 'Classical').map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => onThemeChange(t.id)}
                                        className={`flex flex-col items-center gap-0.5 sm:gap-1 p-2 sm:p-3 rounded-xl border transition-all hover:bg-white/5 touch-target ${
                                            theme === t.id ? 'border-[#D4AF37]/50 bg-white/10 scale-105' : 'border-white/5 bg-transparent'
                                        }`}
                                    >
                                        <div 
                                            className="w-6 h-6 sm:w-6 sm:h-6 rounded-full shadow-[0_0_12px_currentColor]" 
                                            style={{ backgroundColor: t.color, color: t.color }} 
                                        />
                                        <span className="text-[8px] sm:text-[8px] font-black uppercase tracking-widest text-white/80">{t.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-white/5" />

                    {/* Audio Section */}
                    <div className="space-y-4 sm:space-y-5">
                        <div className="flex items-center gap-3 sm:gap-4 text-indigo-400">
                            <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 drop-shadow-sm" />
                            <Label className="text-[11px] sm:text-xs font-mono-game uppercase tracking-[0.2em] font-black text-white/80">Audio Profile</Label>
                        </div>

                        <div className="space-y-4 sm:space-y-6 px-1 sm:px-2">
                            <div className="space-y-2 sm:space-y-3">
                                <div className="flex justify-between text-[10px] sm:text-[10px] font-mono-game uppercase tracking-widest text-white/70 font-black">
                                    <span>Master Volume</span>
                                    <span>{Math.round(volume * 100)}%</span>
                                </div>
                                <Slider
                                    value={[volume * 100]}
                                    max={100}
                                    step={1}
                                    onValueChange={(val) => onVolumeChange(val[0] / 100)}
                                    className="py-2 sm:py-4"
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex flex-col gap-0.5 sm:gap-1">
                                    <span className="text-[11px] sm:text-[11px] font-black text-white/80 uppercase tracking-wider">Background Music</span>
                                    <span className="text-[9px] sm:text-[9px] text-white/50 uppercase tracking-widest font-mono font-bold">Ambient score</span>
                                </div>
                                <Switch checked={musicEnabled} onCheckedChange={onMusicToggle} />
                            </div>

                            {musicEnabled && (
                                <div className="pt-2 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <Select value={selectedMusic} onValueChange={onMusicChange}>
                                        <SelectTrigger className="bg-white/5 border-white/10 text-white h-10 sm:h-10 text-[10px] sm:text-[10px] font-mono uppercase tracking-widest rounded-xl touch-target">
                                            <div className="flex items-center gap-2">
                                                <Music className="w-3.5 h-3.5 text-white/40" />
                                                <SelectValue placeholder="Select Track" />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-white/10 text-white">
                                            {musicTracks.map(track => (
                                                <SelectItem key={track.id} value={track.id} className="text-[10px] sm:text-[10px] font-mono uppercase tracking-widest focus:text-primary focus:bg-white/5">
                                                    {track.label}
                                                </SelectItem>
                                            ))}
                                            {customTracks.map((ct, i) => (
                                                <SelectItem key={`custom_${i}`} value={`custom_${i}`} className="text-[10px] sm:text-[10px] font-mono uppercase tracking-widest focus:text-primary focus:bg-white/5">
                                                    🎵 {ct.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <div className="mt-2 sm:mt-3 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] sm:text-[9px] font-black text-white/60 uppercase tracking-widest">Your Music ({customTracks.length}/2)</span>
                                            <span className="text-[8px] sm:text-[8px] text-white/30 italic">MP3 only · max 5 min</span>
                                        </div>

                                        {customTracks.map((ct, i) => (
                                            <div
                                                key={i}
                                                className={`flex items-center justify-between p-2 sm:p-2 rounded-xl border transition-all touch-target ${
                                                    selectedMusic === `custom_${i}` ? 'border-primary/60 bg-primary/10' : 'border-white/10 bg-black/10'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <Music className="w-3.5 h-3.5 text-white/40 shrink-0" />
                                                    <span
                                                        className="text-[9px] sm:text-[9px] text-white/80 font-black uppercase tracking-wider truncate max-w-[130px] sm:max-w-[160px] cursor-pointer"
                                                        onClick={() => onMusicChange(`custom_${i}`)}
                                                        title="Click to play"
                                                    >
                                                        {ct.name}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteCustomTrack(i)}
                                                    className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors shrink-0 touch-target"
                                                    title="Delete track"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}

                                        {customTracks.length < 2 && (
                                            <>
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="w-full flex items-center justify-center gap-2 p-3 sm:p-2.5 rounded-xl border border-dashed border-white/20 hover:border-white/40 hover:bg-white/5 transition-all touch-target"
                                                >
                                                    <Upload className="w-3.5 h-3.5 text-white/40" />
                                                    <span className="text-[9px] sm:text-[9px] font-black text-white/60 uppercase tracking-widest">
                                                        Upload MP3 (max 5 min)
                                                    </span>
                                                </button>
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept=".mp3,audio/mpeg"
                                                    className="hidden"
                                                    onChange={handleFileUpload}
                                                />
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <div className="flex flex-col gap-0.5 sm:gap-1">
                                    <span className="text-[11px] sm:text-[11px] font-black text-white/80 uppercase tracking-wider">Sound Effects (SFX)</span>
                                    <span className="text-[9px] sm:text-[9px] text-white/50 uppercase tracking-widest font-mono font-bold">Tactile feedback</span>
                                </div>
                                <Switch checked={sfxEnabled} onCheckedChange={onSfxToggle} />
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-white/5" />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default SettingsDialog;