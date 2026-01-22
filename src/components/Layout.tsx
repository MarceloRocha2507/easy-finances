import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useAlertasCount } from "@/hooks/useAlertasCount";
import { useProfile } from "@/hooks/useProfile";
import { DemoBanner } from "@/components/DemoBanner";
import { MenuCollapsible } from "@/components/sidebar";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tags,
  BarChart3,
  CreditCard,
  PiggyBank,
  Target,
  LogOut,
  Menu,
  X,
  Shield,
  Bell,
} from "lucide-react";

const DEMO_EMAIL = "demo@fina.app";

interface LayoutProps {
  children: ReactNode;
}

import { TrendingUp, Receipt, Layers, Users, Gauge, PieChart, Download, Settings, Sliders, RefreshCw, Upload, History } from "lucide-react";

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
  ],
};

const cartoesMenu = {
  icon: CreditCard,
  label: "Cartões",
  href: "/cartoes",
  subItems: [
    { icon: CreditCard, label: "Visão Geral", href: "/cartoes" },
    { icon: Receipt, label: "Faturas", href: "/cartoes/faturas" },
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
    { icon: Target, label: "Metas", href: "/economia/metas" },
    { icon: TrendingUp, label: "Investimentos", href: "/economia/investimentos" },
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

const configMenu = {
  icon: Settings,
  label: "Configurações",
  subItems: [
    { icon: Sliders, label: "Preferências", href: "/profile/preferencias" },
    { icon: Shield, label: "Segurança", href: "/profile/seguranca" },
    { icon: Bell, label: "Notificações", href: "/configuracoes/notificacoes" },
  ],
};

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { importantes: alertasCount, hasDanger } = useAlertasCount();
  const { data: profile } = useProfile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [transacoesOpen, setTransacoesOpen] = useState(
    location.pathname.startsWith("/transactions")
  );
  const [cartoesOpen, setCartoesOpen] = useState(
    location.pathname.startsWith("/cartoes")
  );
  const [economiaOpen, setEconomiaOpen] = useState(
    location.pathname.startsWith("/economia")
  );
  const [relatoriosOpen, setRelatoriosOpen] = useState(
    location.pathname.startsWith("/reports")
  );
  const [configOpen, setConfigOpen] = useState(
    location.pathname.startsWith("/profile") || location.pathname.startsWith("/configuracoes")
  );

  const isDemoUser = user?.email === DEMO_EMAIL;

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    const fullName = user?.user_metadata?.full_name || user?.email || "";
    if (fullName.includes("@")) {
      return fullName.substring(0, 2).toUpperCase();
    }
    const names = fullName.split(" ");
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário";

  const isActive = (href: string) => {
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
  };


  return (
    <div className="min-h-screen bg-background relative">
      {/* Decorative gradient background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-20 w-60 h-60 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 glass z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-primary/10">
          <span className="text-sm font-semibold text-primary">Fina</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="hover:glass-hover"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-60 glass z-40 transition-transform duration-300",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-14 flex items-center px-4 border-b border-border/50">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-primary/10">
              <span className="text-base font-semibold text-primary">Fina</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {mainMenuItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200",
                  isActive(item.href)
                    ? "glass text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:glass-hover"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center w-7 h-7 rounded-lg transition-colors",
                  isActive(item.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground"
                )}>
                  <item.icon className="h-4 w-4" />
                </div>
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
              onItemClick={() => setSidebarOpen(false)}
            />

            <MenuCollapsible
              icon={cartoesMenu.icon}
              label={cartoesMenu.label}
              subItems={cartoesMenu.subItems}
              basePath="/cartoes"
              open={cartoesOpen}
              onOpenChange={setCartoesOpen}
              onItemClick={() => setSidebarOpen(false)}
            />

            <MenuCollapsible
              icon={economiaMenu.icon}
              label={economiaMenu.label}
              subItems={economiaMenu.subItems}
              basePath="/economia"
              open={economiaOpen}
              onOpenChange={setEconomiaOpen}
              onItemClick={() => setSidebarOpen(false)}
            />

            <MenuCollapsible
              icon={relatoriosMenu.icon}
              label={relatoriosMenu.label}
              subItems={relatoriosMenu.subItems}
              basePath="/reports"
              open={relatoriosOpen}
              onOpenChange={setRelatoriosOpen}
              onItemClick={() => setSidebarOpen(false)}
            />

            {/* Separador */}
            <div className="my-3 border-t border-border/50" />

            {/* Link Admin - apenas para admins */}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200",
                  isActive("/admin")
                    ? "glass text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:glass-hover"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center w-7 h-7 rounded-lg transition-colors",
                  isActive("/admin")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground"
                )}>
                  <Shield className="h-4 w-4" />
                </div>
                Admin
              </Link>
            )}
          </nav>

          {/* User section - Perfil + Configurações + Logout */}
          <div className="p-3 border-t border-border/50 space-y-1">
            {/* Link para Perfil com Avatar */}
            <Link
              to="/profile"
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                isActive("/profile")
                  ? "glass"
                  : "hover:glass-hover"
              )}
            >
              <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                <AvatarImage src={profile?.avatar_url || undefined} alt={userName} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-foreground truncate">{userName}</span>
                <span className="text-xs text-muted-foreground">Ver perfil</span>
              </div>
            </Link>

            {/* Link para Notificações com badge */}
            <Link
              to="/notificacoes"
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all duration-200",
                isActive("/notificacoes")
                  ? "glass text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:glass-hover"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex items-center justify-center w-7 h-7 rounded-lg transition-colors",
                  isActive("/notificacoes")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground"
                )}>
                  <Bell className="h-4 w-4" />
                </div>
                Notificações
              </div>
              {alertasCount > 0 && (
                <span 
                  className={cn(
                    "flex h-5 min-w-5 items-center justify-center rounded-full text-[10px] font-bold text-white px-1.5",
                    hasDanger ? "bg-expense animate-pulse" : "bg-warning"
                  )}
                >
                  {alertasCount > 9 ? "9+" : alertasCount}
                </span>
              )}
            </Link>

            {/* Menu Configurações com submenu */}
            <MenuCollapsible
              icon={configMenu.icon}
              label={configMenu.label}
              subItems={configMenu.subItems}
              basePath={["/profile", "/configuracoes"]}
              open={configOpen}
              onOpenChange={setConfigOpen}
              onItemClick={() => setSidebarOpen(false)}
            />

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-3 py-2.5 h-auto text-sm text-muted-foreground hover:text-foreground hover:glass-hover rounded-xl mt-1"
              onClick={() => signOut()}
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-lg text-muted-foreground">
                <LogOut className="h-4 w-4" />
              </div>
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-foreground/20 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:pl-60 pt-14 lg:pt-0 min-h-screen flex flex-col">
        {isDemoUser && <DemoBanner className="lg:ml-0" />}
        <div className="p-6 animate-fade-in flex-1">{children}</div>
      </main>
    </div>
  );
}
