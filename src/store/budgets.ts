import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandMMKVStorage } from '@/lib/mmkv';
import type { Budget, BudgetType, UUID } from '@/types';

function uid(): UUID {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

type BudgetsState = {
  budgets: Budget[];
  create: (input: Omit<Budget, 'id' | 'createdAt' | 'spent'>) => Budget;
  update: (id: UUID, patch: Partial<Budget>) => void;
  remove: (id: UUID) => void;
  incrementSpent: (id: UUID, delta: number) => void;
};

const seed: Budget[] = [
  {
    id: 'seed-monthly',
    name: 'Everyday',
    type: 'monthly' as BudgetType,
    amount: 2400,
    spent: 1480,
    currency: 'USD',
    color: 'accentViolet',
    icon: 'wallet',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-travel',
    name: 'Lisbon trip',
    type: 'travel' as BudgetType,
    amount: 1800,
    spent: 620,
    currency: 'USD',
    color: 'accentBlue',
    icon: 'plane',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-family',
    name: 'Family',
    type: 'family' as BudgetType,
    amount: 900,
    spent: 312,
    currency: 'USD',
    color: 'accentEmerald',
    icon: 'users',
    createdAt: new Date().toISOString(),
  },
];

export const useBudgetsStore = create<BudgetsState>()(
  persist(
    (set) => ({
      budgets: seed,
      create: (input) => {
        const budget: Budget = {
          ...input,
          id: uid(),
          spent: 0,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ budgets: [budget, ...s.budgets] }));
        return budget;
      },
      update: (id, patch) =>
        set((s) => ({
          budgets: s.budgets.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        })),
      remove: (id) =>
        set((s) => ({ budgets: s.budgets.filter((b) => b.id !== id) })),
      incrementSpent: (id, delta) =>
        set((s) => ({
          budgets: s.budgets.map((b) =>
            b.id === id ? { ...b, spent: Math.max(0, b.spent + delta) } : b,
          ),
        })),
    }),
    {
      name: 'spendify.budgets',
      storage: createJSONStorage(() => zustandMMKVStorage),
    },
  ),
);
