/**
 * Raw color palette — DO NOT import directly into components.
 * Components must consume semantic tokens via NativeWind classes or `useTheme()`.
 */
export const palette = {
  deepViolet: '#7C3AED',
  neonPink: '#EC4899',
  electricBlue: '#3B82F6',
  emeraldGreen: '#10B981',
  carbonBlack: '#0A0A0F',
  frostedWhite: '#FAFAFA',
} as const;

export type ThemeMode = 'light' | 'dark' | 'amoled' | 'system';

export const semanticTokens = {
  light: {
    bg: '#FAFAFC',
    bgElevated: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceFrosted: 'rgba(255, 255, 255, 0.72)',
    text: '#111116',
    textMuted: '#5A5A69',
    textSubtle: '#8C8C9B',
    border: '#E6E6EE',
    accentViolet: '#7C3AED',
    accentPink: '#EC4899',
    accentBlue: '#3B82F6',
    accentEmerald: '#10B981',
    success: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
  },
  dark: {
    bg: '#0C0C12',
    bgElevated: '#14141C',
    surface: '#16161E',
    surfaceFrosted: 'rgba(28, 28, 38, 0.72)',
    text: '#F6F6FA',
    textMuted: '#A5A5B4',
    textSubtle: '#737382',
    border: '#282834',
    accentViolet: '#A78BFA',
    accentPink: '#F472B6',
    accentBlue: '#60A5FA',
    accentEmerald: '#34D399',
    success: '#34D399',
    danger: '#F87171',
    warning: '#FBBF24',
  },
  amoled: {
    bg: '#000000',
    bgElevated: '#06060A',
    surface: '#0A0A0E',
    surfaceFrosted: 'rgba(12, 12, 18, 0.85)',
    text: '#F6F6FA',
    textMuted: '#A0A0AF',
    textSubtle: '#696978',
    border: '#1E1E28',
    accentViolet: '#A78BFA',
    accentPink: '#F472B6',
    accentBlue: '#60A5FA',
    accentEmerald: '#34D399',
    success: '#34D399',
    danger: '#F87171',
    warning: '#FBBF24',
  },
} as const;

export type SemanticToken = keyof typeof semanticTokens.light;
