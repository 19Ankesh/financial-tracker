import { useState } from 'react';
import { motion } from 'framer-motion';
import { useFinance } from '@/contexts/FinanceContext';
import { SavingsGoal } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Target } from 'lucide-react';

export function GoalsPage() {
  const { goals, addGoal, updateGoal, deleteGoal } = useFinance();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('0');
  const [deadline, setDeadline] = useState('');
  const [addAmountId, setAddAmountId] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addGoal({ id: crypto.randomUUID(), name, target: parseFloat(target), current: parseFloat(current), deadline: new Date(deadline).toISOString() });
    setDialogOpen(false);
    setName(''); setTarget(''); setCurrent('0'); setDeadline('');
  };

  const handleAddFunds = (goal: SavingsGoal) => {
    const amt = parseFloat(addAmount);
    if (amt > 0) {
      updateGoal({ ...goal, current: goal.current + amt });
      setAddAmountId(null);
      setAddAmount('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Savings Goals</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your financial targets</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> New Goal</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Savings Goal</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <Input placeholder="Goal name" value={name} onChange={e => setName(e.target.value)} required />
              <Input type="number" step="0.01" placeholder="Target amount" value={target} onChange={e => setTarget(e.target.value)} required className="font-mono" />
              <Input type="number" step="0.01" placeholder="Current savings" value={current} onChange={e => setCurrent(e.target.value)} className="font-mono" />
              <Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} required />
              <Button type="submit" className="w-full">Create Goal</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map(g => {
          const pct = g.target > 0 ? (g.current / g.target) * 100 : 0;
          const daysLeft = Math.max(0, Math.ceil((new Date(g.deadline).getTime() - Date.now()) / 86400000));
          const remaining = Math.max(0, g.target - g.current);

          return (
            <motion.div key={g.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  <h3 className="font-medium">{g.name}</h3>
                </div>
                <button onClick={() => deleteGoal(g.id)} className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex justify-between text-sm mb-2">
                <span className="font-mono tabular-nums text-primary">${g.current.toFixed(0)}</span>
                <span className="font-mono tabular-nums text-muted-foreground">${g.target.toFixed(0)}</span>
              </div>
              <div className="h-3 bg-accent rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(pct, 100)}%` }}
                  transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
                  className="h-full rounded-full bg-primary"
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>{pct.toFixed(0)}% complete</span>
                <span>{daysLeft} days left • ${remaining.toFixed(0)} to go</span>
              </div>

              {addAmountId === g.id ? (
                <div className="flex gap-2 mt-3">
                  <Input type="number" step="0.01" placeholder="Amount" value={addAmount} onChange={e => setAddAmount(e.target.value)} className="font-mono h-8 text-sm" />
                  <Button size="sm" onClick={() => handleAddFunds(g)} className="h-8">Add</Button>
                  <Button size="sm" variant="outline" onClick={() => setAddAmountId(null)} className="h-8">Cancel</Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => setAddAmountId(g.id)}>
                  Add Funds
                </Button>
              )}
            </motion.div>
          );
        })}
      </div>

      {goals.length === 0 && (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <Target className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No savings goals yet. Create one to start tracking.</p>
        </div>
      )}
    </div>
  );
}
