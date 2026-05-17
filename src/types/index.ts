export type UUID = string;
export type ISODate = string;

export type BudgetType = 'monthly' | 'travel' | 'business' | 'event' | 'family';

export type Budget = {
  id: UUID;
  name: string;
  type: BudgetType;
  amount: number;
  spent: number;
  currency: string;
  color: string;
  icon: string;
  createdAt: ISODate;
};

export type ExpenseKind = 'fixed' | 'variable';

export type Expense = {
  id: UUID;
  budgetId: UUID | null;
  amount: number;
  currency: string;
  merchant: string;
  category: string;
  kind: ExpenseKind;
  note?: string;
  tags?: string[];
  date: ISODate;
  createdAt: ISODate;
};

export type AIMessage = {
  id: UUID;
  role: 'user' | 'assistant';
  content: string;
  createdAt: ISODate;
};

export type Plan = 'free' | 'pro' | 'ultra';
