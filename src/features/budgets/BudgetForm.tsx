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
import { useBudgetsStore } from '@/store/budgets';
import { useSettingsStore } from '@/store/settings';
import { BUDGET_TYPES, ACCENT_OPTIONS, type AccentKey } from '@/lib/constants';
import type { BudgetType } from '@/types';

type Props = { budgetId?: string };

export function BudgetForm({ budgetId }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const h = useHaptics();
  const router = useRouter();

  const budgets = useBudgetsStore((s) => s.budgets);
  const create = useBudgetsStore((s) => s.create);
  const update = useBudgetsStore((s) => s.update);
  const remove = useBudgetsStore((s) => s.remove);
  const currency = useSettingsStore((s) => s.currency);

  const existing = useMemo(
    () => (budgetId ? budgets.find((b) => b.id === budgetId) : undefined),
    [budgetId, budgets],
  );
  const isEdit = Boolean(existing);

  const [name, setName] = useState(existing?.name ?? '');
  const [type, setType] = useState<BudgetType>(existing?.type ?? 'monthly');
  const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
  const [color, setColor] = useState<AccentKey>((existing?.color as AccentKey) ?? 'accentViolet');

  const amountValue = parseFloat(amount.replace(',', '.'));
  const valid = name.trim().length > 0 && Number.isFinite(amountValue) && amountValue > 0;

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/budgets');
  }

  function save() {
    if (!valid) {
      h.warning();
      return;
    }
    h.success();
    const icon = BUDGET_TYPES.find((b) => b.type === type)?.icon ?? 'Wallet';
    if (existing) {
      update(existing.id, { name: name.trim(), type, amount: amountValue, color, icon, currency });
    } else {
      create({ name: name.trim(), type, amount: amountValue, color, icon, currency });
    }
    close();
  }

  function destroy() {
    if (!existing) return;
    h.warning();
    remove(existing.id);
    close();
  }

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View className="flex-row items-center justify-between px-5 pt-2 pb-3">
          <Pressable
            onPress={close}
            className="h-10 w-10 items-center justify-center rounded-2xl border border-border"
          >
            <X size={20} color={colors.text} strokeWidth={2.2} />
          </Pressable>
          <Text variant="heading">
            {isEdit ? t('budget_form.edit_title') : t('budget_form.new_title')}
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
          <View className="mt-3">
            <TextField
              label={t('budget_form.name')}
              value={name}
              onChangeText={setName}
              placeholder={t('budget_form.name_ph')}
              autoFocus={!isEdit}
            />
          </View>

          <View className="mt-5">
            <TextField
              label={t('budget_form.amount')}
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              keyboardType="decimal-pad"
              prefix={currency}
            />
          </View>

          {/* Type */}
          <View className="mt-5">
            <Text variant="caption" muted className="mb-2 uppercase tracking-wider">
              {t('budget_form.type')}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {BUDGET_TYPES.map((b) => {
                const active = type === b.type;
                const accent = colors[b.accent];
                return (
                  <Pressable
                    key={b.type}
                    onPress={() => {
                      h.select();
                      setType(b.type);
                    }}
                    className="flex-row items-center gap-2 rounded-2xl px-3 py-2.5"
                    style={{
                      backgroundColor: active ? accent + '22' : 'transparent',
                      borderWidth: 1,
                      borderColor: active ? accent : colors.border,
                    }}
                  >
                    <Icon name={b.icon} size={15} color={active ? accent : colors.textMuted} strokeWidth={2.2} />
                    <Text
                      variant="caption"
                      style={{ color: active ? colors.text : colors.textMuted, fontWeight: '600' }}
                    >
                      {t(`budgets.types.${b.type}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Color */}
          <View className="mt-5">
            <Text variant="caption" muted className="mb-2 uppercase tracking-wider">
              {t('budget_form.color')}
            </Text>
            <View className="flex-row gap-3">
              {ACCENT_OPTIONS.map((key) => {
                const active = color === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => {
                      h.select();
                      setColor(key);
                    }}
                    className="h-11 w-11 items-center justify-center rounded-2xl"
                    style={{
                      backgroundColor: colors[key],
                      borderWidth: active ? 3 : 0,
                      borderColor: colors.text,
                    }}
                  >
                    {active ? <Check size={18} color={colors.bg} strokeWidth={3} /> : null}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="mt-8">
            <Button
              label={isEdit ? t('common.save') : t('budget_form.create')}
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
