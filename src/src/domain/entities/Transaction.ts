export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: number;
  type: TransactionType;
  /** Uvek pozitivan iznos u centima. Tip kaže da li je prihod ili rashod. */
  amountCents: number;
  /** Format YYYY-MM-DD */
  date: string;
  description: string | null;
  categoryId: number;
}

export type NewTransaction = Omit<Transaction, 'id'>;