import { ReactNode, useState, useEffect, useMemo, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  Settings,
  ChevronRight,
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
  const [dockExpanded, setDockExpanded] = useState(false);

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
    <TooltipProvider delayDuration={100}>
      <div className="min-h-screen bg-background mesh-gradient">
        {/* Desktop Dock Navigation */}
        <aside
          className={cn(
            "hidden lg:flex fixed left-4 top-1/2 -translate-y-1/2 z-50 flex-col gap-2 p-2 rounded-2xl glass-strong transition-all duration-300",
            dockExpanded ? "w-48" : "w-16"
          )}
          onMouseEnter={() => setDockExpanded(true)}
          onMouseLeave={() => setDockExpanded(false)}
        >
          {/* Logo */}
          <Link
            to="/dashboard"
            className="flex items-center gap-3 p-2 mb-2"
          >
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow flex-shrink-0">
              <span className="text-sm font-bold text-white">F</span>
            </div>
            <span className={cn(
              "font-semibold text-foreground transition-opacity duration-200 whitespace-nowrap",
              dockExpanded ? "opacity-100" : "opacity-0 w-0"
            )}>
              Fina
            </span>
          </Link>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group",
                      isActive(item.href)
                        ? "gradient-primary text-white shadow-glow"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    <item.icon className={cn(
                      "h-5 w-5 flex-shrink-0 transition-transform duration-200",
                      !isActive(item.href) && "group-hover:scale-110"
                    )} />
                    <span className={cn(
                      "text-sm font-medium transition-opacity duration-200 whitespace-nowrap",
                      dockExpanded ? "opacity-100" : "opacity-0 w-0"
                    )}>
                      {item.label}
                    </span>
                    {isActive(item.href) && dockExpanded && (
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    )}
                  </Link>
                </TooltipTrigger>
                {!dockExpanded && (
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            ))}

            {/* Admin Link */}
            {isAdmin && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to="/admin"
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group",
                      isActive("/admin")
                        ? "gradient-primary text-white shadow-glow"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    <Shield className="h-5 w-5 flex-shrink-0" />
                    <span className={cn(
                      "text-sm font-medium transition-opacity duration-200 whitespace-nowrap",
                      dockExpanded ? "opacity-100" : "opacity-0 w-0"
                    )}>
                      Admin
                    </span>
                  </Link>
                </TooltipTrigger>
                {!dockExpanded && (
                  <TooltipContent side="right">Admin</TooltipContent>
                )}
              </Tooltip>
            )}
          </nav>

          {/* Bottom Actions */}
          <div className="mt-auto pt-2 border-t border-border/50 flex flex-col gap-1">
            {/* Notifications */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/notificacoes"
                  className={cn(
                    "relative flex items-center gap-3 p-3 rounded-xl transition-all duration-300",
                    isActive("/notificacoes")
                      ? "gradient-primary text-white shadow-glow"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Bell className="h-5 w-5 flex-shrink-0" />
                  {alertasCount > 0 && (
                    <span
                      className={cn(
                        "absolute top-1 left-8 flex h-5 min-w-5 items-center justify-center rounded-full text-[10px] font-bold text-white px-1",
                        hasDanger ? "bg-expense animate-pulse" : "bg-warning"
                      )}
                    >
                      {alertasCount > 9 ? "9+" : alertasCount}
                    </span>
                  )}
                  <span className={cn(
                    "text-sm font-medium transition-opacity duration-200 whitespace-nowrap",
                    dockExpanded ? "opacity-100" : "opacity-0 w-0"
                  )}>
                    Alertas
                  </span>
                </Link>
              </TooltipTrigger>
              {!dockExpanded && (
                <TooltipContent side="right">
                  Alertas {alertasCount > 0 && `(${alertasCount})`}
                </TooltipContent>
              )}
            </Tooltip>

            {/* User Profile */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/profile"
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-xl transition-all duration-300",
                    isActive("/profile")
                      ? "bg-accent"
                      : "hover:bg-accent"
                  )}
                >
                  <Avatar className="h-9 w-9 border-2 border-primary/20 flex-shrink-0">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={userName} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "flex flex-col transition-opacity duration-200",
                    dockExpanded ? "opacity-100" : "opacity-0 w-0"
                  )}>
                    <span className="text-sm font-medium truncate max-w-[100px]">{userName}</span>
                    <span className="text-xs text-muted-foreground">Perfil</span>
                  </div>
                </Link>
              </TooltipTrigger>
              {!dockExpanded && (
                <TooltipContent side="right">{userName}</TooltipContent>
              )}
            </Tooltip>

            {/* Logout */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all duration-300 text-muted-foreground hover:text-expense hover:bg-expense/10 w-full"
                >
                  <LogOut className="h-5 w-5 flex-shrink-0" />
                  <span className={cn(
                    "text-sm font-medium transition-opacity duration-200 whitespace-nowrap",
                    dockExpanded ? "opacity-100" : "opacity-0 w-0"
                  )}>
                    Sair
                  </span>
                </button>
              </TooltipTrigger>
              {!dockExpanded && (
                <TooltipContent side="right">Sair</TooltipContent>
              )}
            </Tooltip>
          </div>
        </aside>

        {/* Mobile Header */}
        <header className="lg:hidden fixed top-0 left-0 right-0 h-16 glass-strong z-50 flex items-center justify-between px-4">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <span className="text-sm font-bold text-white">F</span>
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
                    hasDanger ? "bg-expense animate-pulse" : "bg-warning"
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
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="lg:hidden fixed top-16 left-0 right-0 bottom-0 z-40 overflow-hidden">
              <nav className="glass-strong h-full p-4 animate-slide-up overflow-y-auto">
                <div className="space-y-1">
                  {navItems.map((item, index) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      style={{ animationDelay: `${index * 50}ms` }}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 animate-fade-in",
                        isActive(item.href)
                          ? "gradient-primary text-white shadow-glow"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
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
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                        isActive("/admin")
                          ? "gradient-primary text-white shadow-glow"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      )}
                    >
                      <Shield className="h-5 w-5" />
                      <span className="font-medium">Admin</span>
                    </Link>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-border/50">
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
        <main className="lg:pl-24 pt-16 lg:pt-0 min-h-screen flex flex-col">
          <div className="p-6 lg:p-8 animate-fade-in flex-1 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
