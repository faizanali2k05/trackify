import { useSettingsStore } from '@/store/settings';

/**
 * Locale-aware currency formatter. Returns a stable function — safe to use
 * inside renders without re-creating Intl.NumberFormat on every cell.
 */
export function useCurrency() {
  const currency = useSettingsStore((s) => s.currency);
  const locale = useSettingsStore((s) => s.locale);

  function format(amount: number, opts?: { compact?: boolean; sign?: boolean }) {
    try {
      const formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        notation: opts?.compact ? 'compact' : 'standard',
        signDisplay: opts?.sign ? 'always' : 'auto',
        maximumFractionDigits: 2,
      });
      return formatter.format(amount);
    } catch {
      // Older RN/Hermes builds may lack full ICU for some locales — degrade gracefully.
      return `${currency} ${amount.toFixed(2)}`;
    }
  }

  return { format, currency };
}
