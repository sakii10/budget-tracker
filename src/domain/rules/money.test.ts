import { describe, expect, it } from 'vitest';
import {
  MAX_AMOUNT_CENTS,
  centsToAmountString,
  parseAmountToCents,
} from './money';

describe('parseAmountToCents', () => {
  it('parses amounts with two decimals', () => {
    expect(parseAmountToCents('45.10')).toBe(4510);
    expect(parseAmountToCents('0.29')).toBe(29);
  });

  it('parses amounts with one decimal or none', () => {
    expect(parseAmountToCents('0.1')).toBe(10);
    expect(parseAmountToCents('12')).toBe(1200);
  });

  it('accepts the maximum amount', () => {
    expect(parseAmountToCents('1000000.00')).toBe(MAX_AMOUNT_CENTS);
  });

  it('trims surrounding spaces', () => {
    expect(parseAmountToCents(' 5 ')).toBe(500);
  });

  it('rejects more than two decimals', () => {
    expect(parseAmountToCents('12.345')).toBeNull();
  });

  it('rejects empty, non-numeric and negative input', () => {
    expect(parseAmountToCents('')).toBeNull();
    expect(parseAmountToCents('abc')).toBeNull();
    expect(parseAmountToCents('-5')).toBeNull();
    expect(parseAmountToCents('5.')).toBeNull();
    expect(parseAmountToCents('.5')).toBeNull();
  });

  it('keeps sums exact: 0.10 + 0.20 equals 0.30', () => {
    const sum = parseAmountToCents('0.10')! + parseAmountToCents('0.20')!;
    expect(sum).toBe(parseAmountToCents('0.30'));
  });
});

describe('centsToAmountString', () => {
  it('formats cents with two decimals', () => {
    expect(centsToAmountString(4510)).toBe('45.10');
    expect(centsToAmountString(5)).toBe('0.05');
    expect(centsToAmountString(1200)).toBe('12.00');
  });
});

describe('centsToAmountString', () => {
  it('formats cents with two decimals', () => {
    expect(centsToAmountString(4510)).toBe('45.10');
    expect(centsToAmountString(5)).toBe('0.05');
    expect(centsToAmountString(1200)).toBe('12.00');
  });

  it('handles values that are tricky for floating point', () => {
    expect(centsToAmountString(29)).toBe('0.29');
    expect(centsToAmountString(1005)).toBe('10.05');
    expect(centsToAmountString(100000000)).toBe('1000000.00');
  });

  it('round-trips with parseAmountToCents', () => {
    for (const cents of [0, 1, 29, 1005, 4510, 99999999, 100000000]) {
      expect(parseAmountToCents(centsToAmountString(cents))).toBe(cents);
    }
  });
});