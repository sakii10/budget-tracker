import { describe, expect, it } from 'vitest';
import type { Budget } from '../entities/Budget';
import type { Transaction } from '../entities/Transaction';
import { calculateMonthlySummary } from './calculateMonthlySummary';

const MONTH = '2026-10';

function transaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 1,
    type: 'expense',
    amountCents: 1000,
    date: '2026-10-05',
    description: null,
    categoryId: 1,
    ...overrides,
  };
}

function budget(overrides: Partial<Budget> = {}): Budget {
  return { month: MONTH, categoryId: 1, amountCents: 20000, ...overrides };
}

describe('calculateMonthlySummary totals', () => {
  it('sums income and expense for the month only', () => {
    const transactions = [
      transaction({ id: 1, type: 'income', amountCents: 185050, date: '2026-10-01' }),
      transaction({ id: 2, amountCents: 65000, date: '2026-10-02', categoryId: 2 }),
      transaction({ id: 3, amountCents: 4510, date: '2026-10-03' }),
      transaction({ id: 4, amountCents: 7340, date: '2026-09-15' }),
    ];
    const summary = calculateMonthlySummary(transactions, [], MONTH);
    expect(summary.incomeCents).toBe(185050);
    expect(summary.expenseCents).toBe(69510);
  });

  it('keeps sums exact: 0.10 plus 0.20 is 0.30', () => {
    const transactions = [
      transaction({ id: 1, type: 'income', amountCents: 10 }),
      transaction({ id: 2, type: 'income', amountCents: 20 }),
    ];
    expect(calculateMonthlySummary(transactions, [], MONTH).incomeCents).toBe(30);
  });

  it('returns zeros and no categories for an empty month', () => {
    expect(calculateMonthlySummary([], [], MONTH)).toEqual({
      incomeCents: 0,
      expenseCents: 0,
      categories: [],
    });
  });
});

describe('calculateMonthlySummary categories', () => {
  it('sorts categories by highest expense first', () => {
    const transactions = [
      transaction({ id: 1, categoryId: 1, amountCents: 3000 }),
      transaction({ id: 2, categoryId: 2, amountCents: 9000 }),
      transaction({ id: 3, categoryId: 3, amountCents: 5000 }),
    ];
    const summary = calculateMonthlySummary(transactions, [], MONTH);
    expect(summary.categories.map((item) => item.categoryId)).toEqual([2, 3, 1]);
  });

  it('orders categories with equal expense by id', () => {
    const transactions = [
      transaction({ id: 1, categoryId: 2, amountCents: 1000 }),
      transaction({ id: 2, categoryId: 1, amountCents: 1000 }),
    ];
    const summary = calculateMonthlySummary(transactions, [], MONTH);
    expect(summary.categories.map((item) => item.categoryId)).toEqual([1, 2]);
  });

  it('adds up several expenses of the same category', () => {
    const transactions = [
      transaction({ id: 1, amountCents: 6235 }),
      transaction({ id: 2, amountCents: 15330 }),
    ];
    const summary = calculateMonthlySummary(transactions, [], MONTH);
    expect(summary.categories).toEqual([
      { categoryId: 1, expenseCents: 21565, budgetCents: null },
    ]);
  });

  it('attaches the budget of the month to its category', () => {
    const summary = calculateMonthlySummary(
      [transaction({ amountCents: 4750 })],
      [budget({ amountCents: 8000 })],
      MONTH,
    );
    expect(summary.categories).toEqual([
      { categoryId: 1, expenseCents: 4750, budgetCents: 8000 },
    ]);
  });

  it('includes a category that has a budget but no expense', () => {
    const summary = calculateMonthlySummary(
      [],
      [budget({ categoryId: 4, amountCents: 5000 })],
      MONTH,
    );
    expect(summary.categories).toEqual([
      { categoryId: 4, expenseCents: 0, budgetCents: 5000 },
    ]);
  });

  it('leaves out categories that only have income', () => {
    const transactions = [transaction({ id: 1, type: 'income', categoryId: 3 })];
    expect(calculateMonthlySummary(transactions, [], MONTH).categories).toEqual([]);
  });

  it('ignores budgets of other months', () => {
    const summary = calculateMonthlySummary(
      [],
      [budget({ month: '2026-09', categoryId: 5 })],
      MONTH,
    );
    expect(summary.categories).toEqual([]);
  });
});