import { describe, expect, it } from 'vitest';
import { getLatestTransactionMonth, getMonthOfDate, isValidDate, isValidMonth, shiftMonth } from './dates';
import type { Transaction } from '../entities/Transaction';

describe('isValidDate', () => {
  it('accepts real dates, including leap days', () => {
    expect(isValidDate('2026-10-03')).toBe(true);
    expect(isValidDate('2028-02-29')).toBe(true);
  });

  it('rejects dates that do not exist', () => {
    expect(isValidDate('2026-02-29')).toBe(false);
    expect(isValidDate('2026-02-30')).toBe(false);
    expect(isValidDate('2026-13-01')).toBe(false);
    expect(isValidDate('2026-10-32')).toBe(false);
  });

  it('rejects wrong formats', () => {
    expect(isValidDate('')).toBe(false);
    expect(isValidDate('abc')).toBe(false);
    expect(isValidDate('2026-1-5')).toBe(false);
    expect(isValidDate('03.10.2026')).toBe(false);
  });
});

describe('isValidMonth', () => {
  it('accepts YYYY-MM with a month from 01 to 12', () => {
    expect(isValidMonth('2026-10')).toBe(true);
    expect(isValidMonth('2026-12')).toBe(true);
  });

  it('rejects everything else', () => {
    expect(isValidMonth('2026-00')).toBe(false);
    expect(isValidMonth('2026-13')).toBe(false);
    expect(isValidMonth('2026-1')).toBe(false);
    expect(isValidMonth('2026-10-03')).toBe(false);
    expect(isValidMonth('')).toBe(false);
  });
});

describe('getMonthOfDate', () => {
  it('returns the month part of a date', () => {
    expect(getMonthOfDate('2026-10-03')).toBe('2026-10');
  });
});

describe('shiftMonth', () => {
  it('moves forward and backward within a year', () => {
    expect(shiftMonth('2026-10', 1)).toBe('2026-11');
    expect(shiftMonth('2026-10', -1)).toBe('2026-09');
    expect(shiftMonth('2026-10', 0)).toBe('2026-10');
  });

  it('crosses year boundaries', () => {
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
  });
});

function transactionOn(date: string, id: number): Transaction {
  return {
    id,
    type: 'expense',
    amountCents: 1000,
    date,
    description: null,
    categoryId: 1,
  };
}

describe('getLatestTransactionMonth', () => {
  it('returns the month of the newest transaction by date', () => {
    const transactions = [
      transactionOn('2026-08-31', 3),
      transactionOn('2026-10-21', 1),
      transactionOn('2026-09-30', 2),
    ];
    expect(getLatestTransactionMonth(transactions)).toBe('2026-10');
  });

  it('returns null when there are no transactions', () => {
    expect(getLatestTransactionMonth([])).toBeNull();
  });
});