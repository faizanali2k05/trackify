import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandMMKVStorage } from '@/lib/mmkv';
import type { ThemeMode } from '@/lib/theme';
import type { Plan } from '@/types';
import type { Locale } from '@/lib/i18n';

type SettingsState = {
  themePreference: ThemeMode;
  locale: Locale;
  currency: string;
  plan: Plan;
  hasOnboarded: boolean;
  setThemePreference: (mode: ThemeMode) => void;
  setLocale: (locale: Locale) => void;
  setCurrency: (currency: string) => void;
  setPlan: (plan: Plan) => void;
  completeOnboarding: () => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      themePreference: 'system',
      locale: 'en',
      currency: 'USD',
      plan: 'free',
      hasOnboarded: false,
      setThemePreference: (mode) => set({ themePreference: mode }),
      setLocale: (locale) => set({ locale }),
      setCurrency: (currency) => set({ currency }),
      setPlan: (plan) => set({ plan }),
      completeOnboarding: () => set({ hasOnboarded: true }),
    }),
    {
      name: 'spendify.settings',
      storage: createJSONStorage(() => zustandMMKVStorage),
    },
  ),
);
