export type TransactionType = 'income' | 'expense';

export type Category = 
  | 'salary' | 'freelance' | 'investments' | 'gifts' | 'other-income'
  | 'food' | 'transport' | 'housing' | 'utilities' | 'entertainment'
  | 'shopping' | 'health' | 'education' | 'travel' | 'subscriptions'
  | 'personal' | 'other';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: Category;
  description: string;
  date: string; // ISO string
  isRecurring: boolean;
  recurringFrequency?: 'weekly' | 'monthly' | 'yearly';
}

export interface Budget {
  id: string;
  category: Category;
  limit: number;
  month: string; // YYYY-MM
}

export interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline: string;
}

export const CATEGORY_CONFIG: Record<Category, { label: string; color: string; icon: string }> = {
  'salary': { label: 'Salary', color: '#22C55E', icon: '💰' },
  'freelance': { label: 'Freelance', color: '#10B981', icon: '💻' },
  'investments': { label: 'Investments', color: '#06B6D4', icon: '📈' },
  'gifts': { label: 'Gifts', color: '#8B5CF6', icon: '🎁' },
  'other-income': { label: 'Other Income', color: '#14B8A6', icon: '💵' },
  'food': { label: 'Food & Dining', color: '#F97316', icon: '🍔' },
  'transport': { label: 'Transport', color: '#3B82F6', icon: '🚗' },
  'housing': { label: 'Housing', color: '#EF4444', icon: '🏠' },
  'utilities': { label: 'Utilities', color: '#F59E0B', icon: '⚡' },
  'entertainment': { label: 'Entertainment', color: '#EC4899', icon: '🎬' },
  'shopping': { label: 'Shopping', color: '#A855F7', icon: '🛍️' },
  'health': { label: 'Health', color: '#22D3EE', icon: '🏥' },
  'education': { label: 'Education', color: '#6366F1', icon: '📚' },
  'travel': { label: 'Travel', color: '#14B8A6', icon: '✈️' },
  'subscriptions': { label: 'Subscriptions', color: '#F43F5E', icon: '📱' },
  'personal': { label: 'Personal', color: '#84CC16', icon: '👤' },
  'other': { label: 'Other', color: '#6B7280', icon: '📦' },
};

export const INCOME_CATEGORIES: Category[] = ['salary', 'freelance', 'investments', 'gifts', 'other-income'];
export const EXPENSE_CATEGORIES: Category[] = ['food', 'transport', 'housing', 'utilities', 'entertainment', 'shopping', 'health', 'education', 'travel', 'subscriptions', 'personal', 'other'];
