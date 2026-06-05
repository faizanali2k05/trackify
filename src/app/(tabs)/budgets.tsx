import { useMemo } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Plus, Wallet, Plane, Briefcase, PartyPopper, Users } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Screen, Text, Button, AuroraBackground } from '@/components/ui';
import { useBudgetsStore } from '@/store/budgets';
import { useCurrency } from '@/hooks/useCurrency';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import type { BudgetType } from '@/types';

const ICONS: Record<BudgetType, typeof Wallet> = {
  monthly: Wallet,
  travel: Plane,
  business: Briefcase,
  event: PartyPopper,
  family: Users,
};

const ACCENT: Record<string, 'accentViolet' | 'accentPink' | 'accentBlue' | 'accentEmerald'> = {
  accentViolet: 'accentViolet',
  accentPink: 'accentPink',
  accentBlue: 'accentBlue',
  accentEmerald: 'accentEmerald',
};

export default function Budgets() {
  const { t } = useTranslation();
  const router = useRouter();
  const { format } = useCurrency();
  const { colors } = useTheme();
  const h = useHaptics();
  const budgets = useBudgetsStore((s) => s.budgets);

  const empty = budgets.length === 0;

  const cards = useMemo(
    () =>
      budgets.map((b) => ({
        ...b,
        pct: b.amount > 0 ? Math.min(1, b.spent / b.amount) : 0,
        accent: colors[ACCENT[b.color] ?? 'accentViolet'],
      })),
    [budgets, colors],
  );

  return (
    <Screen padded={false}>
      <AuroraBackground intensity={0.35} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-4">
            <Text variant="title">{t('budgets.title')}</Text>
            <Text variant="body" muted className="mt-1">
              {t('budgets.subtitle')}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              h.light();
              router.push('/budget/new');
            }}
            className="h-11 w-11 items-center justify-center rounded-2xl"
            style={{ backgroundColor: colors.text }}
          >
            <Plus size={20} color={colors.bg} strokeWidth={2.6} />
          </Pressable>
        </View>

        {empty ? (
          <View className="mt-16 items-center px-6">
            <Text variant="heading">{t('budgets.empty_title')}</Text>
            <Text variant="body" muted className="mt-2 text-center">
              {t('budgets.empty_subtitle')}
            </Text>
            <View className="mt-6 w-full">
              <Button label={t('budgets.new_budget')} onPress={() => router.push('/budget/new')} />
            </View>
          </View>
        ) : (
          <View className="mt-6 gap-3">
            {cards.map((b, i) => {
              const Icon = ICONS[b.type];
              return (
                <Animated.View key={b.id} entering={FadeInUp.delay(i * 70).duration(450)}>
                  <Pressable
                    onPress={() => {
                      h.select();
                      router.push({ pathname: '/budget/[id]', params: { id: b.id } });
                    }}
                    className="rounded-3xl border border-border bg-surface p-5"
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3 flex-1">
                        <View
                          className="h-12 w-12 items-center justify-center rounded-2xl"
                          style={{ backgroundColor: b.accent + '22' }}
                        >
                          <Icon size={22} color={b.accent} strokeWidth={2.2} />
                        </View>
                        <View className="flex-1">
                          <Text variant="heading" numberOfLines={1}>{b.name}</Text>
                          <Text variant="caption" muted>{t(`budgets.types.${b.type}`)}</Text>
                        </View>
                      </View>
                      <View className="items-end">
                        <Text variant="body" className="font-display">
                          {format(b.spent)}
                        </Text>
                        <Text variant="caption" muted>of {format(b.amount)}</Text>
                      </View>
                    </View>

                    <View className="mt-4 h-1.5 w-full rounded-full bg-border overflow-hidden">
                      <View
                        style={{
                          width: `${b.pct * 100}%`,
                          height: '100%',
                          backgroundColor: b.accent,
                        }}
                      />
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
