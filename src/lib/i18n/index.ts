import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import { I18nManager } from 'react-native';

import en from './locales/en.json';
import es from './locales/es.json';
import ar from './locales/ar.json';
import ur from './locales/ur.json';
import hi from './locales/hi.json';
import pt from './locales/pt.json';
import fr from './locales/fr.json';
import de from './locales/de.json';

export const SUPPORTED_LOCALES = ['en', 'es', 'ar', 'ur', 'hi', 'pt', 'fr', 'de'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const RTL_LOCALES: Locale[] = ['ar', 'ur'];

const resources = {
  en: { translation: en },
  es: { translation: es },
  ar: { translation: ar },
  ur: { translation: ur },
  hi: { translation: hi },
  pt: { translation: pt },
  fr: { translation: fr },
  de: { translation: de },
};

function detectLocale(): Locale {
  const device = getLocales()[0]?.languageCode ?? 'en';
  return (SUPPORTED_LOCALES as readonly string[]).includes(device)
    ? (device as Locale)
    : 'en';
}

export function applyRTL(locale: Locale) {
  const shouldBeRTL = RTL_LOCALES.includes(locale);
  if (I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);
    // Caller must restart the app for layout direction to fully take effect.
  }
}

i18n.use(initReactI18next).init({
  resources,
  lng: detectLocale(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

export default i18n;
