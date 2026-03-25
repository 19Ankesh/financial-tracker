import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useFinance } from '@/contexts/FinanceContext';
import { CATEGORY_CONFIG } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

export function ReportsPage() {
  const { transactions } = useFinance();
  const [view, setView] = useState<'monthly' | 'yearly'>('monthly');

  const data = useMemo(() => {
    const now = new Date();
    
    // Monthly data (last 12 months)
    const monthly: { month: string; income: number; expenses: number; net: number }[] = [];
    for (let m = 11; m >= 0; m--) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const mTx = transactions.filter(t => t.date.startsWith(key));
      const inc = mTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const exp = mTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      monthly.push({ month: d.toLocaleDateString('en', { month: 'short', year: '2-digit' }), income: inc, expenses: exp, net: inc - exp });
    }

    // Category totals
    const catMap = new Map<string, number>();
    const period = view === 'monthly' 
      ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      : `${now.getFullYear()}`;
    transactions
      .filter(t => t.type === 'expense' && t.date.startsWith(period))
      .forEach(t => catMap.set(t.category, (catMap.get(t.category) || 0) + t.amount));
    const categories = Array.from(catMap.entries())
      .map(([cat, val]) => ({ name: CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG]?.label || cat, value: Math.round(val), color: CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG]?.color || '#6B7280' }))
      .sort((a, b) => b.value - a.value);

    return { monthly, categories };
  }, [transactions, view]);

  const tooltipStyle = { background: 'hsl(240, 4%, 7%)', border: '1px solid hsl(240, 4%, 14%)', borderRadius: 8, color: '#fff', fontSize: 13 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Financial Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">Analyze your spending patterns</p>
        </div>
        <div className="flex gap-1 bg-accent rounded-md p-0.5">
          {(['monthly', 'yearly'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 text-xs rounded font-medium transition-colors ${view === v ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {v === 'monthly' ? 'Monthly' : 'Yearly'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Income vs Expenses Bar Chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Income vs Expenses</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.monthly.slice(-6)}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#A1A1AA', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#A1A1AA', fontSize: 12 }} tickFormatter={v => `$${v / 1000}k`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`$${v.toFixed(0)}`, undefined]} />
              <Bar dataKey="income" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} name="Income" />
              <Bar dataKey="expenses" fill="hsl(185, 100%, 50%)" radius={[4, 4, 0, 0]} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Net Savings Trend */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Net Savings Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.monthly.slice(-6)}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#A1A1AA', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#A1A1AA', fontSize: 12 }} tickFormatter={v => `$${v / 1000}k`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`$${v.toFixed(0)}`, undefined]} />
              <Line type="monotone" dataKey="net" stroke="hsl(185, 100%, 50%)" strokeWidth={2} dot={{ r: 4, fill: 'hsl(185, 100%, 50%)' }} name="Net Savings" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-lg p-5 lg:col-span-2">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Category Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={data.categories} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2}>
                  {data.categories.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`$${v}`, undefined]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {data.categories.map(c => (
                <div key={c.name} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ background: c.color }} />
                    <span className="text-sm">{c.name}</span>
                  </div>
                  <span className="font-mono text-sm tabular-nums">${c.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
