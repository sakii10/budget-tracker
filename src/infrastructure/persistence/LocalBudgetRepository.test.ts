import { afterEach, describe, expect, it, vi } from 'vitest';
import { NotFoundError } from '../../domain/repositories/errors';
import { LocalBudgetRepository, STORAGE_KEY } from './LocalBudgetRepository';
import { NetworkError } from '../../domain/repositories/errors';
import type { NetworkSimulator } from './network';
import type { RawBudgetData } from './rawTypes';

function installMemoryLocalStorage(): Storage {
  const store = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key) => store.get(key) ?? null,
    key: (index) => [...store.keys()][index] ?? null,
    removeItem: (key) => {
      store.delete(key);
    },
    setItem: (key, value) => {
      store.set(key, String(value));
    },
  };
  vi.stubGlobal('localStorage', storage);
  return storage;
}

function createSeed(): RawBudgetData {
  return {
    categories: [
      { id: 1, name: 'Groceries', color: '#2E7D32' },
      { id: 2, name: 'Rent', color: '#1565C0' },
    ],
    transactions: [
      {
        id: 1,
        type: 'expense',
        amount: '45.10',
        date: '2026-10-03',
        description: 'Weekly shopping',
        category_id: 1,
      },
      {
        id: 7,
        type: 'expense',
        amount: '650.00',
        date: '2026-10-02',
        description: null,
        category_id: 2,
      },
    ],
    budgets: [
      { month: '2026-10', category_id: 1, amount: '200.00' },
      { month: '2026-10', category_id: 2, amount: '650.00' },
    ],
  };
}

const instantNetwork: NetworkSimulator = {
  beforeRead: () => Promise.resolve(),
  beforeWrite: () => Promise.resolve(),
};

interface RepositoryOptions {
  network?: NetworkSimulator;
  stored?: RawBudgetData | string;
}

function createRepository(options: RepositoryOptions = {}) {
  const storage = installMemoryLocalStorage();
  if (options.stored !== undefined) {
    const text =
      typeof options.stored === 'string' ? options.stored : JSON.stringify(options.stored);
    storage.setItem(STORAGE_KEY, text);
  }
  const loadSeed = vi.fn(() => Promise.resolve(createSeed()));
  const repository = new LocalBudgetRepository(
    loadSeed,
    options.network ?? instantNetwork
  );
  return { repository, storage, loadSeed };
}

function readStoredData(storage: Storage): RawBudgetData {
  return JSON.parse(storage.getItem(STORAGE_KEY) ?? '{}') as RawBudgetData;
}

