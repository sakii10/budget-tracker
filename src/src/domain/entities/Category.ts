export interface Category {
  id: number;
  name: string;
  /** Hex boja, npr. "#2E7D32" */
  color: string;
}

export type NewCategory = Omit<Category, 'id'>;