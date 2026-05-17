import { View, ScrollView, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Sun, Moon, Smartphone, Globe, Coins, Crown, LifeBuoy, Info, ChevronRight, Zap,
} from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Screen, Text, GlassCard, AuroraBackground } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { useSettingsStore } from '@/store/settings';
import { useHaptics } from '@/hooks/useHaptics';
import { SUPPORTED_LOCALES, applyRTL, type Locale } from '@/lib/i18n';
import type { ThemeMode } from '@/lib/theme';
import i18n from '@/lib/i18n';

function Row({
  icon, label, value, onPress, last,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  last?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center justify-between px-4 py-4 ${last ? '' : 'border-b border-border'}`}
    >
      <View className="flex-row items-center gap-3 flex-1">
        <View
          className="h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: colors.surface }}
        >
          {icon}
        </View>
        <Text variant="body">{label}</Text>
      </View>
      <View className="flex-row items-center gap-2">
        {value && (
          <Text variant="caption" muted>{value}</Text>
        )}
        <ChevronRight size={16} color={colors.textSubtle} strokeWidth={2.2} />
      </View>
    </Pressable>
  );
}

function ThemePicker() {
  const { t } = useTranslation();
  const { preference, setMode, colors } = useTheme();
  const h = useHaptics();
  const options: { mode: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'light', label: t('settings.theme_light'), icon: <Sun size={16} color={colors.text} strokeWidth={2.2} /> },
    { mode: 'dark', label: t('settings.theme_dark'), icon: <Moon size={16} color={colors.text} strokeWidth={2.2} /> },
    { mode: 'amoled', label: t('settings.theme_amoled'), icon: <Zap size={16} color={colors.text} strokeWidth={2.2} /> },
    { mode: 'system', label: t('settings.theme_system'), icon: <Smartphone size={16} color={colors.text} strokeWidth={2.2} /> },
  ];
  return (
    <View className="px-4 py-3">
      <Text variant="caption" muted className="mb-3 uppercase tracking-wider">
        {t('settings.theme')}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((o) => {
          const active = preference === o.mode;
          return (
            <Pressable
              key={o.mode}
              onPress={() => { h.select(); setMode(o.mode); }}
              className="rounded-2xl px-3 py-2.5 flex-row items-center gap-2"
              style={{
                backgroundColor: active ? colors.text : 'transparent',
                borderWidth: 1,
                borderColor: active ? colors.text : colors.border,
              }}
            >
              <View style={{ opacity: active ? 0 : 1, position: active ? 'absolute' : 'relative' }}>
                {o.icon}
              </View>
              <Text
                variant="caption"
                style={{ color: active ? colors.bg : colors.text, fontWeight: '600' }}
              >
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function LanguagePicker() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const locale = useSettingsStore((s) => s.locale);
  const setLocale = useSettingsStore((s) => s.setLocale);
  const h = useHaptics();

  const labels: Record<Locale, string> = {
    en: 'English', es: 'Español', ar: 'العربية', ur: 'اردو',
    hi: 'हिन्दी', pt: 'Português', fr: 'Français', de: 'Deutsch',
  };

  return (
    <View className="px-4 py-3">
      <Text variant="caption" muted className="mb-3 uppercase tracking-wider">
        {t('settings.language')}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {SUPPORTED_LOCALES.map((lng) => {
          const active = locale === lng;
          return (
            <Pressable
              key={lng}
              onPress={() => {
                h.select();
                setLocale(lng);
                i18n.changeLanguage(lng);
                applyRTL(lng);
              }}
              className="rounded-2xl px-3 py-2"
              style={{
                backgroundColor: active ? colors.text : 'transparent',
                borderWidth: 1,
                borderColor: active ? colors.text : colors.border,
              }}
            >
              <Text
                variant="caption"
                style={{ color: active ? colors.bg : colors.text, fontWeight: '600' }}
              >
                {labels[lng]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const plan = useSettingsStore((s) => s.plan);
  const currency = useSettingsStore((s) => s.currency);

  return (
    <Screen padded={false}>
      <AuroraBackground intensity={0.25} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="title">{t('settings.title')}</Text>

        {/* Subscription card */}
        <Animated.View entering={FadeInUp.delay(60).duration(450)} className="mt-5">
          <GlassCard className="p-5">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Crown size={16} color={colors.accentPink} strokeWidth={2.4} />
                  <Text variant="caption" style={{ color: colors.accentPink, letterSpacing: 1 }}>
                    {t('settings.subscription').toUpperCase()}
                  </Text>
                </View>
                <Text variant="heading" className="mt-2">
                  {t(`settings.plan_${plan}`)}
                </Text>
                <Text variant="caption" muted className="mt-0.5">
                  {plan === 'free' ? 'Upgrade for unlimited AI & OCR' : 'Thanks for supporting Spendify.'}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} strokeWidth={2.2} />
            </View>
          </GlassCard>
        </Animated.View>

        {/* Appearance group */}
        <Animated.View entering={FadeInUp.delay(120).duration(450)} className="mt-5">
          <Text variant="caption" muted className="mb-2 ml-2 uppercase tracking-wider">
            {t('settings.appearance')}
          </Text>
          <View className="rounded-3xl bg-surface border border-border overflow-hidden">
            <ThemePicker />
            <View className="h-px bg-border" />
            <LanguagePicker />
          </View>
        </Animated.View>

        {/* Account / support group */}
        <Animated.View entering={FadeInUp.delay(180).duration(450)} className="mt-5">
          <Text variant="caption" muted className="mb-2 ml-2 uppercase tracking-wider">
            {t('settings.account')}
          </Text>
          <View className="rounded-3xl bg-surface border border-border overflow-hidden">
            <Row
              icon={<Coins size={16} color={colors.accentEmerald} strokeWidth={2.2} />}
              label={t('settings.currency')}
              value={currency}
            />
            <Row
              icon={<Globe size={16} color={colors.accentBlue} strokeWidth={2.2} />}
              label={t('settings.language')}
            />
            <Row
              icon={<LifeBuoy size={16} color={colors.accentViolet} strokeWidth={2.2} />}
              label={t('settings.support')}
            />
            <Row
              icon={<Info size={16} color={colors.textMuted} strokeWidth={2.2} />}
              label={t('settings.about')}
              value="v0.1.0"
              last
            />
          </View>
        </Animated.View>
      </ScrollView>
    </Screen>
  );
}
