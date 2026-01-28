import { ReactNode, useState, useEffect, useMemo, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useAlertasCount } from "@/hooks/useAlertasCount";
import { useProfile } from "@/hooks/useProfile";
import { MenuCollapsible } from "@/components/sidebar";
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
  Layers,
  Users,
  Gauge,
  PieChart,
  Download,
  RefreshCw,
  Upload,
  History,
  Building2,
  CalendarClock,
} from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

const mainMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Tags, label: "Categorias", href: "/categories" },
];

const transacoesMenu = {
  icon: ArrowLeftRight,
  label: "Transações",
  href: "/transactions",
  subItems: [
    { icon: ArrowLeftRight, label: "Visão Geral", href: "/transactions" },
    { icon: RefreshCw, label: "Recorrentes", href: "/transactions/recorrentes" },
    { icon: Upload, label: "Importar", href: "/transactions/importar" },
    { icon: CalendarClock, label: "Despesas Futuras", href: "/transactions/futuras" },
  ],
};

const cartoesMenu = {
  icon: CreditCard,
  label: "Cartões",
  href: "/cartoes",
  subItems: [
    { icon: CreditCard, label: "Visão Geral", href: "/cartoes" },
    { icon: Building2, label: "Bancos", href: "/cartoes/bancos" },
    { icon: Layers, label: "Parcelamentos", href: "/cartoes/parcelamentos" },
    { icon: Users, label: "Responsáveis", href: "/cartoes/responsaveis" },
    { icon: Gauge, label: "Limites", href: "/cartoes/limites" },
    { icon: History, label: "Auditoria", href: "/cartoes/auditoria" },
  ],
};

const economiaMenu = {
  icon: PiggyBank,
  label: "Economia",
  href: "/economia",
  subItems: [
    { icon: PiggyBank, label: "Visão Geral", href: "/economia" },
    { icon: PiggyBank, label: "Metas", href: "/economia/metas" },
  ],
};

const relatoriosMenu = {
  icon: BarChart3,
  label: "Relatórios",
  href: "/reports",
  subItems: [
    { icon: BarChart3, label: "Visão Geral", href: "/reports" },
    { icon: PieChart, label: "Por Categoria", href: "/reports/categorias" },
    { icon: Download, label: "Exportações", href: "/reports/exportar" },
  ],
};

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { importantes: alertasCount, hasDanger } = useAlertasCount();
  const { data: profile } = useProfile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [transacoesOpen, setTransacoesOpen] = useState(false);
  const [cartoesOpen, setCartoesOpen] = useState(false);
  const [economiaOpen, setEconomiaOpen] = useState(false);
  const [relatoriosOpen, setRelatoriosOpen] = useState(false);

  // Sincronizar estados de menu com a rota atual
  useEffect(() => {
    const path = location.pathname;
    setTransacoesOpen(path.startsWith("/transactions"));
    setCartoesOpen(path.startsWith("/cartoes"));
    setEconomiaOpen(path.startsWith("/economia"));
    setRelatoriosOpen(path.startsWith("/reports"));
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
    if (href === "/economia") {
      return location.pathname === "/economia";
    }
    if (href === "/cartoes") {
      return location.pathname === "/cartoes";
    }
    if (href === "/reports") {
      return location.pathname === "/reports";
    }
    if (href === "/transactions") {
      return location.pathname === "/transactions";
    }
    return location.pathname === href;
  }, [location.pathname]);

  // Memoizar handler de fechar sidebar
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-background border-b border-border z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-foreground flex items-center justify-center">
            <span className="text-sm font-bold text-background">F</span>
          </div>
          <span className="text-base font-semibold text-foreground">Fina</span>
        </div>
        <button
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-60 bg-sidebar border-r border-sidebar-border z-40 transition-transform duration-300",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-foreground flex items-center justify-center">
                <span className="text-sm font-bold text-background">F</span>
              </div>
              <span className="text-base font-semibold text-foreground">Fina</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {mainMenuItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={closeSidebar}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                  isActive(item.href)
                    ? "bg-accent text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                <item.icon className={cn(
                  "h-4 w-4",
                  isActive(item.href) ? "text-foreground" : "text-muted-foreground"
                )} />
                {item.label}
              </Link>
            ))}

            {/* Menus com submenu */}
            <MenuCollapsible
              icon={transacoesMenu.icon}
              label={transacoesMenu.label}
              subItems={transacoesMenu.subItems}
              basePath="/transactions"
              open={transacoesOpen}
              onOpenChange={setTransacoesOpen}
              onItemClick={closeSidebar}
            />

            <MenuCollapsible
              icon={cartoesMenu.icon}
              label={cartoesMenu.label}
              subItems={cartoesMenu.subItems}
              basePath="/cartoes"
              open={cartoesOpen}
              onOpenChange={setCartoesOpen}
              onItemClick={closeSidebar}
            />

            <MenuCollapsible
              icon={economiaMenu.icon}
              label={economiaMenu.label}
              subItems={economiaMenu.subItems}
              basePath="/economia"
              open={economiaOpen}
              onOpenChange={setEconomiaOpen}
              onItemClick={closeSidebar}
            />

            <MenuCollapsible
              icon={relatoriosMenu.icon}
              label={relatoriosMenu.label}
              subItems={relatoriosMenu.subItems}
              basePath="/reports"
              open={relatoriosOpen}
              onOpenChange={setRelatoriosOpen}
              onItemClick={closeSidebar}
            />

            {/* Separador */}
            <div className="my-3 border-t border-sidebar-border" />

            {/* Link Admin - apenas para admins */}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={closeSidebar}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                  isActive("/admin")
                    ? "bg-accent text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                <Shield className={cn(
                  "h-4 w-4",
                  isActive("/admin") ? "text-foreground" : "text-muted-foreground"
                )} />
                Admin
              </Link>
            )}
          </nav>

          {/* User section */}
          <div className="p-3 border-t border-sidebar-border">
            <div className="flex items-center justify-between px-2">
              {/* Avatar + Nome clicável para /profile */}
              <Link 
                to="/profile" 
                onClick={closeSidebar}
                className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
              >
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarImage src={profile?.avatar_url || undefined} alt={userName} />
                  <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground truncate max-w-[90px]">
                  {userName}
                </span>
              </Link>
              
              {/* Ícones de ação */}
              <div className="flex items-center gap-1">
                {/* Notificações */}
                <Link 
                  to="/notificacoes" 
                  onClick={closeSidebar}
                  className="relative p-2 rounded-lg hover:bg-accent transition-colors"
                >
                  <Bell className="h-4 w-4 text-muted-foreground" />
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
                
                {/* Sair */}
                <button 
                  onClick={() => signOut()}
                  className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-expense"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-foreground/20 backdrop-blur-sm z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:pl-60 pt-14 lg:pt-0 min-h-screen flex flex-col">
        <div className="p-6 animate-fade-in flex-1">{children}</div>
      </main>
    </div>
  );
}
