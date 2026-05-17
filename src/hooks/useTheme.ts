import { useColorScheme } from 'nativewind';
import { useSettingsStore } from '@/store/settings';
import { semanticTokens, type ThemeMode } from '@/lib/theme';

/**
 * Resolves the effective theme (light | dark | amoled) from user preference + OS.
 * Returns semantic color tokens so components like SVGs/charts that can't use NativeWind
 * classes still have access to the active palette.
 */
export function useTheme() {
  const { colorScheme: nwScheme, setColorScheme } = useColorScheme();
  const preference = useSettingsStore((s) => s.themePreference);
  const setPreference = useSettingsStore((s) => s.setThemePreference);

  const effective: Exclude<ThemeMode, 'system'> =
    preference === 'system'
      ? (nwScheme === 'dark' ? 'dark' : 'light')
      : preference;

  const colors = semanticTokens[effective];

  function setMode(mode: ThemeMode) {
    setPreference(mode);
    if (mode === 'system') {
      setColorScheme('system');
    } else if (mode === 'amoled') {
      setColorScheme('dark');
    } else {
      setColorScheme(mode);
    }
  }

  return { mode: effective, preference, setMode, colors };
}
