import { useState } from 'react';
import { cn } from '@/lib/utils';
import { LayoutDashboard, ArrowUpDown, Target, PiggyBank, BarChart3, Brain, Download } from 'lucide-react';

type Page = 'dashboard' | 'transactions' | 'budgets' | 'goals' | 'reports' | 'insights';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const navItems: { id: Page; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: ArrowUpDown },
  { id: 'budgets', label: 'Budgets', icon: PiggyBank },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'insights', label: 'AI Insights', icon: Brain },
];

export function AppSidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-[72px] lg:w-[240px] bg-sidebar border-r border-border flex flex-col z-50">
      <div className="h-16 flex items-center px-4 lg:px-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">V</span>
          </div>
          <span className="hidden lg:block text-foreground font-semibold tracking-tight">Vault.ai</span>
        </div>
      </div>

      <nav className="flex-1 py-4 px-2 lg:px-3 space-y-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors relative",
                active
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r" />
              )}
              <Icon className="w-5 h-5 shrink-0" />
              <span className="hidden lg:block">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <div className="hidden lg:flex items-center gap-2 px-3 py-2">
          <div className="w-2 h-2 rounded-full bg-success" />
          <span className="text-xs text-muted-foreground">System Online</span>
        </div>
      </div>
    </aside>
  );
}
