import { ReactNode, useState, useEffect, useMemo, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useAlertasCount } from "@/hooks/useAlertasCount";
import { useProfile } from "@/hooks/useProfile";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tags,
  BarChart3,
  CreditCard,
  PiggyBank,
  LogOut,
  Menu,
  X,
  Shield,
  Bell,
  TrendingUp,
} from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: ArrowLeftRight, label: "Transações", href: "/transactions" },
  { icon: CreditCard, label: "Cartões", href: "/cartoes" },
  { icon: Tags, label: "Categorias", href: "/categories" },
  { icon: PiggyBank, label: "Economia", href: "/economia" },
  { icon: TrendingUp, label: "Investimentos", href: "/investimentos" },
  { icon: BarChart3, label: "Relatórios", href: "/reports" },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { importantes: alertasCount, hasDanger } = useAlertasCount();
  const { data: profile } = useProfile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fechar menu mobile ao mudar de rota
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Memoizar iniciais do usuário
  const userInitials = useMemo(() => {
    const fullName = user?.user_metadata?.full_name || user?.email || "";
    if (fullName.includes("@")) {
      return fullName.substring(0, 2).toUpperCase();
    }
    const names = fullName.split(" ");
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  }, [user?.user_metadata?.full_name, user?.email]);

  const userName = useMemo(() => {
    return user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário";
  }, [user?.user_metadata?.full_name, user?.email]);

  // Memoizar função isActive
  const isActive = useCallback((href: string) => {
    if (href === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(href);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar - Fixed */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-background-secondary border-r border-border flex-col z-50">
        {/* Logo */}
        <div className="p-6">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">F</span>
            </div>
            <span className="font-semibold text-lg text-foreground">Fina</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                isActive(item.href)
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5",
                isActive(item.href) && "text-primary"
              )} />
              <span>{item.label}</span>
            </Link>
          ))}

          {/* Admin Link */}
          {isAdmin && (
            <Link
              to="/admin"
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                isActive("/admin")
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Shield className={cn(
                "h-5 w-5",
                isActive("/admin") && "text-primary"
              )} />
              <span>Admin</span>
            </Link>
          )}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-border space-y-2">
          {/* Notifications */}
          <Link
            to="/notificacoes"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors relative",
              isActive("/notificacoes")
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Bell className="h-5 w-5" />
            <span>Notificações</span>
            {alertasCount > 0 && (
              <span
                className={cn(
                  "absolute right-4 flex h-5 min-w-5 items-center justify-center rounded-full text-[10px] font-bold text-white px-1",
                  hasDanger ? "bg-expense" : "bg-warning"
                )}
              >
                {alertasCount > 9 ? "9+" : alertasCount}
              </span>
            )}
          </Link>

          {/* User Profile */}
          <Link
            to="/profile"
            className={cn(
              "flex items-center gap-3 px-3 py-3 rounded-xl transition-colors",
              isActive("/profile")
                ? "bg-accent"
                : "hover:bg-accent"
            )}
          >
            <Avatar className="h-10 w-10 border-2 border-primary/20">
              <AvatarImage src={profile?.avatar_url || undefined} alt={userName} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{userName}</p>
              <p className="text-xs text-muted-foreground">Ver perfil</p>
            </div>
          </Link>

          {/* Logout */}
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-muted-foreground hover:text-expense hover:bg-expense/10"
          >
            <LogOut className="h-5 w-5" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background border-b border-border z-50 flex items-center justify-between px-4">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-sm font-bold text-primary-foreground">F</span>
          </div>
          <span className="text-base font-semibold text-foreground">Fina</span>
        </Link>
        
        <div className="flex items-center gap-2">
          {/* Notifications Mobile */}
          <Link
            to="/notificacoes"
            className="relative p-2 rounded-xl hover:bg-accent transition-colors"
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
            {alertasCount > 0 && (
              <span
                className={cn(
                  "absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full text-[9px] font-bold text-white px-1",
                  hasDanger ? "bg-expense" : "bg-warning"
                )}
              >
                {alertasCount > 9 ? "9+" : alertasCount}
              </span>
            )}
          </Link>
          
          <button
            className="p-2 rounded-xl hover:bg-accent transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="lg:hidden fixed top-16 left-0 right-0 bottom-0 z-40 overflow-hidden">
            <nav className="bg-background h-full p-4 animate-slide-up overflow-y-auto border-t border-border">
              <div className="space-y-1">
                {navItems.map((item, index) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    style={{ animationDelay: `${index * 50}ms` }}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors animate-fade-in",
                      isActive(item.href)
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}

                {isAdmin && (
                  <Link
                    to="/admin"
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                      isActive("/admin")
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Shield className="h-5 w-5" />
                    <span className="font-medium">Admin</span>
                  </Link>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <Link
                  to="/profile"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-accent transition-colors"
                >
                  <Avatar className="h-10 w-10 border-2 border-primary/20">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={userName} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium">{userName}</span>
                    <span className="text-xs text-muted-foreground">Ver perfil</span>
                  </div>
                </Link>

                <button
                  onClick={() => signOut()}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-muted-foreground hover:text-expense hover:bg-expense/10 mt-2"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Sair</span>
                </button>
              </div>
            </nav>
          </div>
        </>
      )}

      {/* Main content */}
      <main className="lg:pl-64 pt-16 lg:pt-0 min-h-screen flex flex-col">
        <div className="p-6 lg:p-8 animate-fade-in flex-1 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
