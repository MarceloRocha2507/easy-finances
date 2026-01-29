import { ReactNode, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { SidebarNav, SidebarUserSection } from "@/components/sidebar";
import { Menu, X, Wallet } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth();
  const { isAdmin, isCheckingRole } = useAdmin();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Decorative gradient background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-20 w-60 h-60 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-background/95 border-b border-border/50 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-primary/10">
          <span className="text-sm font-semibold text-primary">Fina</span>
        </div>
        <button
          className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
          onClick={toggleSidebar}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Sidebar - fundo sólido ao invés de glass para melhor performance */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-60 bg-background/95 border-r border-border/50 z-40 transition-transform duration-200",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-14 flex items-center px-4 border-b border-border/50">
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 shadow-sm">
              <Wallet className="h-5 w-5 text-primary" />
              <span className="text-lg font-bold text-primary">Fina</span>
            </div>
          </div>

          {/* Navigation - memoizado */}
          <SidebarNav 
            isAdmin={!isCheckingRole && isAdmin} 
            onItemClick={closeSidebar} 
          />

          {/* User section - isolado */}
          <SidebarUserSection 
            user={user} 
            onClose={closeSidebar} 
            onSignOut={signOut} 
          />
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-foreground/20 z-30"
          onClick={closeSidebar}
        />
      )}

      {/* Main content */}
      <main className="lg:pl-60 pt-14 lg:pt-0 min-h-screen flex flex-col">
        <div className="p-6 flex-1">{children}</div>
      </main>
    </div>
  );
}
