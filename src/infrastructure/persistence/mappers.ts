import type { Budget } from '../../domain/entities/Budget';
import type { Category } from '../../domain/entities/Category';
import type { Transaction } from '../../domain/entities/Transaction';
import { centsToAmountString, parseAmountToCents } from '../../domain/rules/money';
import type { RawBudget, RawCategory, RawTransaction } from './rawTypes';

function requireCents(amount: string): number {
  const cents = parseAmountToCents(amount);
  if (cents === null) {
    throw new Error(`Invalid amount in data: ${amount}`);
  }
  return cents;
}

export function toDomainTransaction(raw: RawTransaction): Transaction {
  return {
    id: raw.id,
    type: raw.type,
    amountCents: requireCents(raw.amount),
    date: raw.date,
    description: raw.description,
    categoryId: raw.category_id,
  };
}

export function toRawTransaction(transaction: Transaction): RawTransaction {
  return {
    id: transaction.id,
    type: transaction.type,
    amount: centsToAmountString(transaction.amountCents),
    date: transaction.date,
    description: transaction.description,
    category_id: transaction.categoryId,
  };
}

// Categry has the same shape in both domain and raw, so the mappers are trivial
// but we still define them for consistency and future-proofing.
export function toDomainCategory(raw: RawCategory): Category {
  return { 
    id: raw.id,
    name: raw.name,
    color: raw.color 
    };
}

export function toRawCategory(category: Category): RawCategory {
  return { 
    id: category.id,
    name: category.name, 
    color: category.color 
    };
}

export function toDomainBudget(raw: RawBudget): Budget {
  return {
    month: raw.month,
    categoryId: raw.category_id,
    amountCents: requireCents(raw.amount),
  };
}

export function toRawBudget(budget: Budget): RawBudget {
  return {
    month: budget.month,
    category_id: budget.categoryId,
    amount: centsToAmountString(budget.amountCents),
  };
}