import type { RawBudgetData } from './rawTypes';

export async function fetchSeedData(): Promise<RawBudgetData> {
  const response = await fetch(`${import.meta.env.BASE_URL}budget-data.json`);
  if (!response.ok) {
    throw new Error('Failed to load initial data');
  }
  return (await response.json()) as RawBudgetData;
}