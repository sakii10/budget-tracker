import { describe, expect, it } from 'vitest';
import { formatEuro } from './format';

describe('formatEuro', () => {
  it('formats with two decimals and euro sign', () => {
    expect(formatEuro(0)).toBe('0.00 €');
    expect(formatEuro(5)).toBe('0.05 €');
    expect(formatEuro(4510)).toBe('45.10 €');
  });

  it('uses a comma as thousands separator', () => {
    expect(formatEuro(125000)).toBe('1,250.00 €');
    expect(formatEuro(100000000)).toBe('1,000,000.00 €');
  });

  it('formats negative amounts with a minus sign', () => {
    expect(formatEuro(-125000)).toBe('-1,250.00 €');
    expect(formatEuro(-5)).toBe('-0.05 €');
  });
});