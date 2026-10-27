import { describe, expect, it } from 'vitest';
import {
  toDomainBudget,
  toDomainTransaction,
  toRawBudget,
  toRawTransaction,
} from './mappers';
import type { RawTransaction } from './rawTypes';

const rawTransaction: RawTransaction = {
  id: 12,
  type: 'expense',
  amount: '45.10',
  date: '2026-10-03',
  description: 'Weekly shopping',
  category_id: 1,
};

describe('transaction mappers', () => {
  it('converts the file shape to the domain shape', () => {
    expect(toDomainTransaction(rawTransaction)).toEqual({
      id: 12,
      type: 'expense',
      amountCents: 4510,
      date: '2026-10-03',
      description: 'Weekly shopping',
      categoryId: 1,
    });
  });

  it('keeps a null description', () => {
    const result = toDomainTransaction({ ...rawTransaction, description: null });
    expect(result.description).toBeNull();
  });

  it('round-trips without changes', () => {
    expect(toRawTransaction(toDomainTransaction(rawTransaction))).toEqual(rawTransaction);
  });

  it('throws on an invalid amount', () => {
    expect(() => toDomainTransaction({ ...rawTransaction, amount: 'abc' })).toThrow();
  });
});

describe('budget mappers', () => {
  it('converts the file shape to the domain shape and back', () => {
    const raw = { month: '2026-10', category_id: 1, amount: '200.00' };
    const budget = toDomainBudget(raw);
    expect(budget).toEqual({ month: '2026-10', categoryId: 1, amountCents: 20000 });
    expect(toRawBudget(budget)).toEqual(raw);
  });
});