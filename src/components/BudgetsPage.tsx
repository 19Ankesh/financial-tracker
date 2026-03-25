import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useFinance } from '@/contexts/FinanceContext';
import { Budget, Category, EXPENSE_CATEGORIES, CATEGORY_CONFIG } from '@/lib/types';
import { formatMoney } from '@/lib/currencies';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';

export function BudgetsPage() {
  const { transactions, budgets, addBudget, deleteBudget, currency } = useFinance();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [category, setCategory] = useState<Category>('food');
  const [limit, setLimit] = useState('');

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const budgetData = useMemo(() => {
    return budgets
      .filter(b => b.month === currentMonth)
      .map(b => {
        const spent = transactions
          .filter(t => t.type === 'expense' && t.category === b.category && t.date.startsWith(currentMonth))
          .reduce((s, t) => s + t.amount, 0);
        const pct = b.limit > 0 ? (spent / b.limit) * 100 : 0;
        return { ...b, spent, pct };
      });
  }, [budgets, transactions, currentMonth]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await addBudget({ category, limit: parseFloat(limit), month: currentMonth });
    setDialogOpen(false);
    setLimit('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Budget Planning</h1>
          <p className="text-sm text-muted-foreground mt-1">Set spending limits by category</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Budget</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Set Budget Limit</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <Select value={category} onValueChange={v => setCategory(v as Category)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{CATEGORY_CONFIG[c].icon} {CATEGORY_CONFIG[c].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="number" step="0.01" placeholder="Monthly limit" value={limit} onChange={e => setLimit(e.target.value)} required className="font-mono" />
              <Button type="submit" className="w-full">Set Budget</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgetData.map(b => (
          <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`bg-card border rounded-lg p-5 ${b.pct > 90 ? 'border-destructive/50' : b.pct > 70 ? 'border-warning/50' : 'border-border'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{CATEGORY_CONFIG[b.category]?.icon}</span>
                <span className="font-medium text-sm">{CATEGORY_CONFIG[b.category]?.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {b.pct > 90 && <AlertTriangle className="w-4 h-4 text-destructive" />}
                <button onClick={() => deleteBudget(b.id)} className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-mono tabular-nums text-muted-foreground">{formatMoney(b.spent, currency)} spent</span>
              <span className="font-mono tabular-nums">{formatMoney(b.limit, currency)} limit</span>
            </div>
            <div className="h-2 bg-accent rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(b.pct, 100)}%` }}
                transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
                className={`h-full rounded-full ${b.pct > 90 ? 'bg-destructive' : b.pct > 70 ? 'bg-warning' : 'bg-primary'}`}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">{b.pct.toFixed(0)}% used</p>
          </motion.div>
        ))}
      </div>

      {budgetData.length === 0 && (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">No budgets set for this month. Add one to start tracking.</p>
        </div>
      )}
    </div>
  );
}
