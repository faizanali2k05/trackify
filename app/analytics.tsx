import { useMemo } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { Screen, Text, GlassCard, AuroraBackground } from '@/components/ui';
import { useExpensesStore } from '@/store/expenses';
import { useBudgetsStore } from '@/store/budgets';
import { useCurrency } from '@/hooks/useCurrency';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import {
  byCategory,
  dailyTrend,
  financialHealth,
  topMerchants,
  type HealthLabel,
} from '@/lib/analytics';
import type { AccentKey } from '@/lib/constants';

function ScoreRing({ score, color, track }: { score: number; color: string; track: string }) {
  const size = 132;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.max(0, Math.min(100, score)) / 100);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </Svg>
      <Text variant="display" style={{ fontSize: 36 }}>{score}</Text>
      <Text variant="caption" muted>/ 100</Text>
    </View>
  );
}

export default function Analytics() {
  const { t } = useTranslation();
  const router = useRouter();
  const { format } = useCurrency();
  const { colors } = useTheme();
  const h = useHaptics();
  const expenses = useExpensesStore((s) => s.expenses);
  const budgets = useBudgetsStore((s) => s.budgets);

  const health = useMemo(() => financialHealth(expenses, budgets), [expenses, budgets]);
  const cats = useMemo(() => byCategory(expenses).slice(0, 8), [expenses]);
  const trend = useMemo(() => dailyTrend(expenses, 14), [expenses]);
  const merchants = useMemo(() => topMerchants(expenses, 5), [expenses]);

  const trendMax = Math.max(...trend.map((p) => p.total), 1);

  const labelColor: Record<HealthLabel, string> = {
    excellent: colors.accentEmerald,
    good: colors.accentBlue,
    fair: colors.warning,
    attention: colors.danger,
  };
  const scoreColor = labelColor[health.label];

  return (
    <Screen padded={false}>
      <AuroraBackground intensity={0.3} />
      <View className="flex-row items-center gap-3 px-5 pt-2 pb-1">
        <Pressable
          onPress={() => {
            h.light();
            router.back();
          }}
          className="h-10 w-10 items-center justify-center rounded-2xl border border-border"
        >
          <ChevronLeft size={20} color={colors.text} strokeWidth={2.2} />
        </Pressable>
        <Text variant="title">{t('analytics.title')}</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, paddingTop: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Health score */}
        <Animated.View entering={FadeInDown.duration(450)}>
          <GlassCard className="p-6">
            <View className="flex-row items-center gap-5">
              <ScoreRing score={health.score} color={scoreColor} track={colors.border} />
              <View className="flex-1">
                <Text variant="caption" muted className="uppercase tracking-wider">
                  {t('analytics.health')}
                </Text>
                <Text variant="heading" className="mt-1" style={{ color: scoreColor }}>
                  {t(`analytics.health_${health.label}`)}
                </Text>
                <Text variant="caption" muted className="mt-2 leading-5">
                  {health.hasBudget
                    ? t('analytics.health_detail', {
                        spent: format(health.totalSpent),
                        budget: format(health.totalBudget),
                        pct: Math.round(health.utilization * 100),
                      })
                    : t('analytics.health_no_budget')}
                </Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Trend */}
        <Animated.View entering={FadeInDown.delay(80).duration(450)} className="mt-4">
          <GlassCard className="p-5">
            <Text variant="heading">{t('analytics.trend')}</Text>
            <Text variant="caption" muted className="mt-0.5">{t('analytics.trend_sub')}</Text>
            <View className="mt-5 flex-row items-end justify-between" style={{ height: 120 }}>
              {trend.map((p, i) => {
                const barH = Math.max(4, (p.total / trendMax) * 104);
                return (
                  <View key={p.iso} className="flex-1 items-center">
                    <Animated.View
                      entering={FadeInUp.delay(i * 30).duration(400)}
                      style={{
                        width: 7,
                        height: barH,
                        borderRadius: 6,
                        backgroundColor: p.total > 0 ? colors.accentViolet : colors.border,
                      }}
                    />
                  </View>
                );
              })}
            </View>
            <View className="flex-row justify-between mt-2">
              {trend.map((p, i) => (
                <View key={p.iso} className="flex-1 items-center">
                  {i % 2 === 0 ? (
                    <Text variant="caption" muted style={{ fontSize: 9 }}>{p.label}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          </GlassCard>
        </Animated.View>

        {/* By category */}
        <Animated.View entering={FadeInDown.delay(160).duration(450)} className="mt-4">
          <GlassCard className="p-5">
            <Text variant="heading">{t('analytics.by_category')}</Text>
            {cats.length === 0 ? (
              <Text variant="body" muted className="mt-3">{t('analytics.empty')}</Text>
            ) : (
              <View className="mt-4 gap-3.5">
                {cats.map((c) => {
                  const accent = colors[c.accent as AccentKey];
                  return (
                    <View key={c.category}>
                      <View className="flex-row items-center justify-between mb-1.5">
                        <Text variant="body">{c.category}</Text>
                        <Text variant="caption" muted>
                          {format(c.total)} · {Math.round(c.pct * 100)}%
                        </Text>
                      </View>
                      <View className="h-2 w-full rounded-full bg-border overflow-hidden">
                        <View
                          style={{
                            width: `${Math.max(2, c.pct * 100)}%`,
                            height: '100%',
                            backgroundColor: accent,
                            borderRadius: 999,
                          }}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </GlassCard>
        </Animated.View>

        {/* Top merchants */}
        {merchants.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(240).duration(450)} className="mt-4">
            <GlassCard className="p-5">
              <Text variant="heading">{t('analytics.top_merchants')}</Text>
              <View className="mt-3">
                {merchants.map((m, i) => (
                  <View
                    key={m.merchant}
                    className={`flex-row items-center justify-between py-3 ${i !== merchants.length - 1 ? 'border-b border-border' : ''}`}
                  >
                    <View className="flex-row items-center gap-3 flex-1">
                      <View
                        className="h-9 w-9 items-center justify-center rounded-2xl"
                        style={{ backgroundColor: colors.accentBlue + '1A' }}
                      >
                        <Text variant="body" style={{ color: colors.accentBlue }}>
                          {m.merchant.slice(0, 1)}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text variant="body" numberOfLines={1}>{m.merchant}</Text>
                        <Text variant="caption" muted>{m.count}×</Text>
                      </View>
                    </View>
                    <Text variant="body" className="font-display">{format(m.total)}</Text>
                  </View>
                ))}
              </View>
            </GlassCard>
          </Animated.View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
