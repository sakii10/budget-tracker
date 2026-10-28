import type { Budget } from '../entities/Budget';
import type { Transaction } from '../entities/Transaction';
import { getMonthOfDate } from './dates';

export interface CategorySummary {
  categoryId: number;
  expenseCents: number;
  budgetCents: number | null;
}

export interface MonthlySummary {
  incomeCents: number;
  expenseCents: number;
  categories: CategorySummary[];
}

export function calculateMonthlySummary(
  transactions: Transaction[],
  budgets: Budget[],
  month: string,
): MonthlySummary {
  let incomeCents = 0;
  let expenseCents = 0;

  const expenseByCategory = new Map<number, number>();

  for (const transaction of transactions) {
    if (getMonthOfDate(transaction.date) !== month) {
      continue;
    }
    if (transaction.type === 'income') {
      incomeCents += transaction.amountCents;
      continue;
    }
    expenseCents += transaction.amountCents;
    const current = expenseByCategory.get(transaction.categoryId) ?? 0;
    expenseByCategory.set(transaction.categoryId, current + transaction.amountCents);
  }

  const budgetByCategory = new Map<number, number>();
  for (const budget of budgets) {
    if (budget.month === month) {
      budgetByCategory.set(budget.categoryId, budget.amountCents);
    }
  }

    const categoryIds = new Set([
    ...expenseByCategory.keys(),
    ...budgetByCategory.keys(),
    ]);

    const categories = Array.from(categoryIds, (categoryId) => ({
    categoryId,
    expenseCents: expenseByCategory.get(categoryId) ?? 0,
    budgetCents: budgetByCategory.get(categoryId) ?? null,
    }));

    categories.sort((a, b) => {
    if (a.expenseCents !== b.expenseCents) {
        return b.expenseCents - a.expenseCents;
    }
    return a.categoryId - b.categoryId;
    });

    return { incomeCents, expenseCents, categories };

}

