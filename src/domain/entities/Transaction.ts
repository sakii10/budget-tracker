export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: number;
  type: TransactionType;
  amountCents: number;
  date: string;
  description: string | null;
  categoryId: number;
}

export type NewTransaction = Omit<Transaction, 'id'>;