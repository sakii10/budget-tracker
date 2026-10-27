import { addMonths, format, isValid, parse } from 'date-fns';
import type { Transaction } from '../entities/Transaction';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_PATTERN = /^\d{4}-\d{2}$/;
const REFERENCE_DATE = new Date(2000, 0, 1);

export function isValidDate(value: string): boolean {
  return DATE_PATTERN.test(value) && isValid(parse(value, 'yyyy-MM-dd', REFERENCE_DATE));
}

export function isValidMonth(value: string): boolean {
  return MONTH_PATTERN.test(value) && isValid(parse(value, 'yyyy-MM', REFERENCE_DATE));
}

export function getMonthOfDate(date: string): string {
  return date.slice(0, 7);
}

export function shiftMonth(month: string, delta: number): string {
  return format(addMonths(parse(month, 'yyyy-MM', REFERENCE_DATE), delta), 'yyyy-MM');
}
export function getLatestTransactionMonth(transactions: Transaction[]): string | null {
  let latestDate: string | null = null;
  for (const transaction of transactions) {
    if (latestDate === null || transaction.date > latestDate) {
      latestDate = transaction.date;
    }
  }
  return latestDate === null ? null : getMonthOfDate(latestDate);
}