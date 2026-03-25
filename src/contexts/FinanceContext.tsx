import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Transaction, Budget, SavingsGoal } from '@/lib/types';
import * as store from '@/lib/store';

interface FinanceContextType {
  transactions: Transaction[];
  budgets: Budget[];
  goals: SavingsGoal[];
  addTransaction: (t: Transaction) => void;
  updateTransaction: (t: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addBudget: (b: Budget) => void;
  deleteBudget: (id: string) => void;
  addGoal: (g: SavingsGoal) => void;
  updateGoal: (g: SavingsGoal) => void;
  deleteGoal: (id: string) => void;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);

  useEffect(() => {
    store.seedDemoData();
    setTransactions(store.getTransactions());
    setBudgets(store.getBudgets());
    setGoals(store.getGoals());
  }, []);

  const handleAddTransaction = useCallback((t: Transaction) => {
    setTransactions(store.addTransaction(t));
  }, []);
  const handleUpdateTransaction = useCallback((t: Transaction) => {
    setTransactions(store.updateTransaction(t));
  }, []);
  const handleDeleteTransaction = useCallback((id: string) => {
    setTransactions(store.deleteTransaction(id));
  }, []);
  const handleAddBudget = useCallback((b: Budget) => {
    setBudgets(store.addBudget(b));
  }, []);
  const handleDeleteBudget = useCallback((id: string) => {
    setBudgets(store.deleteBudget(id));
  }, []);
  const handleAddGoal = useCallback((g: SavingsGoal) => {
    setGoals(store.addGoal(g));
  }, []);
  const handleUpdateGoal = useCallback((g: SavingsGoal) => {
    setGoals(store.updateGoal(g));
  }, []);
  const handleDeleteGoal = useCallback((id: string) => {
    setGoals(store.deleteGoal(id));
  }, []);

  return (
    <FinanceContext.Provider value={{
      transactions, budgets, goals,
      addTransaction: handleAddTransaction,
      updateTransaction: handleUpdateTransaction,
      deleteTransaction: handleDeleteTransaction,
      addBudget: handleAddBudget,
      deleteBudget: handleDeleteBudget,
      addGoal: handleAddGoal,
      updateGoal: handleUpdateGoal,
      deleteGoal: handleDeleteGoal,
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
