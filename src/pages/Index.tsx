import { useState } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { FinanceProvider } from '@/contexts/FinanceContext';
import { AppSidebar } from '@/components/AppSidebar';
import { DashboardPage } from '@/components/DashboardPage';
import { TransactionsPage } from '@/components/TransactionsPage';
import { BudgetsPage } from '@/components/BudgetsPage';
import { GoalsPage } from '@/components/GoalsPage';
import { ReportsPage } from '@/components/ReportsPage';
import { InsightsPage } from '@/components/InsightsPage';
import { SettingsPage } from '@/components/SettingsPage';
import { AuthPage } from '@/components/AuthPage';
import { Loader2 } from 'lucide-react';

type Page = 'dashboard' | 'transactions' | 'budgets' | 'goals' | 'reports' | 'insights' | 'settings';

const pages: Record<Page, React.ComponentType> = {
  dashboard: DashboardPage,
  transactions: TransactionsPage,
  budgets: BudgetsPage,
  goals: GoalsPage,
  reports: ReportsPage,
  insights: InsightsPage,
  settings: SettingsPage,
};

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <AuthPage />;

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
}

const Index = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default Index;
