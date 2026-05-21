import type { BudgetType } from '@/types';

/** Accent token keys understood by the theme palette. */
export type AccentKey = 'accentViolet' | 'accentPink' | 'accentBlue' | 'accentEmerald';

export type CategoryDef = {
  /** Stable key used for storage + AI grounding. */
  key: string;
  /** Display label (English; UI is matched against i18n where available). */
  label: string;
  /** lucide-react-native icon name. */
  icon: string;
  accent: AccentKey;
};

/** Curated expense categories. Order is intentional — most common first. */
export const CATEGORIES: CategoryDef[] = [
  { key: 'Groceries', label: 'Groceries', icon: 'ShoppingCart', accent: 'accentEmerald' },
  { key: 'Dining', label: 'Dining', icon: 'Utensils', accent: 'accentPink' },
  { key: 'Coffee', label: 'Coffee', icon: 'Coffee', accent: 'accentViolet' },
  { key: 'Transport', label: 'Transport', icon: 'Car', accent: 'accentBlue' },
  { key: 'Subscriptions', label: 'Subscriptions', icon: 'Repeat', accent: 'accentViolet' },
  { key: 'Bills', label: 'Bills', icon: 'ReceiptText', accent: 'accentBlue' },
  { key: 'Shopping', label: 'Shopping', icon: 'ShoppingBag', accent: 'accentPink' },
  { key: 'Health', label: 'Health', icon: 'HeartPulse', accent: 'accentEmerald' },
  { key: 'Entertainment', label: 'Entertainment', icon: 'Clapperboard', accent: 'accentPink' },
  { key: 'Travel', label: 'Travel', icon: 'Plane', accent: 'accentBlue' },
  { key: 'Education', label: 'Education', icon: 'GraduationCap', accent: 'accentViolet' },
  { key: 'Other', label: 'Other', icon: 'Tag', accent: 'accentEmerald' },
];

export const CATEGORY_KEYS = CATEGORIES.map((c) => c.key);

export function categoryDef(key: string): CategoryDef {
  return CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[CATEGORIES.length - 1];
}

export type BudgetTypeDef = {
  type: BudgetType;
  icon: string;
  accent: AccentKey;
};

export const BUDGET_TYPES: BudgetTypeDef[] = [
  { type: 'monthly', icon: 'Wallet', accent: 'accentViolet' },
  { type: 'travel', icon: 'Plane', accent: 'accentBlue' },
  { type: 'business', icon: 'Briefcase', accent: 'accentEmerald' },
  { type: 'event', icon: 'PartyPopper', accent: 'accentPink' },
  { type: 'family', icon: 'Users', accent: 'accentEmerald' },
];

export const ACCENT_OPTIONS: AccentKey[] = [
  'accentViolet',
  'accentPink',
  'accentBlue',
  'accentEmerald',
];

export type CurrencyDef = { code: string; symbol: string; name: string };

/** Common currencies for the picker. Formatting itself is locale-aware via Intl. */
export const CURRENCIES: CurrencyDef[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
  { code: 'CAD', symbol: '$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: '$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
];
