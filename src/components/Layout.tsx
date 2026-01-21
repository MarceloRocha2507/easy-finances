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
  ChevronDown,
  ChevronRight,
  Shield,
  Bell,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const DEMO_EMAIL = "demo@fina.app";

interface LayoutProps {
  children: ReactNode;
}

import { TrendingUp, Receipt, Layers, Users, Gauge, PieChart, Download, Settings, Sliders, RefreshCw, Upload } from "lucide-react";

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

  const isTransacoesActive = location.pathname.startsWith("/transactions");
  const isCartoesActive = location.pathname.startsWith("/cartoes");
  const isEconomiaActive = location.pathname.startsWith("/economia");
  const isRelatoriosActive = location.pathname.startsWith("/reports");
  const isConfigActive = location.pathname.startsWith("/profile") || location.pathname.startsWith("/configuracoes");

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b z-50 flex items-center justify-between px-4">
        <span className="text-base font-semibold text-foreground">Fina</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-60 bg-card border-r z-40 transition-transform duration-200",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-14 flex items-center px-5 border-b">
            <span className="text-base font-semibold text-foreground">Fina</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-0.5">
            {mainMenuItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-200 hover:translate-x-0.5",
                  isActive(item.href)
                    ? "bg-secondary text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}

            {/* Menu Transações com submenu */}
            <Collapsible open={transacoesOpen} onOpenChange={setTransacoesOpen}>
              <CollapsibleTrigger asChild>
                <button
                  className={cn(
                    "w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isTransacoesActive
                      ? "bg-secondary/50 text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <transacoesMenu.icon className="h-4 w-4" />
                    {transacoesMenu.label}
                  </div>
                  {transacoesOpen ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent className="pl-4 mt-0.5 space-y-0.5">
                {transacoesMenu.subItems.map((subItem) => (
                  <Link
                    key={subItem.href}
                    to={subItem.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                      isActive(subItem.href)
                        ? "bg-secondary text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    <subItem.icon className="h-3.5 w-3.5" />
                    {subItem.label}
                  </Link>
                ))}
              </CollapsibleContent>
            </Collapsible>

            {/* Menu Cartões com submenu */}
            <Collapsible open={cartoesOpen} onOpenChange={setCartoesOpen}>
              <CollapsibleTrigger asChild>
                <button
                  className={cn(
                    "w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isCartoesActive
                      ? "bg-secondary/50 text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <cartoesMenu.icon className="h-4 w-4" />
                    {cartoesMenu.label}
                  </div>
                  {cartoesOpen ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent className="pl-4 mt-0.5 space-y-0.5">
                {cartoesMenu.subItems.map((subItem) => (
                  <Link
                    key={subItem.href}
                    to={subItem.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                      isActive(subItem.href)
                        ? "bg-secondary text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    <subItem.icon className="h-3.5 w-3.5" />
                    {subItem.label}
                  </Link>
                ))}
              </CollapsibleContent>
            </Collapsible>

            {/* Menu Economia com submenu */}
            <Collapsible open={economiaOpen} onOpenChange={setEconomiaOpen}>
              <CollapsibleTrigger asChild>
                <button
                  className={cn(
                    "w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isEconomiaActive
                      ? "bg-secondary/50 text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <economiaMenu.icon className="h-4 w-4" />
                    {economiaMenu.label}
                  </div>
                  {economiaOpen ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent className="pl-4 mt-0.5 space-y-0.5">
                {economiaMenu.subItems.map((subItem) => (
                  <Link
                    key={subItem.href}
                    to={subItem.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                      isActive(subItem.href)
                        ? "bg-secondary text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    <subItem.icon className="h-3.5 w-3.5" />
                    {subItem.label}
                  </Link>
                ))}
              </CollapsibleContent>
            </Collapsible>

            {/* Menu Relatórios com submenu */}
            <Collapsible open={relatoriosOpen} onOpenChange={setRelatoriosOpen}>
              <CollapsibleTrigger asChild>
                <button
                  className={cn(
                    "w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isRelatoriosActive
                      ? "bg-secondary/50 text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <relatoriosMenu.icon className="h-4 w-4" />
                    {relatoriosMenu.label}
                  </div>
                  {relatoriosOpen ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent className="pl-4 mt-0.5 space-y-0.5">
                {relatoriosMenu.subItems.map((subItem) => (
                  <Link
                    key={subItem.href}
                    to={subItem.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                      isActive(subItem.href)
                        ? "bg-secondary text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    <subItem.icon className="h-3.5 w-3.5" />
                    {subItem.label}
                  </Link>
                ))}
              </CollapsibleContent>
            </Collapsible>

            {/* Separador */}
            <div className="my-3 border-t" />

            {/* Link Admin - apenas para admins */}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive("/admin")
                    ? "bg-secondary text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            )}
          </nav>

          {/* User section - Perfil + Configurações + Logout */}
          <div className="p-3 border-t space-y-1">
            {/* Link para Perfil com Avatar */}
            <Link
              to="/profile"
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 hover:translate-x-0.5",
                isActive("/profile")
                  ? "bg-secondary"
                  : "hover:bg-secondary/50"
              )}
            >
              <Avatar className="h-8 w-8">
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
                "flex items-center justify-between px-3 py-2 rounded-md text-sm transition-all duration-200 hover:translate-x-0.5",
                isActive("/notificacoes")
                  ? "bg-secondary text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4" />
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
            <Collapsible open={configOpen} onOpenChange={setConfigOpen}>
              <CollapsibleTrigger asChild>
                <button
                  className={cn(
                    "w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isConfigActive
                      ? "bg-secondary/50 text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <configMenu.icon className="h-4 w-4" />
                    {configMenu.label}
                  </div>
                  {configOpen ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent className="pl-4 mt-0.5 space-y-0.5">
                {configMenu.subItems.map((subItem) => (
                  <Link
                    key={subItem.href}
                    to={subItem.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                      isActive(subItem.href)
                        ? "bg-secondary text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    <subItem.icon className="h-3.5 w-3.5" />
                    {subItem.label}
                  </Link>
                ))}
              </CollapsibleContent>
            </Collapsible>

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-sm text-muted-foreground hover:text-foreground mt-1"
              onClick={() => signOut()}
            >
              <LogOut className="h-4 w-4" />
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
