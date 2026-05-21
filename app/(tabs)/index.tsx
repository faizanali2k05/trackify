import { useMemo } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Plus, Sparkles, TrendingUp, ArrowUpRight } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Screen, Text, GlassCard, AuroraBackground } from '@/components/ui';
import { useExpensesStore } from '@/store/expenses';
import { useBudgetsStore } from '@/store/budgets';
import { useSettingsStore } from '@/store/settings';
import { useCurrency } from '@/hooks/useCurrency';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import { totalSpent } from '@/lib/analytics';
import { generateInsight } from '@/services/ai';

function greetingKey(): 'greeting_morning' | 'greeting_afternoon' | 'greeting_evening' {
  const h = new Date().getHours();
  if (h < 12) return 'greeting_morning';
  if (h < 18) return 'greeting_afternoon';
  return 'greeting_evening';
}

export default function Dashboard() {
  const { t } = useTranslation();
  const router = useRouter();
  const { format } = useCurrency();
  const { colors } = useTheme();
  const h = useHaptics();
  const expenses = useExpensesStore((s) => s.expenses);
  const budgets = useBudgetsStore((s) => s.budgets);
  const locale = useSettingsStore((s) => s.locale);
  const currency = useSettingsStore((s) => s.currency);
  const userName = useSettingsStore((s) => s.userName);
  const grokApiKey = useSettingsStore((s) => s.grokApiKey);

  const stats = useMemo(() => {
    const totalBudget = budgets.reduce((a, b) => a + b.amount, 0);
    const spent = budgets.reduce((a, b) => a + b.spent, 0);
    const remaining = Math.max(0, totalBudget - spent);
    const pct = totalBudget > 0 ? Math.min(1, spent / totalBudget) : 0;
    return { totalBudget, totalSpent: spent, remaining, pct };
  }, [budgets]);

  const recent = expenses.slice(0, 5);

  // Live, data-grounded insight. Re-runs only when spending materially changes.
  const insightKey = Math.round(totalSpent(expenses));
  const insight = useQuery({
    queryKey: ['ai-insight', expenses.length, insightKey, budgets.length, Boolean(grokApiKey)],
    queryFn: () =>
      generateInsight({ expenses, budgets, locale, currency, userName, apiKey: grokApiKey }),
    staleTime: 1000 * 60 * 10,
  });

  return (
    <Screen padded={false}>
      <AuroraBackground intensity={0.45} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(500)}>
          <Text variant="caption" muted>{t(`dashboard.${greetingKey()}`)}</Text>
          <Text variant="title" className="mt-1">{t('app.name')}</Text>
        </Animated.View>

        {/* Balance card */}
        <Animated.View entering={FadeInDown.delay(80).duration(500)} className="mt-6">
          <GlassCard className="p-6">
            <Text variant="caption" muted>{t('dashboard.balance_label')}</Text>
            <Text variant="display" className="mt-1">
              {format(stats.remaining)}
            </Text>

            <View className="mt-5 h-1.5 w-full rounded-full bg-border overflow-hidden">
              <View
                style={{
                  width: `${stats.pct * 100}%`,
                  height: '100%',
                  backgroundColor: colors.accentViolet,
                }}
              />
            </View>

            <View className="mt-4 flex-row justify-between">
              <View>
                <Text variant="caption" muted>{t('dashboard.spent')}</Text>
                <Text variant="heading" className="mt-0.5">{format(stats.totalSpent)}</Text>
              </View>
              <View className="items-end">
                <Text variant="caption" muted>{t('dashboard.remaining')}</Text>
                <Text variant="heading" className="mt-0.5">{format(stats.remaining)}</Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* AI Insight */}
        <Animated.View entering={FadeInDown.delay(160).duration(500)} className="mt-4">
          <GlassCard className="p-5">
            <View className="flex-row items-center gap-2">
              <Sparkles size={16} color={colors.accentPink} strokeWidth={2.4} />
              <Text variant="caption" style={{ color: colors.accentPink, letterSpacing: 1 }}>
                {t('dashboard.ai_insight').toUpperCase()}
              </Text>
            </View>
            <Text variant="body" className="mt-2 leading-6">
              {insight.isLoading
                ? t('dashboard.insight_loading')
                : insight.data ?? t('dashboard.insight_placeholder')}
            </Text>
          </GlassCard>
        </Animated.View>

        {/* Quick actions */}
        <Animated.View
          entering={FadeInDown.delay(240).duration(500)}
          className="mt-4 flex-row gap-3"
        >
          <Pressable
            onPress={() => {
              h.light();
              router.push('/expense/new');
            }}
            className="flex-1 rounded-3xl border border-border bg-surface p-4"
          >
            <View
              className="h-10 w-10 items-center justify-center rounded-2xl"
              style={{ backgroundColor: colors.accentViolet + '22' }}
            >
              <Plus size={20} color={colors.accentViolet} strokeWidth={2.4} />
            </View>
            <Text variant="body" className="mt-3 font-display">{t('dashboard.quick_add')}</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              h.light();
              router.push('/analytics');
            }}
            className="flex-1 rounded-3xl border border-border bg-surface p-4"
          >
            <View
              className="h-10 w-10 items-center justify-center rounded-2xl"
              style={{ backgroundColor: colors.accentEmerald + '22' }}
            >
              <TrendingUp size={20} color={colors.accentEmerald} strokeWidth={2.4} />
            </View>
            <Text variant="body" className="mt-3 font-display">{t('analytics.title')}</Text>
          </Pressable>
        </Animated.View>

        {/* Recent */}
        <Animated.View entering={FadeInDown.delay(320).duration(500)} className="mt-8">
          <View className="flex-row items-center justify-between mb-3">
            <Text variant="heading">{t('dashboard.recent')}</Text>
            <Pressable
              onPress={() => {
                h.select();
                router.push('/(tabs)/expenses');
              }}
            >
              <View className="flex-row items-center gap-1">
                <Text variant="caption" muted>{t('dashboard.see_all')}</Text>
                <ArrowUpRight size={14} color={colors.textMuted} strokeWidth={2.2} />
              </View>
            </Pressable>
          </View>

          {recent.length === 0 ? (
            <Pressable
              onPress={() => {
                h.light();
                router.push('/expense/new');
              }}
              className="rounded-3xl bg-surface border border-border p-6 items-center"
            >
              <Text variant="body" muted>{t('dashboard.recent_empty')}</Text>
            </Pressable>
          ) : (
          <View className="rounded-3xl bg-surface border border-border overflow-hidden">
            {recent.map((e, i) => (
              <Pressable
                key={e.id}
                onPress={() => {
                  h.select();
                  router.push({ pathname: '/expense/[id]', params: { id: e.id } });
                }}
                className={`flex-row items-center justify-between px-4 py-4 ${i !== recent.length - 1 ? 'border-b border-border' : ''}`}
              >
                <View className="flex-row items-center gap-3 flex-1">
                  <View
                    className="h-10 w-10 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: colors.accentBlue + '1A' }}
                  >
                    <Text variant="body" style={{ color: colors.accentBlue }}>
                      {e.merchant.slice(0, 1)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text variant="body" numberOfLines={1}>{e.merchant}</Text>
                    <Text variant="caption" muted>{e.category}</Text>
                  </View>
                </View>
                <Text variant="body" className="font-display">
                  −{format(e.amount)}
                </Text>
              </Pressable>
            ))}
          </View>
          )}
        </Animated.View>
      </ScrollView>
    </Screen>
  );
}
