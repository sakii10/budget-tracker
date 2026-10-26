export const MAX_AMOUNT_CENTS = 100_000_000; 

const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

export function parseAmountToCents(input: string): number | null {
  const text = input.trim();
  if (!AMOUNT_PATTERN.test(text)) {
    return null;
  }
  const [whole, fraction = ''] = text.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}

export function centsToAmountString(cents: number): string {
 return (cents / 100).toFixed(2);
}