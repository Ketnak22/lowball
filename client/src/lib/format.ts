import type { Locale } from '@lowball/shared';

/** Two letters for the round avatar, e.g. "Ola" -> "Ol". */
export function initials(name: string): string {
  return Array.from(name.replace(/\s+/g, '')).slice(0, 2).join('');
}

const numberFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 });

/**
 * Groups thousands with narrow no-break spaces in both languages: 40075 -> "40 075".
 * Polish uses a decimal comma: 0.5 -> "0,5".
 */
export function formatNumber(value: number, locale: Locale): string {
  const text = numberFormat.format(value).replace(/,/g, ' ');
  return locale === 'pl' ? text.replace('.', ',') : text;
}

export function signed(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}
