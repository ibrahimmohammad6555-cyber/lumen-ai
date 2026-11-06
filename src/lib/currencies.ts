// src/lib/currencies.ts
// Currency definitions and deterministic conversion engine for LUMEN.AI

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  locale: string;
  rateToINR: number; // 1 unit of this currency in INR
}

export const CURRENCIES: Currency[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN', rateToINR: 1.0 },
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US', rateToINR: 84.5 },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE', rateToINR: 91.8 },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB', rateToINR: 109.5 },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', locale: 'ar-AE', rateToINR: 23.0 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP', rateToINR: 0.56 },
];

export const DEFAULT_CURRENCY = 'INR';

export function getCurrency(code: string): Currency {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

/**
 * Converts an amount from a source currency into a target currency.
 */
export function convertCurrency(
  amount: number,
  fromCode: string,
  toCode: string
): number {
  if (fromCode === toCode) return amount;
  const from = getCurrency(fromCode);
  const to = getCurrency(toCode);
  const amountInINR = amount * from.rateToINR;
  return amountInINR / to.rateToINR;
}

export function formatCurrency(
  amount: number,
  currencyCode: string,
  compact = false
): string {
  const currency = getCurrency(currencyCode);
  try {
    if (compact && Math.abs(amount) >= 100000) {
      const formatted = new Intl.NumberFormat(currency.locale, {
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 1,
      }).format(amount);
      return `${currency.symbol}${formatted}`;
    }
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency.symbol}${amount.toLocaleString()}`;
  }
}
