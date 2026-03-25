import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useFinance } from '@/contexts/FinanceContext';
import { generateInsights } from '@/lib/ai-insights';
import { Brain, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';

const iconMap = {
  prediction: TrendingUp,
  anomaly: AlertTriangle,
  tip: Lightbulb,
};

const colorMap = {
  info: 'text-primary border-primary/20',
  warning: 'text-warning border-warning/20',
  success: 'text-success border-success/20',
};

export function InsightsPage() {
  const { transactions } = useFinance();
  const insights = useMemo(() => generateInsights(transactions), [transactions]);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Brain className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">AI Insights</h1>
        </div>
        <p className="text-sm text-muted-foreground">Intelligent analysis of your financial patterns</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, i) => {
          const Icon = iconMap[insight.type];
          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`ai-glow ai-glow-pulse bg-card rounded-lg p-5 ${colorMap[insight.severity]}`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-accent shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-sm text-foreground mb-1">{insight.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{insight.description}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {insights.length === 0 && (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <Brain className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Add more transactions to unlock AI-powered insights.</p>
        </div>
      )}

      <div className="bg-card border border-border rounded-lg p-5">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
          <div>
            <TrendingUp className="w-4 h-4 text-primary mb-2" />
            <p className="font-medium text-foreground text-xs mb-1">Spending Prediction</p>
            <p className="text-xs">Weighted moving average across 6 months of historical data to forecast next month's expenses.</p>
          </div>
          <div>
            <AlertTriangle className="w-4 h-4 text-warning mb-2" />
            <p className="font-medium text-foreground text-xs mb-1">Anomaly Detection</p>
            <p className="text-xs">Z-score analysis per category to flag spending that deviates significantly from your patterns.</p>
          </div>
          <div>
            <Lightbulb className="w-4 h-4 text-success mb-2" />
            <p className="font-medium text-foreground text-xs mb-1">Smart Tips</p>
            <p className="text-xs">Rule-based engine analyzing savings rate, category distribution, and recurring costs.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