const newTransaction = {
  type: 'expense' as const,
  amountCents: 1250,
  date: '2026-10-19',
  description: 'Taxi',
  categoryId: 1,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('LocalBudgetRepository', () => {
  describe('initial data', () => {
    it('loads seed data on first read and stores it', async () => {
      const { repository, storage, loadSeed } = createRepository();
      const transactions = await repository.getTransactions();
      expect(transactions).toHaveLength(2);
      expect(transactions[0]).toEqual({
        id: 1,
        type: 'expense',
        amountCents: 4510,
        date: '2026-10-03',
        description: 'Weekly shopping',
        categoryId: 1,
      });
      expect(storage.getItem(STORAGE_KEY)).not.toBeNull();
      await repository.getCategories();
      expect(loadSeed).toHaveBeenCalledTimes(1);
    });

    it('prefers stored data over seed data', async () => {
      const stored = createSeed();
      stored.transactions = [];
      const { repository, loadSeed } = createRepository({ stored });
      expect(await repository.getTransactions()).toEqual([]);
      expect(loadSeed).not.toHaveBeenCalled();
    });

    it('falls back to seed data when stored data is not valid JSON', async () => {
      const { repository, loadSeed } = createRepository({ stored: '{broken' });
      expect(await repository.getTransactions()).toHaveLength(2);
      expect(loadSeed).toHaveBeenCalledTimes(1);
    });

    it('restores seed data on reset', async () => {
      const { repository } = createRepository();
      await repository.deleteTransaction(1);
      await repository.resetData();
      expect(await repository.getTransactions()).toHaveLength(2);
    });
  });

  describe('transactions', () => {
    it('creates a transaction with the next id and stores the amount as text', async () => {
      const { repository, storage } = createRepository();
      const created = await repository.createTransaction(newTransaction);
      expect(created.id).toBe(8);
      expect(await repository.getTransactions()).toContainEqual(created);
      const stored = readStoredData(storage).transactions.find((item) => item.id === 8);
      expect(stored?.amount).toBe('12.50');
      expect(stored?.category_id).toBe(1);
    });

    it('updates an existing transaction', async () => {
      const { repository } = createRepository();
      const updated = await repository.updateTransaction(1, {
        ...newTransaction,
        amountCents: 999,
      });
      expect(updated).toEqual({ ...newTransaction, amountCents: 999, id: 1 });
      const transactions = await repository.getTransactions();
      expect(transactions).toHaveLength(2);
      expect(transactions).toContainEqual(updated);
    });

    it('deletes a transaction', async () => {
      const { repository } = createRepository();
      await repository.deleteTransaction(1);
      const transactions = await repository.getTransactions();
      expect(transactions.map((item) => item.id)).toEqual([7]);
    });

    it('throws NotFoundError for a missing transaction', async () => {
      const { repository } = createRepository();
      await expect(repository.updateTransaction(99, newTransaction)).rejects.toBeInstanceOf(
        NotFoundError,
      );
      await expect(repository.deleteTransaction(99)).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('categories', () => {
    it('creates and renames a category', async () => {
      const { repository } = createRepository();
      const created = await repository.createCategory({ name: 'Gifts', color: '#F9A825' });
      expect(created.id).toBe(3);
      const renamed = await repository.updateCategory(3, { name: 'Presents', color: '#F9A825' });
      expect(renamed.name).toBe('Presents');
      expect(await repository.getCategories()).toHaveLength(3);
    });

    it('removes the budgets of a deleted category', async () => {
      const { repository } = createRepository();
      await repository.deleteCategory(2);
      expect(await repository.getCategories()).toHaveLength(1);
      expect(await repository.getBudgets()).toEqual([
        { month: '2026-10', categoryId: 1, amountCents: 20000 },
      ]);
    });

    it('throws NotFoundError for a missing category', async () => {
      const { repository } = createRepository();
      await expect(repository.deleteCategory(99)).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('budgets', () => {
    it('adds a budget for a new month', async () => {
      const { repository } = createRepository();
      await repository.setBudget({ month: '2026-11', categoryId: 1, amountCents: 30000 });
      expect(await repository.getBudgets()).toHaveLength(3);
    });

    it('replaces the budget of the same category and month', async () => {
      const { repository } = createRepository();
      await repository.setBudget({ month: '2026-10', categoryId: 1, amountCents: 25000 });
      const budgets = await repository.getBudgets();
      const matching = budgets.filter(
        (item) => item.month === '2026-10' && item.categoryId === 1,
      );
      expect(budgets).toHaveLength(2);
      expect(matching).toEqual([{ month: '2026-10', categoryId: 1, amountCents: 25000 }]);
    });

    it('removes a budget', async () => {
      const { repository } = createRepository();
      await repository.removeBudget('2026-10', 1);
      expect(await repository.getBudgets()).toHaveLength(1);
    });

    it('throws NotFoundError when removing a missing budget', async () => {
      const { repository } = createRepository();
      await expect(repository.removeBudget('2026-01', 1)).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('network failures', () => {
    const failingReads: NetworkSimulator = {
      beforeRead: () => Promise.reject(new NetworkError('Failed to load data')),
      beforeWrite: () => Promise.resolve(),
    };

    it('fails reads when the network simulator rejects', async () => {
      const { repository } = createRepository({ network: failingReads });
      await expect(repository.getTransactions()).rejects.toBeInstanceOf(NetworkError);
    });

    it('does not fail writes', async () => {
      const { repository } = createRepository({ network: failingReads });
      await expect(repository.createTransaction(newTransaction)).resolves.toBeDefined();
    });
  });
});