import { useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Screen, Text, AuroraBackground } from '@/components/ui';
import { useExpensesStore } from '@/store/expenses';
import { useCurrency } from '@/hooks/useCurrency';
import { useTheme } from '@/hooks/useTheme';
import type { Expense, ExpenseKind } from '@/types';

type Filter = 'all' | ExpenseKind;
type Row =
  | { kind: 'header'; label: string; id: string }
  | { kind: 'item'; expense: Expense; id: string };

function bucketLabel(t: (k: string) => string, dateISO: string) {
  const date = new Date(dateISO);
  const now = new Date();
  const days = Math.floor(
    (Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) -
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())) /
      86_400_000,
  );
  if (days <= 0) return t('expenses.today');
  if (days === 1) return t('expenses.yesterday');
  if (days <= 7) return t('expenses.this_week');
  return t('expenses.earlier');
}

export default function Expenses() {
  const { t } = useTranslation();
  const { format } = useCurrency();
  const { colors } = useTheme();
  const expenses = useExpensesStore((s) => s.expenses);
  const [filter, setFilter] = useState<Filter>('all');

  const rows = useMemo<Row[]>(() => {
    const filtered =
      filter === 'all' ? expenses : expenses.filter((e) => e.kind === filter);
    const out: Row[] = [];
    let lastBucket = '';
    for (const e of filtered) {
      const bucket = bucketLabel(t, e.date);
      if (bucket !== lastBucket) {
        out.push({ kind: 'header', label: bucket, id: `h-${bucket}` });
        lastBucket = bucket;
      }
      out.push({ kind: 'item', expense: e, id: e.id });
    }
    return out;
  }, [expenses, filter, t]);

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: t('expenses.filter_all') },
    { id: 'fixed', label: t('expenses.filter_fixed') },
    { id: 'variable', label: t('expenses.filter_variable') },
  ];

  return (
    <Screen padded={false}>
      <AuroraBackground intensity={0.3} />
      <View className="px-5 pt-2">
        <Text variant="title">{t('expenses.title')}</Text>

        {/* Search bar */}
        <View className="mt-4 flex-row items-center gap-2 rounded-2xl bg-surface border border-border px-4 py-3">
          <Search size={16} color={colors.textSubtle} strokeWidth={2.2} />
          <Text variant="body" muted className="flex-1">
            {t('expenses.search')}
          </Text>
        </View>

        {/* Filter pills */}
        <View className="mt-4 flex-row gap-2">
          {filters.map((f) => {
            const active = filter === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => setFilter(f.id)}
                className="rounded-full px-4 py-2"
                style={{
                  backgroundColor: active ? colors.text : 'transparent',
                  borderWidth: 1,
                  borderColor: active ? colors.text : colors.border,
                }}
              >
                <Text
                  variant="caption"
                  style={{
                    color: active ? colors.bg : colors.textMuted,
                    fontWeight: '600',
                  }}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="flex-1 mt-4">
        {rows.length === 0 ? (
          <View className="flex-1 items-center justify-center px-10">
            <Text variant="heading">{t('expenses.empty_title')}</Text>
            <Text variant="body" muted className="mt-2 text-center">
              {t('expenses.empty_subtitle')}
            </Text>
          </View>
        ) : (
          <FlashList
            data={rows}
            keyExtractor={(r) => r.id}
            estimatedItemSize={64}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
            renderItem={({ item }) => {
              if (item.kind === 'header') {
                return (
                  <Text variant="caption" muted className="mt-5 mb-2 uppercase tracking-wider">
                    {item.label}
                  </Text>
                );
              }
              const e = item.expense;
              return (
                <Animated.View entering={FadeIn.duration(220)}>
                  <View className="flex-row items-center justify-between py-3.5">
                    <View className="flex-row items-center gap-3 flex-1">
                      <View
                        className="h-10 w-10 items-center justify-center rounded-2xl"
                        style={{ backgroundColor: colors.accentViolet + '1A' }}
                      >
                        <Text variant="body" style={{ color: colors.accentViolet }}>
                          {e.merchant.slice(0, 1)}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text variant="body" numberOfLines={1}>{e.merchant}</Text>
                        <Text variant="caption" muted>
                          {e.category} · {e.kind === 'fixed' ? t('expenses.filter_fixed') : t('expenses.filter_variable')}
                        </Text>
                      </View>
                    </View>
                    <Text variant="body" className="font-display">−{format(e.amount)}</Text>
                  </View>
                </Animated.View>
              );
            }}
          />
        )}
      </View>
    </Screen>
  );
}
