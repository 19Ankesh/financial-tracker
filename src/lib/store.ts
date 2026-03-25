import { Transaction, Budget, SavingsGoal } from './types';

const KEYS = {
  transactions: 'vault_transactions',
  budgets: 'vault_budgets',
  goals: 'vault_goals',
};

function load<T>(key: string, fallback: T[]): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch { return fallback; }
}

function save<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Transactions
export function getTransactions(): Transaction[] {
  return load<Transaction>(KEYS.transactions, []);
}
export function saveTransactions(t: Transaction[]) {
  save(KEYS.transactions, t);
}
export function addTransaction(t: Transaction) {
  const all = getTransactions();
  all.push(t);
  saveTransactions(all);
  return all;
}
export function updateTransaction(t: Transaction) {
  const all = getTransactions().map(x => x.id === t.id ? t : x);
  saveTransactions(all);
  return all;
}
export function deleteTransaction(id: string) {
  const all = getTransactions().filter(x => x.id !== id);
  saveTransactions(all);
  return all;
}

// Budgets
export function getBudgets(): Budget[] {
  return load<Budget>(KEYS.budgets, []);
}
export function saveBudgets(b: Budget[]) {
  save(KEYS.budgets, b);
}
export function addBudget(b: Budget) {
  const all = getBudgets();
  const existing = all.findIndex(x => x.category === b.category && x.month === b.month);
  if (existing >= 0) all[existing] = b;
  else all.push(b);
  saveBudgets(all);
  return all;
}
export function deleteBudget(id: string) {
  const all = getBudgets().filter(x => x.id !== id);
  saveBudgets(all);
  return all;
}

// Goals
export function getGoals(): SavingsGoal[] {
  return load<SavingsGoal>(KEYS.goals, []);
}
export function saveGoals(g: SavingsGoal[]) {
  save(KEYS.goals, g);
}
export function addGoal(g: SavingsGoal) {
  const all = getGoals();
  all.push(g);
  saveGoals(all);
  return all;
}
export function updateGoal(g: SavingsGoal) {
  const all = getGoals().map(x => x.id === g.id ? g : x);
  saveGoals(all);
  return all;
}
export function deleteGoal(id: string) {
  const all = getGoals().filter(x => x.id !== id);
  saveGoals(all);
  return all;
}

// Seed demo data
export function seedDemoData() {
  if (getTransactions().length > 0) return;
  
  const now = new Date();
  const transactions: Transaction[] = [];
  
  const expenseTemplates = [
    { category: 'food' as const, descriptions: ['Grocery Store', 'Restaurant', 'Coffee Shop', 'Food Delivery'], range: [15, 120] },
    { category: 'transport' as const, descriptions: ['Uber Ride', 'Gas Station', 'Metro Pass'], range: [5, 60] },
    { category: 'utilities' as const, descriptions: ['Electric Bill', 'Internet', 'Water Bill'], range: [30, 150] },
    { category: 'entertainment' as const, descriptions: ['Netflix', 'Movie Tickets', 'Concert'], range: [10, 80] },
    { category: 'shopping' as const, descriptions: ['Amazon', 'Clothing Store', 'Electronics'], range: [20, 200] },
    { category: 'subscriptions' as const, descriptions: ['Spotify', 'Gym Membership', 'Cloud Storage'], range: [10, 50] },
    { category: 'health' as const, descriptions: ['Pharmacy', 'Doctor Visit'], range: [20, 100] },
  ];

  for (let m = 5; m >= 0; m--) {
    const month = new Date(now.getFullYear(), now.getMonth() - m, 1);
    
    // Salary
    transactions.push({
      id: crypto.randomUUID(),
      type: 'income',
      amount: 5000 + Math.random() * 500,
      category: 'salary',
      description: 'Monthly Salary',
      date: new Date(month.getFullYear(), month.getMonth(), 1).toISOString(),
      isRecurring: true,
      recurringFrequency: 'monthly',
    });

    // Freelance
    if (Math.random() > 0.3) {
      transactions.push({
        id: crypto.randomUUID(),
        type: 'income',
        amount: 500 + Math.random() * 1500,
        category: 'freelance',
        description: 'Freelance Project',
        date: new Date(month.getFullYear(), month.getMonth(), 10 + Math.floor(Math.random() * 15)).toISOString(),
        isRecurring: false,
      });
    }

    // Expenses
    for (const tmpl of expenseTemplates) {
      const count = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        transactions.push({
          id: crypto.randomUUID(),
          type: 'expense',
          amount: tmpl.range[0] + Math.random() * (tmpl.range[1] - tmpl.range[0]),
          category: tmpl.category,
          description: tmpl.descriptions[Math.floor(Math.random() * tmpl.descriptions.length)],
          date: new Date(month.getFullYear(), month.getMonth(), 1 + Math.floor(Math.random() * 27)).toISOString(),
          isRecurring: tmpl.category === 'subscriptions',
          recurringFrequency: tmpl.category === 'subscriptions' ? 'monthly' : undefined,
        });
      }
    }
  }

  saveTransactions(transactions);

  // Demo budgets
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  saveBudgets([
    { id: crypto.randomUUID(), category: 'food', limit: 500, month: currentMonth },
    { id: crypto.randomUUID(), category: 'entertainment', limit: 200, month: currentMonth },
    { id: crypto.randomUUID(), category: 'shopping', limit: 300, month: currentMonth },
    { id: crypto.randomUUID(), category: 'transport', limit: 150, month: currentMonth },
  ]);

  // Demo goals
  saveGoals([
    { id: crypto.randomUUID(), name: 'Emergency Fund', target: 10000, current: 3500, deadline: new Date(now.getFullYear() + 1, 5, 1).toISOString() },
    { id: crypto.randomUUID(), name: 'New Laptop', target: 2000, current: 800, deadline: new Date(now.getFullYear(), now.getMonth() + 4, 1).toISOString() },
  ]);
}
