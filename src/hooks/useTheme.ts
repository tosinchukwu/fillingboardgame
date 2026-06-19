import { useMemo } from 'react';

export type ThemeType = 'neon' | 'avalanche' | 'gold' | 'midnight' | 'royal' | 'ivory' | 'obsidian' | 'sapphire' | 'rosewood' | 'emerald' | 'platinum' | 'crimson';

export const THEME_COLORS: Record<ThemeType, {
    accent: string;
    accentRgb: string;
    primary: string;
    secondary: string;
    background: string;
    card: string;
    border: string;
    glow: string;
    text: string;
    textMuted: string;
}> = {
    neon: {
        accent: '#00f2fe',
        accentRgb: '0, 242, 254',
        primary: '#00f2fe',
        secondary: '#f0f',
        background: '#020205',
        card: '#0a0a1a',
        border: 'rgba(0, 242, 254, 0.2)',
        glow: 'rgba(0, 242, 254, 0.3)',
        text: '#ffffff',
        textMuted: 'rgba(255,255,255,0.5)',
    },
    avalanche: {
        accent: '#E84142',
        accentRgb: '232, 65, 66',
        primary: '#E84142',
        secondary: '#ffffff',
        background: '#08080c',
        card: '#0f0f1a',
        border: 'rgba(232, 65, 66, 0.2)',
        glow: 'rgba(232, 65, 66, 0.3)',
        text: '#ffffff',
        textMuted: 'rgba(255,255,255,0.5)',
    },
    gold: {
        accent: '#ffb400',
        accentRgb: '255, 180, 0',
        primary: '#ffb400',
        secondary: '#ff6a00',
        background: '#0a0a05',
        card: '#1a1a0a',
        border: 'rgba(255, 180, 0, 0.2)',
        glow: 'rgba(255, 180, 0, 0.3)',
        text: '#ffffff',
        textMuted: 'rgba(255,255,255,0.5)',
    },
    midnight: {
        accent: '#00ff88',
        accentRgb: '0, 255, 136',
        primary: '#00ff88',
        secondary: '#00d4ff',
        background: '#02050a',
        card: '#0a0f1a',
        border: 'rgba(0, 255, 136, 0.2)',
        glow: 'rgba(0, 255, 136, 0.3)',
        text: '#ffffff',
        textMuted: 'rgba(255,255,255,0.5)',
    },
    royal: {
        accent: '#D4AF37',
        accentRgb: '212, 175, 55',
        primary: '#D4AF37',
        secondary: '#8B0000',
        background: '#0A0404',
        card: '#1a0a0a',
        border: 'rgba(212, 175, 55, 0.25)',
        glow: 'rgba(212, 175, 55, 0.3)',
        text: '#ffffff',
        textMuted: 'rgba(255,255,255,0.5)',
    },
    ivory: {
        accent: '#C9A84C',
        accentRgb: '201, 168, 76',
        primary: '#C9A84C',
        secondary: '#8B7A3C',
        background: '#F5F0EB',
        card: '#EAE3D6',
        border: 'rgba(201, 168, 76, 0.25)',
        glow: 'rgba(201, 168, 76, 0.2)',
        text: '#1a1a1a',
        textMuted: 'rgba(26,26,26,0.5)',
    },
    obsidian: {
        accent: '#C0C0C0',
        accentRgb: '192, 192, 192',
        primary: '#C0C0C0',
        secondary: '#808080',
        background: '#0D0D0D',
        card: '#1a1a1a',
        border: 'rgba(192, 192, 192, 0.2)',
        glow: 'rgba(192, 192, 192, 0.2)',
        text: '#ffffff',
        textMuted: 'rgba(255,255,255,0.5)',
    },
    sapphire: {
        accent: '#B8C6DB',
        accentRgb: '184, 198, 219',
        primary: '#B8C6DB',
        secondary: '#0F1B3D',
        background: '#070E1E',
        card: '#0f1a2e',
        border: 'rgba(184, 198, 219, 0.2)',
        glow: 'rgba(184, 198, 219, 0.2)',
        text: '#ffffff',
        textMuted: 'rgba(255,255,255,0.5)',
    },
    rosewood: {
        accent: '#E8B4B8',
        accentRgb: '232, 180, 184',
        primary: '#E8B4B8',
        secondary: '#5C1A1B',
        background: '#0D0505',
        card: '#1a0a0a',
        border: 'rgba(232, 180, 184, 0.2)',
        glow: 'rgba(232, 180, 184, 0.2)',
        text: '#ffffff',
        textMuted: 'rgba(255,255,255,0.5)',
    },
    emerald: {
        accent: '#D4AF37',
        accentRgb: '212, 175, 55',
        primary: '#D4AF37',
        secondary: '#0D3B2E',
        background: '#050F0B',
        card: '#0a1a14',
        border: 'rgba(212, 175, 55, 0.2)',
        glow: 'rgba(212, 175, 55, 0.2)',
        text: '#ffffff',
        textMuted: 'rgba(255,255,255,0.5)',
    },
    platinum: {
        accent: '#2D2D2D',
        accentRgb: '45, 45, 45',
        primary: '#2D2D2D',
        secondary: '#C0C0C0',
        background: '#E8E6E4',
        card: '#D1CDCA',
        border: 'rgba(45, 45, 45, 0.2)',
        glow: 'rgba(45, 45, 45, 0.15)',
        text: '#1a1a1a',
        textMuted: 'rgba(26,26,26,0.5)',
    },
    crimson: {
        accent: '#F7E7CE',
        accentRgb: '247, 231, 206',
        primary: '#F7E7CE',
        secondary: '#8B1A1A',
        background: '#0A0404',
        card: '#1a0a0a',
        border: 'rgba(247, 231, 206, 0.2)',
        glow: 'rgba(247, 231, 206, 0.2)',
        text: '#ffffff',
        textMuted: 'rgba(255,255,255,0.5)',
    },
};

export const useTheme = (theme: ThemeType = 'avalanche') => {
    return useMemo(() => THEME_COLORS[theme] || THEME_COLORS.avalanche, [theme]);
};

export default useTheme;