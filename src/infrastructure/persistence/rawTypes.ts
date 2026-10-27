import type { TransactionType } from '../../domain/entities/Transaction';

export interface RawCategory {
  id: number;
  name: string;
  color: string;
}

export interface RawTransaction {
  id: number;
  type: TransactionType;
  amount: string;
  date: string;
  description: string | null;
  category_id: number;
}

export interface RawBudget {
  month: string;
  category_id: number;
  amount: string;
}

export interface RawBudgetData {
  categories: RawCategory[];
  transactions: RawTransaction[];
  budgets: RawBudget[];
}