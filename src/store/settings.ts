import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { persistStorage } from '@/lib/storage';
import type { ThemeMode } from '@/lib/theme';
import type { Plan } from '@/types';
import type { Locale } from '@/lib/i18n';

type SettingsState = {
  themePreference: ThemeMode;
  locale: Locale;
  currency: string;
  plan: Plan;
  userName: string;
  /** User-supplied Grok (xAI) API key, stored on-device. Optional — AI degrades
   *  gracefully to local summaries when absent. Read alongside EXPO_PUBLIC_GROK_API_KEY. */
  grokApiKey: string;
  hasOnboarded: boolean;
  setThemePreference: (mode: ThemeMode) => void;
  setLocale: (locale: Locale) => void;
  setCurrency: (currency: string) => void;
  setPlan: (plan: Plan) => void;
  setUserName: (name: string) => void;
  setGrokApiKey: (key: string) => void;
  completeOnboarding: () => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      themePreference: 'system',
      locale: 'en',
      currency: 'USD',
      plan: 'free',
      userName: '',
      grokApiKey: '',
      hasOnboarded: false,
      setThemePreference: (mode) => set({ themePreference: mode }),
      setLocale: (locale) => set({ locale }),
      setCurrency: (currency) => set({ currency }),
      setPlan: (plan) => set({ plan }),
      setUserName: (userName) => set({ userName }),
      setGrokApiKey: (grokApiKey) => set({ grokApiKey: grokApiKey.trim() }),
      completeOnboarding: () => set({ hasOnboarded: true }),
    }),
    {
      name: 'trackify.settings',
      storage: createJSONStorage(() => persistStorage),
    },
  ),
);
