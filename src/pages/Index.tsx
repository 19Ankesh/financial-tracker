import { useState } from 'react';
import { FinanceProvider } from '@/contexts/FinanceContext';
import { AppSidebar } from '@/components/AppSidebar';
import { DashboardPage } from '@/components/DashboardPage';
import { TransactionsPage } from '@/components/TransactionsPage';
import { BudgetsPage } from '@/components/BudgetsPage';
import { GoalsPage } from '@/components/GoalsPage';
import { ReportsPage } from '@/components/ReportsPage';
import { InsightsPage } from '@/components/InsightsPage';

type Page = 'dashboard' | 'transactions' | 'budgets' | 'goals' | 'reports' | 'insights';

const pages: Record<Page, React.ComponentType> = {
  dashboard: DashboardPage,
  transactions: TransactionsPage,
  budgets: BudgetsPage,
  goals: GoalsPage,
  reports: ReportsPage,
  insights: InsightsPage,
};

const Index = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const PageComponent = pages[currentPage];

  return (
    <FinanceProvider>
      <div className="min-h-screen bg-background">
        <AppSidebar currentPage={currentPage} onNavigate={setCurrentPage} />
        <main className="pl-[72px] lg:pl-[240px]">
          <div className="max-w-[1400px] mx-auto p-6 lg:p-8">
            <PageComponent />
          </div>
        </main>
      </div>
    </FinanceProvider>
  );
};

export default Index;
