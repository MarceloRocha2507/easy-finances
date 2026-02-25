import { ReactNode, useState, useCallback, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { SidebarNav, SidebarUserSection } from "@/components/sidebar";
import { Menu, X, Wallet } from "lucide-react";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { useIsMobile } from "@/hooks/use-mobile";
import { WhatsNewDialog } from "@/components/WhatsNewDialog";

const SIDEBAR_WIDTH = 280;

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth();
  const { isAdmin, isCheckingRole } = useAdmin();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);

  const { dragOffset, isDragging } = useSwipeGesture({
    onSwipeRight: openSidebar,
    onSwipeLeft: closeSidebar,
    enabled: isMobile,
    sidebarOpen,
    sidebarWidth: SIDEBAR_WIDTH,
  });

  // Compute sidebar transform and overlay opacity during drag
  const sidebarStyle = useMemo(() => {
    if (!isDragging) return undefined;
    if (sidebarOpen) {
      // Closing: sidebar moves from 0 to -100%
      return { transform: `translateX(${-dragOffset}px)` };
    }
    // Opening: sidebar moves from -100% toward 0
    return { transform: `translateX(calc(-100% + ${dragOffset}px))` };
  }, [isDragging, sidebarOpen, dragOffset]);

  const overlayOpacity = useMemo(() => {
    if (!isDragging) return undefined;
    if (sidebarOpen) {
      return 1 - dragOffset / SIDEBAR_WIDTH;
    }
    return dragOffset / SIDEBAR_WIDTH;
  }, [isDragging, sidebarOpen, dragOffset]);

  const showOverlay = sidebarOpen || (isDragging && dragOffset > 0);

  // Block body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isMobile, sidebarOpen]);

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

      {/* Desktop Sidebar - Flush, minimal */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-full w-64 z-40 sidebar-premium flex-col overflow-hidden">
        <div className="h-14 flex items-center px-5 border-b border-border/30">
          <div className="flex items-center gap-2.5">
            <Wallet className="h-5 w-5 text-foreground" />
            <span className="text-xl font-bold text-foreground">Fina</span>
          </div>
        </div>
          <SidebarNav 
            isAdmin={!isCheckingRole && isAdmin} 
            onItemClick={closeSidebar}
          />
        <SidebarUserSection 
          user={user} 
          onClose={closeSidebar} 
          onSignOut={signOut} 
        />
      </aside>

      {/* Mobile Sidebar - Floating Drawer */}
      <aside
        className={cn(
          "lg:hidden fixed top-16 left-0 bottom-0 w-[280px] max-w-[75vw] sidebar-premium z-40 flex flex-col overflow-hidden",
          !isDragging && "transition-transform duration-300 ease-out",
          !isDragging && (sidebarOpen ? "translate-x-0" : "-translate-x-full")
        )}
        style={sidebarStyle}
      >
        <SidebarNav 
          isAdmin={!isCheckingRole && isAdmin} 
          onItemClick={closeSidebar}
        />
        <SidebarUserSection 
          user={user} 
          onClose={closeSidebar} 
          onSignOut={signOut} 
        />
      </aside>

      {/* Edge touch capture zone - blocks native browser gestures */}
      {isMobile && !sidebarOpen && (
        <div
          className="fixed top-0 left-0 bottom-0 w-5 z-50"
          style={{ touchAction: "none" }}
        />
      )}

      {/* Mobile overlay */}
      {showOverlay && (
        <div
          className={cn(
            "lg:hidden fixed inset-0 bg-foreground/20 z-30",
            !isDragging && "transition-opacity duration-300 ease-out"
          )}
          style={{
            ...(overlayOpacity !== undefined ? { opacity: overlayOpacity } : {}),
            touchAction: "pan-y",
          }}
          onClick={closeSidebar}
        />
      )}

      {/* Main content */}
      <main className="lg:pl-64 pt-14 lg:pt-0 min-h-screen flex flex-col">
        <div className="p-6 flex-1">{children}</div>
      </main>

      <WhatsNewDialog />
    </div>
  );
}
