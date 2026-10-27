import type { Budget } from '../../domain/entities/Budget';
import type { Category, NewCategory } from '../../domain/entities/Category';
import type { NewTransaction, Transaction } from '../../domain/entities/Transaction';
import type { BudgetRepository } from '../../domain/repositories/BudgetRepository';
import { NotFoundError } from '../../domain/repositories/errors';
import {
  toDomainBudget,
  toDomainCategory,
  toDomainTransaction,
  toRawBudget,
  toRawCategory,
  toRawTransaction,
} from './mappers';
import type { NetworkSimulator } from './network';
import type { RawBudgetData } from './rawTypes';

export const STORAGE_KEY = 'budget-tracker-data';

function nextId(items: { id: number }[]): number {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

function assertExists(items: { id: number }[], id: number, entity: string): void {
  if (!items.some((item) => item.id === id)) {
    throw new NotFoundError(entity, id);
  }
}

function readStored(): RawBudgetData | null {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data === null) {
    return null;
  }
  try {
    return JSON.parse(data) as RawBudgetData;
  } catch {
    return null;
  }
}

function persist(data: RawBudgetData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export class LocalBudgetRepository implements BudgetRepository {
  private readonly loadSeed: () => Promise<RawBudgetData>;
  private readonly network: NetworkSimulator;

  constructor(loadSeed: () => Promise<RawBudgetData>, network: NetworkSimulator) {
    this.loadSeed = loadSeed;
    this.network = network;
  }

  private async load(): Promise<RawBudgetData> {
    const stored = readStored();
    if (stored !== null) {
      return stored;
    }
    const seed = await this.loadSeed();
    persist(seed);
    return seed;
  }

  async getTransactions(): Promise<Transaction[]> {
    await this.network.beforeRead();
    const data = await this.load();
    return data.transactions.map(toDomainTransaction);
  }

  async createTransaction(input: NewTransaction): Promise<Transaction> {
    await this.network.beforeWrite();
    const data = await this.load();
    const raw = toRawTransaction({ ...input, id: nextId(data.transactions) });
    persist({ ...data, transactions: [...data.transactions, raw] });
    return toDomainTransaction(raw);
  }

  async updateTransaction(id: number, input: NewTransaction): Promise<Transaction> {
    await this.network.beforeWrite();
    const data = await this.load();
    assertExists(data.transactions, id, 'Transaction');
    const raw = toRawTransaction({ ...input, id });
    persist({
      ...data,
      transactions: data.transactions.map((item) => (item.id === id ? raw : item)),
    });
    return toDomainTransaction(raw);
  }

  async deleteTransaction(id: number): Promise<void> {
    await this.network.beforeWrite();
    const data = await this.load();
    assertExists(data.transactions, id, 'Transaction');
    persist({
      ...data,
      transactions: data.transactions.filter((item) => item.id !== id),
    });
  }

  async getCategories(): Promise<Category[]> {
    await this.network.beforeRead();
    const data = await this.load();
    return data.categories.map(toDomainCategory);
  }

  async createCategory(input: NewCategory): Promise<Category> {
    await this.network.beforeWrite();
    const data = await this.load();
    const raw = toRawCategory({ ...input, id: nextId(data.categories) });
    persist({ ...data, categories: [...data.categories, raw] });
    return toDomainCategory(raw);
  }

  async updateCategory(id: number, input: NewCategory): Promise<Category> {
    await this.network.beforeWrite();
    const data = await this.load();
    assertExists(data.categories, id, 'Category');
    const raw = toRawCategory({ ...input, id });
    persist({
      ...data,
      categories: data.categories.map((item) => (item.id === id ? raw : item)),
    });
    return toDomainCategory(raw);
  }

  async deleteCategory(id: number): Promise<void> {
    await this.network.beforeWrite();
    const data = await this.load();
    assertExists(data.categories, id, 'Category');
    persist({
      ...data,
      categories: data.categories.filter((item) => item.id !== id),
      budgets: data.budgets.filter((item) => item.category_id !== id),
    });
  }

  async getBudgets(): Promise<Budget[]> {
    await this.network.beforeRead();
    const data = await this.load();
    return data.budgets.map(toDomainBudget);
  }

  async setBudget(budget: Budget): Promise<Budget> {
    await this.network.beforeWrite();
    const data = await this.load();
    const raw = toRawBudget(budget);
    const others = data.budgets.filter(
      (item) => !(item.month === budget.month && item.category_id === budget.categoryId),
    );
    persist({ ...data, budgets: [...others, raw] });
    return toDomainBudget(raw);
  }

  async removeBudget(month: string, categoryId: number): Promise<void> {
    await this.network.beforeWrite();
    const data = await this.load();
    const remaining = data.budgets.filter(
      (item) => !(item.month === month && item.category_id === categoryId),
    );
    if (remaining.length === data.budgets.length) {
      throw new NotFoundError('Budget', `${month}/${categoryId}`);
    }
    persist({ ...data, budgets: remaining });
  }

  async resetData(): Promise<void> {
    await this.network.beforeWrite();
    localStorage.removeItem(STORAGE_KEY);
    await this.load();
  }
}