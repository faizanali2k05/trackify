import type { Budget, Expense } from '@/types';
import { categoryDef, type AccentKey } from '@/lib/constants';

/** Sum of all expense amounts. Amounts are treated in the user's display currency. */
export function totalSpent(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

function startOfDay(d: Date): number {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Total spent in the current calendar month. */
export function monthSpent(expenses: Expense[], ref = new Date()): number {
  return expenses
    .filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
    })
    .reduce((sum, e) => sum + e.amount, 0);
}

export type CategorySlice = {
  category: string;
  total: number;
  pct: number;
  accent: AccentKey;
  count: number;
};

/** Spend grouped by category, sorted high → low, with share-of-total. */
export function byCategory(expenses: Expense[]): CategorySlice[] {
  const map = new Map<string, { total: number; count: number }>();
  for (const e of expenses) {
    const prev = map.get(e.category) ?? { total: 0, count: 0 };
    map.set(e.category, { total: prev.total + e.amount, count: prev.count + 1 });
  }
  const total = totalSpent(expenses) || 1;
  return [...map.entries()]
    .map(([category, v]) => ({
      category,
      total: v.total,
      count: v.count,
      pct: v.total / total,
      accent: categoryDef(category).accent,
    }))
    .sort((a, b) => b.total - a.total);
}

export type MerchantSlice = { merchant: string; total: number; count: number };

/** Top merchants by total spend. */
export function topMerchants(expenses: Expense[], limit = 5): MerchantSlice[] {
  const map = new Map<string, { total: number; count: number }>();
  for (const e of expenses) {
    const prev = map.get(e.merchant) ?? { total: 0, count: 0 };
    map.set(e.merchant, { total: prev.total + e.amount, count: prev.count + 1 });
  }
  return [...map.entries()]
    .map(([merchant, v]) => ({ merchant, total: v.total, count: v.count }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

export type TrendPoint = { label: string; total: number; iso: string };

/** Daily spend for the last `days` days (oldest → newest), zero-filled. */
export function dailyTrend(expenses: Expense[], days = 7, ref = new Date()): TrendPoint[] {
  const buckets = new Map<number, number>();
  for (const e of expenses) {
    const key = startOfDay(new Date(e.date));
    buckets.set(key, (buckets.get(key) ?? 0) + e.amount);
  }
  const out: TrendPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(ref);
    d.setDate(d.getDate() - i);
    const key = startOfDay(d);
    out.push({
      iso: d.toISOString(),
      label: d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2),
      total: buckets.get(key) ?? 0,
    });
  }
  return out;
}

/** Merchants that appear 3+ times — a cheap recurring-payment heuristic. */
export function recurringMerchants(expenses: Expense[]): MerchantSlice[] {
  return topMerchants(expenses, 50).filter((m) => m.count >= 3);
}

export type HealthLabel = 'excellent' | 'good' | 'fair' | 'attention';

export type FinancialHealth = {
  score: number; // 0–100
  label: HealthLabel;
  utilization: number; // totalSpent / totalBudget
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  overspentCount: number;
  hasBudget: boolean;
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * A transparent 0–100 financial health score.
 * Rewards staying under budget, penalizes overspent spaces. Deterministic so the
 * UI and the AI explanation always agree on the same number.
 */
export function financialHealth(expenses: Expense[], budgets: Budget[]): FinancialHealth {
  const totalBudget = budgets.reduce((a, b) => a + b.amount, 0);
  const spent = budgets.reduce((a, b) => a + b.spent, 0) || totalSpent(expenses);
  const overspentCount = budgets.filter((b) => b.spent > b.amount && b.amount > 0).length;
  const hasBudget = totalBudget > 0;

  const utilization = hasBudget ? spent / totalBudget : 0;
  const remaining = Math.max(0, totalBudget - spent);

  let score: number;
  if (!hasBudget) {
    score = 50;
  } else {
    const adherence = 1 - utilization; // positive when under budget
    score = clamp(Math.round(60 + adherence * 40 - overspentCount * 8), 0, 100);
  }

  const label: HealthLabel =
    score >= 80 ? 'excellent' : score >= 65 ? 'good' : score >= 45 ? 'fair' : 'attention';

  return { score, label, utilization, totalBudget, totalSpent: spent, remaining, overspentCount, hasBudget };
}
