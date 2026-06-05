import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { persistStorage } from '@/lib/storage';
import type { Expense, UUID } from '@/types';

function uid(): UUID {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

type ExpensesState = {
  expenses: Expense[];
  add: (input: Omit<Expense, 'id' | 'createdAt'>) => Expense;
  remove: (id: UUID) => void;
  update: (id: UUID, patch: Partial<Expense>) => void;
};

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

const seed: Expense[] = [
  { id: 's1', budgetId: 'seed-monthly', amount: 12.5, currency: 'USD', merchant: 'Blue Bottle', category: 'Coffee', kind: 'variable', date: daysAgo(0), createdAt: daysAgo(0) },
  { id: 's2', budgetId: 'seed-monthly', amount: 64.2, currency: 'USD', merchant: 'Whole Foods', category: 'Groceries', kind: 'variable', date: daysAgo(0), createdAt: daysAgo(0) },
  { id: 's3', budgetId: 'seed-monthly', amount: 14.99, currency: 'USD', merchant: 'Netflix', category: 'Subscriptions', kind: 'fixed', date: daysAgo(1), createdAt: daysAgo(1) },
  { id: 's4', budgetId: 'seed-travel', amount: 220, currency: 'USD', merchant: 'TAP Air', category: 'Transport', kind: 'variable', date: daysAgo(2), createdAt: daysAgo(2) },
  { id: 's5', budgetId: 'seed-family', amount: 48, currency: 'USD', merchant: 'Pharmacy', category: 'Health', kind: 'variable', date: daysAgo(3), createdAt: daysAgo(3) },
  { id: 's6', budgetId: 'seed-monthly', amount: 8.4, currency: 'USD', merchant: 'Uber', category: 'Transport', kind: 'variable', date: daysAgo(5), createdAt: daysAgo(5) },
  { id: 's7', budgetId: 'seed-monthly', amount: 32, currency: 'USD', merchant: 'Spotify Family', category: 'Subscriptions', kind: 'fixed', date: daysAgo(8), createdAt: daysAgo(8) },
];

export const useExpensesStore = create<ExpensesState>()(
  persist(
    (set) => ({
      expenses: seed,
      add: (input) => {
        const expense: Expense = {
          ...input,
          id: uid(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ expenses: [expense, ...s.expenses] }));
        return expense;
      },
      remove: (id) =>
        set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),
      update: (id, patch) =>
        set((s) => ({
          expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        })),
    }),
    {
      name: 'trackify.expenses',
      storage: createJSONStorage(() => persistStorage),
    },
  ),
);
