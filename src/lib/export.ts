import { Transaction, CATEGORY_CONFIG } from './types';

export function exportToCSV(transactions: Transaction[], filename = 'transactions') {
  const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Recurring'];
  const rows = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map(t => [
      new Date(t.date).toLocaleDateString(),
      t.type,
      CATEGORY_CONFIG[t.category].label,
      t.description,
      t.amount.toFixed(2),
      t.isRecurring ? 'Yes' : 'No',
    ]);

  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
