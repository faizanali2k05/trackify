import { useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { X, Trash2, Check } from 'lucide-react-native';

import { Screen, Text, TextField, Icon, Button } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import { useExpensesStore } from '@/store/expenses';
import { useBudgetsStore } from '@/store/budgets';
import { useSettingsStore } from '@/store/settings';
import { CATEGORIES, type AccentKey } from '@/lib/constants';
import type { ExpenseKind } from '@/types';

type Props = { expenseId?: string };

export function ExpenseForm({ expenseId }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const h = useHaptics();
  const router = useRouter();

  const expenses = useExpensesStore((s) => s.expenses);
  const addExpense = useExpensesStore((s) => s.add);
  const updateExpense = useExpensesStore((s) => s.update);
  const removeExpense = useExpensesStore((s) => s.remove);
  const budgets = useBudgetsStore((s) => s.budgets);
  const incrementSpent = useBudgetsStore((s) => s.incrementSpent);
  const currency = useSettingsStore((s) => s.currency);

  const existing = useMemo(
    () => (expenseId ? expenses.find((e) => e.id === expenseId) : undefined),
    [expenseId, expenses],
  );
  const isEdit = Boolean(existing);

  const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
  const [merchant, setMerchant] = useState(existing?.merchant ?? '');
  const [category, setCategory] = useState(existing?.category ?? CATEGORIES[0].key);
  const [kind, setKind] = useState<ExpenseKind>(existing?.kind ?? 'variable');
  const [budgetId, setBudgetId] = useState<string | null>(existing?.budgetId ?? null);
  const [note, setNote] = useState(existing?.note ?? '');

  const amountValue = parseFloat(amount.replace(',', '.'));
  const valid = Number.isFinite(amountValue) && amountValue > 0;

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }

  function save() {
    if (!valid) {
      h.warning();
      return;
    }
    h.success();
    const cleanMerchant = merchant.trim() || category;

    if (existing) {
      // Reconcile budget "spent": back out the old amount, apply the new one.
      if (existing.budgetId) incrementSpent(existing.budgetId, -existing.amount);
      updateExpense(existing.id, {
        amount: amountValue,
        merchant: cleanMerchant,
        category,
        kind,
        budgetId,
        note: note.trim() || undefined,
        currency,
      });
      if (budgetId) incrementSpent(budgetId, amountValue);
    } else {
      addExpense({
        amount: amountValue,
        merchant: cleanMerchant,
        category,
        kind,
        budgetId,
        note: note.trim() || undefined,
        currency,
        date: new Date().toISOString(),
      });
      if (budgetId) incrementSpent(budgetId, amountValue);
    }
    close();
  }

  function destroy() {
    if (!existing) return;
    h.warning();
    if (existing.budgetId) incrementSpent(existing.budgetId, -existing.amount);
    removeExpense(existing.id);
    close();
  }

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-2 pb-3">
          <Pressable
            onPress={close}
            className="h-10 w-10 items-center justify-center rounded-2xl border border-border"
          >
            <X size={20} color={colors.text} strokeWidth={2.2} />
          </Pressable>
          <Text variant="heading">
            {isEdit ? t('expense_form.edit_title') : t('expense_form.new_title')}
          </Text>
          {isEdit ? (
            <Pressable
              onPress={destroy}
              className="h-10 w-10 items-center justify-center rounded-2xl border border-border"
            >
              <Trash2 size={18} color={colors.danger} strokeWidth={2.2} />
            </Pressable>
          ) : (
            <View className="h-10 w-10" />
          )}
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Amount — hero input */}
          <View className="items-center py-6">
            <Text variant="caption" muted className="uppercase tracking-wider">
              {t('expense_form.amount')}
            </Text>
            <View className="flex-row items-center mt-2">
              <Text variant="display" muted className="mr-1">
                {currency}
              </Text>
              <TextField
                value={amount}
                onChangeText={setAmount}
                placeholder="0"
                keyboardType="decimal-pad"
                autoFocus={!isEdit}
                style={{
                  fontSize: 44,
                  fontWeight: '700',
                  textAlign: 'center',
                  minWidth: 120,
                  color: colors.text,
                }}
              />
            </View>
          </View>

          {/* Merchant */}
          <View className="mt-2">
            <TextField
              label={t('expense_form.merchant')}
              value={merchant}
              onChangeText={setMerchant}
              placeholder={t('expense_form.merchant_ph')}
            />
          </View>

          {/* Category */}
          <View className="mt-5">
            <Text variant="caption" muted className="mb-2 uppercase tracking-wider">
              {t('expense_form.category')}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const active = category === c.key;
                const accent = colors[c.accent as AccentKey];
                return (
                  <Pressable
                    key={c.key}
                    onPress={() => {
                      h.select();
                      setCategory(c.key);
                    }}
                    className="flex-row items-center gap-2 rounded-2xl px-3 py-2.5"
                    style={{
                      backgroundColor: active ? accent + '22' : 'transparent',
                      borderWidth: 1,
                      borderColor: active ? accent : colors.border,
                    }}
                  >
                    <Icon name={c.icon} size={15} color={active ? accent : colors.textMuted} strokeWidth={2.2} />
                    <Text
                      variant="caption"
                      style={{ color: active ? colors.text : colors.textMuted, fontWeight: '600' }}
                    >
                      {c.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Kind */}
          <View className="mt-5">
            <Text variant="caption" muted className="mb-2 uppercase tracking-wider">
              {t('expense_form.kind')}
            </Text>
            <View className="flex-row gap-2">
              {(['variable', 'fixed'] as ExpenseKind[]).map((k) => {
                const active = kind === k;
                return (
                  <Pressable
                    key={k}
                    onPress={() => {
                      h.select();
                      setKind(k);
                    }}
                    className="flex-1 items-center rounded-2xl py-3"
                    style={{
                      backgroundColor: active ? colors.text : 'transparent',
                      borderWidth: 1,
                      borderColor: active ? colors.text : colors.border,
                    }}
                  >
                    <Text
                      variant="body"
                      style={{ color: active ? colors.bg : colors.textMuted, fontWeight: '600' }}
                    >
                      {k === 'fixed' ? t('expenses.filter_fixed') : t('expenses.filter_variable')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Budget */}
          {budgets.length > 0 ? (
            <View className="mt-5">
              <Text variant="caption" muted className="mb-2 uppercase tracking-wider">
                {t('expense_form.budget')}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                <BudgetChip
                  label={t('expense_form.no_budget')}
                  active={budgetId === null}
                  onPress={() => {
                    h.select();
                    setBudgetId(null);
                  }}
                />
                {budgets.map((b) => (
                  <BudgetChip
                    key={b.id}
                    label={b.name}
                    active={budgetId === b.id}
                    onPress={() => {
                      h.select();
                      setBudgetId(b.id);
                    }}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {/* Note */}
          <View className="mt-5">
            <TextField
              label={t('expense_form.note')}
              value={note}
              onChangeText={setNote}
              placeholder={t('expense_form.note_ph')}
            />
          </View>

          <View className="mt-8">
            <Button
              label={isEdit ? t('common.save') : t('expense_form.add')}
              size="lg"
              disabled={!valid}
              icon={<Check size={18} color={valid ? colors.bg : colors.textSubtle} strokeWidth={2.6} />}
              onPress={save}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function BudgetChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl px-3.5 py-2.5"
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
        {label}
      </Text>
    </Pressable>
  );
}
