import { Transaction, CATEGORY_CONFIG, EXPENSE_CATEGORIES } from './types';

interface Insight {
  id: string;
  type: 'prediction' | 'anomaly' | 'tip';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'success';
}

function getMonthlyTotals(transactions: Transaction[], months: number): Map<string, number> {
  const now = new Date();
  const totals = new Map<string, number>();
  
  for (let m = months - 1; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    totals.set(key, 0);
  }

  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (totals.has(key)) {
        totals.set(key, (totals.get(key) || 0) + t.amount);
      }
    });

  return totals;
}

function getCategorySpending(transactions: Transaction[], month: string): Map<string, number> {
  const spending = new Map<string, number>();
  transactions
    .filter(t => t.type === 'expense' && t.date.startsWith(month))
    .forEach(t => {
      spending.set(t.category, (spending.get(t.category) || 0) + t.amount);
    });
  return spending;
}

// Simple moving average prediction
function predictNextMonth(transactions: Transaction[]): number {
  const totals = getMonthlyTotals(transactions, 6);
  const values = Array.from(totals.values()).filter(v => v > 0);
  if (values.length < 2) return 0;
  
  // Weighted moving average (recent months weighted more)
  let weightedSum = 0;
  let weightTotal = 0;
  values.forEach((v, i) => {
    const weight = i + 1;
    weightedSum += v * weight;
    weightTotal += weight;
  });
  
  return weightedSum / weightTotal;
}

// Z-score based anomaly detection
function detectAnomalies(transactions: Transaction[]): Insight[] {
  const insights: Insight[] = [];
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  for (const cat of EXPENSE_CATEGORIES) {
    const monthlyAmounts: number[] = [];
    for (let m = 5; m >= 1; m--) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const spending = getCategorySpending(transactions, key);
      monthlyAmounts.push(spending.get(cat) || 0);
    }
    
    const currentSpending = getCategorySpending(transactions, currentMonth).get(cat) || 0;
    if (monthlyAmounts.filter(a => a > 0).length < 2 || currentSpending === 0) continue;
    
    const mean = monthlyAmounts.reduce((a, b) => a + b, 0) / monthlyAmounts.length;
    const stdDev = Math.sqrt(monthlyAmounts.reduce((sum, v) => sum + (v - mean) ** 2, 0) / monthlyAmounts.length);
    
    if (stdDev === 0) continue;
    const zScore = (currentSpending - mean) / stdDev;
    
    if (zScore > 1.5) {
      const pctOver = ((currentSpending - mean) / mean * 100).toFixed(0);
      insights.push({
        id: `anomaly-${cat}`,
        type: 'anomaly',
        title: `Unusual ${CATEGORY_CONFIG[cat].label} Spending`,
        description: `Your ${CATEGORY_CONFIG[cat].label} spending is ${pctOver}% above your average. Current: $${currentSpending.toFixed(0)} vs avg: $${mean.toFixed(0)}.`,
        severity: zScore > 2.5 ? 'warning' : 'info',
      });
    }
  }
  
  return insights;
}

function generateTips(transactions: Transaction[]): Insight[] {
  const tips: Insight[] = [];
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const spending = getCategorySpending(transactions, currentMonth);
  
  const totalExpense = Array.from(spending.values()).reduce((a, b) => a + b, 0);
  const totalIncome = transactions
    .filter(t => t.type === 'income' && t.date.startsWith(currentMonth))
    .reduce((s, t) => s + t.amount, 0);

  if (totalIncome > 0) {
    const savingsRate = ((totalIncome - totalExpense) / totalIncome) * 100;
    if (savingsRate < 20) {
      tips.push({
        id: 'tip-savings-rate',
        type: 'tip',
        title: 'Boost Your Savings Rate',
        description: `Your savings rate is ${savingsRate.toFixed(0)}%. Financial experts recommend saving at least 20% of income. Try reducing discretionary spending.`,
        severity: savingsRate < 10 ? 'warning' : 'info',
      });
    } else {
      tips.push({
        id: 'tip-great-savings',
        type: 'tip',
        title: 'Great Savings Rate!',
        description: `You're saving ${savingsRate.toFixed(0)}% of your income this month. Keep it up!`,
        severity: 'success',
      });
    }
  }

  // Find top spending category
  let topCat = '';
  let topAmount = 0;
  spending.forEach((amount, cat) => {
    if (amount > topAmount) { topCat = cat; topAmount = amount; }
  });
  
  if (topCat && totalExpense > 0) {
    const pct = (topAmount / totalExpense * 100).toFixed(0);
    tips.push({
      id: 'tip-top-category',
      type: 'tip',
      title: `${CATEGORY_CONFIG[topCat as keyof typeof CATEGORY_CONFIG]?.label || topCat} Dominates Spending`,
      description: `${pct}% of your expenses go to ${CATEGORY_CONFIG[topCat as keyof typeof CATEGORY_CONFIG]?.label || topCat}. Consider if there are ways to optimize this category.`,
      severity: Number(pct) > 40 ? 'warning' : 'info',
    });
  }

  // Subscription audit
  const subs = transactions.filter(t => t.isRecurring && t.type === 'expense');
  if (subs.length > 3) {
    const monthlySubCost = subs.reduce((s, t) => s + t.amount, 0);
    tips.push({
      id: 'tip-subscriptions',
      type: 'tip',
      title: 'Subscription Audit',
      description: `You have ${subs.length} recurring expenses totaling $${monthlySubCost.toFixed(0)}/period. Review if all are necessary.`,
      severity: 'info',
    });
  }

  return tips;
}

export function generateInsights(transactions: Transaction[]): Insight[] {
  const insights: Insight[] = [];
  
  // Prediction
  const predicted = predictNextMonth(transactions);
  if (predicted > 0) {
    insights.push({
      id: 'prediction-next-month',
      type: 'prediction',
      title: 'Next Month Forecast',
      description: `Based on your spending patterns, we predict ~$${predicted.toFixed(0)} in expenses next month.`,
      severity: 'info',
    });
  }
  
  insights.push(...detectAnomalies(transactions));
  insights.push(...generateTips(transactions));
  
  return insights;
}

export { predictNextMonth };
