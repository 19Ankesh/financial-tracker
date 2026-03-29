import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinance } from '@/contexts/FinanceContext';
import { Transaction, Category, CATEGORY_CONFIG, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/lib/types';
import { formatMoney } from '@/lib/currencies';
import { exportToCSV } from '@/lib/export';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, Download, Trash2, Pencil, ArrowUpDown, CalendarIcon } from 'lucide-react';

function TransactionForm({ initial, onSubmit, onClose }: {
  initial?: Transaction;
  onSubmit: (t: Omit<Transaction, 'id'> & { id?: string }) => void;
  onClose: () => void;
}) {
  const [type, setType] = useState(initial?.type || 'expense');
  const [amount, setAmount] = useState(initial?.amount?.toString() || '');
  const [category, setCategory] = useState<Category>(initial?.category || 'food');
  const [description, setDescription] = useState(initial?.description || '');
  const [date, setDate] = useState(initial?.date?.slice(0, 10) || new Date().toISOString().slice(0, 10));
  const [isRecurring, setIsRecurring] = useState(initial?.isRecurring || false);
  const [frequency, setFrequency] = useState<'weekly' | 'monthly' | 'yearly'>(initial?.recurringFrequency || 'monthly');

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...(initial?.id ? { id: initial.id } : {}),
      type: type as 'income' | 'expense',
      amount: parseFloat(amount),
      category,
      description,
      date,
      isRecurring,
      recurringFrequency: isRecurring ? frequency : undefined,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2">
        {(['income', 'expense'] as const).map(t => (
          <button key={t} type="button" onClick={() => { setType(t); setCategory(t === 'income' ? 'salary' : 'food'); }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${type === t ? (t === 'income' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive') : 'bg-accent text-muted-foreground'}`}>
            {t === 'income' ? 'Income' : 'Expense'}
          </button>
        ))}
      </div>

      <Input type="number" step="0.01" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} required className="font-mono" />
      
      <Select value={category} onValueChange={v => setCategory(v as Category)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {categories.map(c => (
            <SelectItem key={c} value={c}>{CATEGORY_CONFIG[c].icon} {CATEGORY_CONFIG[c].label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} required />
      <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} className="rounded border-border" />
        <span className="text-muted-foreground">Recurring transaction</span>
      </label>

      {isRecurring && (
        <Select value={frequency} onValueChange={v => setFrequency(v as 'weekly' | 'monthly' | 'yearly')}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      )}

      <Button type="submit" className="w-full">{initial ? 'Update' : 'Add'} Transaction</Button>
    </form>
  );
}

export function TransactionsPage() {
  const { transactions, addTransaction, updateTransaction, deleteTransaction, currency } = useFinance();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | undefined>();

  const filtered = useMemo(() => {
    return transactions
      .filter(t => {
        if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
        if (filterCategory !== 'all' && t.category !== filterCategory) return false;
        if (filterType !== 'all' && t.type !== filterType) return false;
        return true;
      })
      .sort((a, b) => {
        const mul = sortDir === 'asc' ? 1 : -1;
        if (sortField === 'date') return mul * (new Date(a.date).getTime() - new Date(b.date).getTime());
        return mul * (a.amount - b.amount);
      });
  }, [transactions, search, filterCategory, filterType, sortField, sortDir]);

  const toggleSort = (field: 'date' | 'amount') => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const handleSubmit = async (t: Omit<Transaction, 'id'> & { id?: string }) => {
    if (t.id) {
      await updateTransaction(t as Transaction);
    } else {
      await addTransaction(t);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportToCSV(filtered)}>
            <Download className="w-4 h-4 mr-1" /> Export
          </Button>
          <Dialog open={dialogOpen} onOpenChange={v => { setDialogOpen(v); if (!v) setEditing(undefined); }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? 'Edit' : 'New'} Transaction</DialogTitle></DialogHeader>
              <TransactionForm
                initial={editing}
                onSubmit={handleSubmit}
                onClose={() => { setDialogOpen(false); setEditing(undefined); }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search transactions..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {[...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES].map(c => (
              <SelectItem key={c} value={c}>{CATEGORY_CONFIG[c].icon} {CATEGORY_CONFIG[c].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider border-b border-border font-medium">
          <span>Transaction</span>
          <button onClick={() => toggleSort('date')} className="flex items-center gap-1 hover:text-foreground transition-colors">
            Date <ArrowUpDown className="w-3 h-3" />
          </button>
          <span>Category</span>
          <button onClick={() => toggleSort('amount')} className="flex items-center gap-1 hover:text-foreground transition-colors">
            Amount <ArrowUpDown className="w-3 h-3" />
          </button>
          <span>Actions</span>
        </div>
        <AnimatePresence>
          {filtered.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-3 items-center hover:bg-accent/50 transition-colors border-b border-border/50 last:border-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg shrink-0">{CATEGORY_CONFIG[t.category]?.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{t.description}</p>
                  {t.isRecurring && <span className="text-[10px] text-primary uppercase tracking-wider">Recurring</span>}
                </div>
              </div>
              <span className="text-sm text-muted-foreground whitespace-nowrap">{new Date(t.date).toLocaleDateString()}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-muted-foreground">{CATEGORY_CONFIG[t.category]?.label}</span>
              <span className={`font-mono text-sm tabular-nums whitespace-nowrap ${t.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                {t.type === 'income' ? '+' : '-'}{formatMoney(t.amount, currency)}
              </span>
              <div className="flex gap-1">
                <button onClick={() => { setEditing(t); setDialogOpen(true); }}
                  className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => deleteTransaction(t.id)}
                  className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground text-sm">No transactions found</div>
        )}
      </div>
    </div>
  );
}
