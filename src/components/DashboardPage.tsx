import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useFinance } from '@/contexts/FinanceContext';
import { CATEGORY_CONFIG } from '@/lib/types';
import { predictNextMonth } from '@/lib/ai-insights';
import { TrendingUp, TrendingDown, Wallet, Brain } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

function MetricCard({ label, value, icon: Icon, trend, color }: {
  label: string; value: string; icon: React.ElementType; trend?: string; color?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-lg p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</span>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <p className="font-mono text-2xl font-semibold tabular-nums" style={color ? { color } : undefined}>{value}</p>
      {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
    </motion.div>
  );
}

export function DashboardPage() {
  const { transactions } = useFinance();

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const monthTx = transactions.filter(t => t.date.startsWith(currentMonth));
    const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const balance = totalIncome - totalExpenses;
    const predicted = predictNextMonth(transactions);

    // Monthly chart data
    const chartData: { month: string; income: number; expenses: number }[] = [];
    for (let m = 5; m >= 0; m--) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const mTx = transactions.filter(t => t.date.startsWith(key));
      chartData.push({
        month: d.toLocaleDateString('en', { month: 'short' }),
        income: mTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expenses: mTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      });
    }

    // Category breakdown
    const catMap = new Map<string, number>();
    monthTx.filter(t => t.type === 'expense').forEach(t => {
      catMap.set(t.category, (catMap.get(t.category) || 0) + t.amount);
    });
    const categoryData = Array.from(catMap.entries())
      .map(([cat, amount]) => ({
        name: CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG]?.label || cat,
        value: Math.round(amount),
        color: CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG]?.color || '#6B7280',
      }))
      .sort((a, b) => b.value - a.value);

    // Recent transactions
    const recent = [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    return { income, expenses, balance, predicted, chartData, categoryData, recent };
  }, [transactions]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">Vault Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Your financial command center</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Balance" value={`$${stats.balance.toFixed(2)}`} icon={Wallet} color="hsl(var(--primary))" />
        <MetricCard label="Monthly Income" value={`$${stats.income.toFixed(2)}`} icon={TrendingUp} color="hsl(var(--success))" />
        <MetricCard label="Monthly Expenses" value={`$${stats.expenses.toFixed(2)}`} icon={TrendingDown} color="hsl(var(--destructive))" />
        <MetricCard label="Next Month Forecast" value={`$${stats.predicted.toFixed(0)}`} icon={Brain} trend="AI-powered prediction" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area Chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-card border border-border rounded-lg p-5">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">6-Month Trend</h2>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={stats.chartData}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(185, 100%, 50%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(185, 100%, 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#A1A1AA', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#A1A1AA', fontSize: 12 }} tickFormatter={v => `$${v / 1000}k`} />
              <Tooltip
                contentStyle={{ background: 'hsl(240, 4%, 7%)', border: '1px solid hsl(240, 4%, 14%)', borderRadius: 8, color: '#fff', fontSize: 13 }}
                formatter={(value: number) => [`$${value.toFixed(0)}`, undefined]}
              />
              <Area type="monotone" dataKey="income" stroke="hsl(142, 71%, 45%)" strokeWidth={2} fill="url(#incomeGrad)" name="Income" />
              <Area type="monotone" dataKey="expenses" stroke="hsl(185, 100%, 50%)" strokeWidth={2} fill="url(#expenseGrad)" name="Expenses" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Pie Chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Spending Breakdown</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={stats.categoryData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {stats.categoryData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: 'hsl(240, 4%, 7%)', border: '1px solid hsl(240, 4%, 14%)', borderRadius: 8, color: '#fff', fontSize: 13 }}
                formatter={(value: number) => [`$${value}`, undefined]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {stats.categoryData.slice(0, 4).map(c => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                  <span className="text-muted-foreground">{c.name}</span>
                </div>
                <span className="font-mono tabular-nums">${c.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="bg-card border border-border rounded-lg p-5">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Recent Transactions</h2>
        <div className="space-y-2">
          {stats.recent.map(t => (
            <div key={t.id} className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-accent transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-lg">{CATEGORY_CONFIG[t.category]?.icon}</span>
                <div>
                  <p className="text-sm font-medium">{t.description}</p>
                  <p className="text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString()}</p>
                </div>
              </div>
              <span className={`font-mono text-sm tabular-nums ${t.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
