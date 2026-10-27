import type { Budget } from '../entities/Budget';
import type { Category, NewCategory } from '../entities/Category';
import type { NewTransaction, Transaction } from '../entities/Transaction';

export interface BudgetRepository {
  getTransactions(): Promise<Transaction[]>;
  createTransaction(input: NewTransaction): Promise<Transaction>;
  updateTransaction(id: number, input: NewTransaction): Promise<Transaction>;
  deleteTransaction(id: number): Promise<void>;

  getCategories(): Promise<Category[]>;
  createCategory(input: NewCategory): Promise<Category>;
  updateCategory(id: number, input: NewCategory): Promise<Category>;
  deleteCategory(id: number): Promise<void>;

  getBudgets(): Promise<Budget[]>;
  setBudget(budget: Budget): Promise<Budget>;
  removeBudget(month: string, categoryId: number): Promise<void>;

  resetData(): Promise<void>;
}