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

      {/* Desktop Sidebar - Floating */}
      <div className="hidden lg:block fixed top-0 left-0 h-full w-64 p-3 z-40">
        <aside className="h-full sidebar-floating flex flex-col overflow-hidden">
          {/* Logo */}
          <div className="h-14 flex items-center px-4 border-b border-border/30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wallet className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xl font-bold text-foreground">Fina</span>
            </div>
          </div>

          {/* Navigation */}
          <SidebarNav 
            isAdmin={!isCheckingRole && isAdmin} 
            onItemClick={closeSidebar} 
          />

          {/* User section */}
          <SidebarUserSection 
            user={user} 
            onClose={closeSidebar} 
            onSignOut={signOut} 
          />
        </aside>
      </div>

      {/* Mobile Sidebar - Floating Drawer */}
      <aside
        className={cn(
          "lg:hidden fixed top-16 left-3 right-3 bottom-3 sidebar-floating z-40 flex flex-col overflow-hidden transition-all duration-300",
          sidebarOpen 
            ? "translate-y-0 opacity-100" 
            : "translate-y-4 opacity-0 pointer-events-none"
        )}
      >
        {/* Navigation */}
        <SidebarNav 
          isAdmin={!isCheckingRole && isAdmin} 
          onItemClick={closeSidebar} 
        />

        {/* User section */}
        <SidebarUserSection 
          user={user} 
          onClose={closeSidebar} 
          onSignOut={signOut} 
        />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-foreground/20 z-30"
          onClick={closeSidebar}
        />
      )}

      {/* Main content */}
      <main className="lg:pl-64 pt-14 lg:pt-0 min-h-screen flex flex-col">
        <div className="p-6 flex-1">{children}</div>
      </main>
    </div>
  );
}
