import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Transaction, Budget, SavingsGoal, Category } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface FinanceContextType {
  transactions: Transaction[];
  budgets: Budget[];
  goals: SavingsGoal[];
  currency: string;
  loading: boolean;
  setCurrency: (c: string) => void;
  addTransaction: (t: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (t: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addBudget: (b: Omit<Budget, 'id'>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  addGoal: (g: Omit<SavingsGoal, 'id'>) => Promise<void>;
  updateGoal: (g: SavingsGoal) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  refresh: () => void;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

function mapTransaction(row: any): Transaction {
  return {
    id: row.id,
    type: row.type as 'income' | 'expense',
    amount: Number(row.amount),
    category: row.category as Category,
    description: row.description,
    date: row.date,
    isRecurring: row.is_recurring,
    recurringFrequency: row.recurring_frequency || undefined,
  };
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [currency, setCurrencyState] = useState('USD');
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    
    const [txRes, budgetRes, goalRes, settingsRes] = await Promise.all([
      supabase.from('transactions').select('*').order('date', { ascending: false }),
      supabase.from('budgets').select('*'),
      supabase.from('savings_goals').select('*'),
      supabase.from('user_settings').select('*').single(),
    ]);

    if (txRes.data) setTransactions(txRes.data.map(mapTransaction));
    if (budgetRes.data) setBudgets(budgetRes.data.map(b => ({
      id: b.id, category: b.category as Category, limit: Number(b.budget_limit), month: b.month,
    })));
    if (goalRes.data) setGoals(goalRes.data.map(g => ({
      id: g.id, name: g.name, target: Number(g.target), current: Number(g.current_amount), deadline: g.deadline,
    })));
    if (settingsRes.data) setCurrencyState(settingsRes.data.currency);

    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const setCurrency = useCallback(async (c: string) => {
    setCurrencyState(c);
    if (user) {
      await supabase.from('user_settings').update({ currency: c }).eq('user_id', user.id);
    }
  }, [user]);

  const addTransaction = useCallback(async (t: Omit<Transaction, 'id'>) => {
    if (!user) return;
    await supabase.from('transactions').insert({
      user_id: user.id,
      type: t.type,
      amount: t.amount,
      category: t.category,
      description: t.description,
      date: t.date,
      is_recurring: t.isRecurring,
      recurring_frequency: t.recurringFrequency || null,
    });
    fetchAll();
  }, [user, fetchAll]);

  const updateTransaction = useCallback(async (t: Transaction) => {
    await supabase.from('transactions').update({
      type: t.type,
      amount: t.amount,
      category: t.category,
      description: t.description,
      date: t.date,
      is_recurring: t.isRecurring,
      recurring_frequency: t.recurringFrequency || null,
    }).eq('id', t.id);
    fetchAll();
  }, [fetchAll]);

  const deleteTransaction = useCallback(async (id: string) => {
    await supabase.from('transactions').delete().eq('id', id);
    fetchAll();
  }, [fetchAll]);

  const addBudget = useCallback(async (b: Omit<Budget, 'id'>) => {
    if (!user) return;
    // Upsert: if same category+month exists, update
    const existing = budgets.find(x => x.category === b.category && x.month === b.month);
    if (existing) {
      await supabase.from('budgets').update({ budget_limit: b.limit }).eq('id', existing.id);
    } else {
      await supabase.from('budgets').insert({
        user_id: user.id, category: b.category, budget_limit: b.limit, month: b.month,
      });
    }
    fetchAll();
  }, [user, budgets, fetchAll]);

  const deleteBudget = useCallback(async (id: string) => {
    await supabase.from('budgets').delete().eq('id', id);
    fetchAll();
  }, [fetchAll]);

  const addGoal = useCallback(async (g: Omit<SavingsGoal, 'id'>) => {
    if (!user) return;
    await supabase.from('savings_goals').insert({
      user_id: user.id, name: g.name, target: g.target, current_amount: g.current, deadline: g.deadline,
    });
    fetchAll();
  }, [user, fetchAll]);

  const updateGoal = useCallback(async (g: SavingsGoal) => {
    await supabase.from('savings_goals').update({
      name: g.name, target: g.target, current_amount: g.current, deadline: g.deadline,
    }).eq('id', g.id);
    fetchAll();
  }, [fetchAll]);

  const deleteGoal = useCallback(async (id: string) => {
    await supabase.from('savings_goals').delete().eq('id', id);
    fetchAll();
  }, [fetchAll]);

  return (
    <FinanceContext.Provider value={{
      transactions, budgets, goals, currency, loading,
      setCurrency,
      addTransaction, updateTransaction, deleteTransaction,
      addBudget, deleteBudget,
      addGoal, updateGoal, deleteGoal,
      refresh: fetchAll,
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
}
