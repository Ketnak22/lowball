/** Two letters for the round avatar, e.g. "Ola" -> "Ol". */
export function initials(name: string): string {
  return Array.from(name.replace(/\s+/g, '')).slice(0, 2).join('');
}

const numberFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 });

/** Groups thousands with narrow no-break spaces: 40075 -> "40 075". */
export function formatNumber(value: number): string {
  return numberFormat.format(value).replace(/,/g, ' ');
}

export function signed(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}
