import { useMemo, useState } from 'react';
import { View, Pressable, TextInput } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Trash2 } from 'lucide-react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Screen, Text, AuroraBackground } from '@/components/ui';
import { useExpensesStore } from '@/store/expenses';
import { useBudgetsStore } from '@/store/budgets';
import { useCurrency } from '@/hooks/useCurrency';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
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

function ExpenseRow({
  expense,
  onPress,
  onDelete,
}: {
  expense: Expense;
  onPress: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const { format } = useCurrency();
  const { colors } = useTheme();

  return (
    <ReanimatedSwipeable
      friction={2}
      rightThreshold={40}
      renderRightActions={() => (
        <Pressable
          onPress={onDelete}
          className="my-1 ml-2 items-center justify-center rounded-2xl px-5"
          style={{ backgroundColor: colors.danger }}
        >
          <Trash2 size={18} color="#fff" strokeWidth={2.4} />
        </Pressable>
      )}
    >
      <Animated.View entering={FadeIn.duration(220)}>
        <Pressable onPress={onPress} className="flex-row items-center justify-between py-3.5 bg-bg">
          <View className="flex-row items-center gap-3 flex-1">
            <View
              className="h-10 w-10 items-center justify-center rounded-2xl"
              style={{ backgroundColor: colors.accentViolet + '1A' }}
            >
              <Text variant="body" style={{ color: colors.accentViolet }}>
                {expense.merchant.slice(0, 1)}
              </Text>
            </View>
            <View className="flex-1">
              <Text variant="body" numberOfLines={1}>{expense.merchant}</Text>
              <Text variant="caption" muted>
                {expense.category} ·{' '}
                {expense.kind === 'fixed'
                  ? t('expenses.filter_fixed')
                  : t('expenses.filter_variable')}
              </Text>
            </View>
          </View>
          <Text variant="body" className="font-display">−{format(expense.amount)}</Text>
        </Pressable>
      </Animated.View>
    </ReanimatedSwipeable>
  );
}

export default function Expenses() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const h = useHaptics();
  const expenses = useExpensesStore((s) => s.expenses);
  const removeExpense = useExpensesStore((s) => s.remove);
  const incrementSpent = useBudgetsStore((s) => s.incrementSpent);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const rows = useMemo<Row[]>(() => {
    const q = query.trim().toLowerCase();
    const filtered = expenses.filter((e) => {
      if (filter !== 'all' && e.kind !== filter) return false;
      if (!q) return true;
      return (
        e.merchant.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        (e.note?.toLowerCase().includes(q) ?? false)
      );
    });
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
  }, [expenses, filter, query, t]);

  function handleDelete(e: Expense) {
    h.warning();
    if (e.budgetId) incrementSpent(e.budgetId, -e.amount);
    removeExpense(e.id);
  }

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: t('expenses.filter_all') },
    { id: 'fixed', label: t('expenses.filter_fixed') },
    { id: 'variable', label: t('expenses.filter_variable') },
  ];

  return (
    <Screen padded={false}>
      <AuroraBackground intensity={0.3} />
      <View className="px-5 pt-2">
        <View className="flex-row items-center justify-between">
          <Text variant="title">{t('expenses.title')}</Text>
          <Pressable
            onPress={() => {
              h.light();
              router.push('/expense/new');
            }}
            className="h-11 w-11 items-center justify-center rounded-2xl"
            style={{ backgroundColor: colors.text }}
          >
            <Plus size={20} color={colors.bg} strokeWidth={2.6} />
          </Pressable>
        </View>

        {/* Search bar */}
        <View className="mt-4 flex-row items-center gap-2 rounded-2xl bg-surface border border-border px-4">
          <Search size={16} color={colors.textSubtle} strokeWidth={2.2} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('expenses.search')}
            placeholderTextColor={colors.textSubtle}
            style={{ flex: 1, color: colors.text, fontSize: 15, paddingVertical: 12 }}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
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
                  style={{ color: active ? colors.bg : colors.textMuted, fontWeight: '600' }}
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
              {query ? t('expenses.no_results') : t('expenses.empty_subtitle')}
            </Text>
          </View>
        ) : (
          <FlashList
            data={rows}
            keyExtractor={(r) => r.id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
            renderItem={({ item }) => {
              if (item.kind === 'header') {
                return (
                  <Text variant="caption" muted className="mt-5 mb-2 uppercase tracking-wider">
                    {item.label}
                  </Text>
                );
              }
              return (
                <ExpenseRow
                  expense={item.expense}
                  onPress={() => {
                    h.select();
                    router.push({ pathname: '/expense/[id]', params: { id: item.expense.id } });
                  }}
                  onDelete={() => handleDelete(item.expense)}
                />
              );
            }}
          />
        )}
      </View>
    </Screen>
  );
}
