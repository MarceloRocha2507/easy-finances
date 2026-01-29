import React, { memo, useCallback, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { MenuCollapsible } from "./MenuCollapsible";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tags,
  BarChart3,
  CreditCard,
  PiggyBank,
  Shield,
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

const mainMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Tags, label: "Categorias", href: "/categories" },
];

const transacoesMenu = {
  icon: ArrowLeftRight,
  label: "Transações",
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
  subItems: [
    { icon: PiggyBank, label: "Visão Geral", href: "/economia" },
    { icon: PiggyBank, label: "Metas", href: "/economia/metas" },
  ],
};

const relatoriosMenu = {
  icon: BarChart3,
  label: "Relatórios",
  subItems: [
    { icon: BarChart3, label: "Visão Geral", href: "/reports" },
    { icon: PieChart, label: "Por Categoria", href: "/reports/categorias" },
    { icon: Download, label: "Exportações", href: "/reports/exportar" },
  ],
};

interface SidebarNavProps {
  isAdmin: boolean;
  onItemClick?: () => void;
}

export const SidebarNav = memo(function SidebarNav({ isAdmin, onItemClick }: SidebarNavProps) {
  const location = useLocation();
  const pathname = location.pathname;

  // Derivar estados diretamente do pathname (sem useState/useEffect)
  const menuStates = useMemo(() => ({
    transacoes: pathname.startsWith("/transactions"),
    cartoes: pathname.startsWith("/cartoes"),
    economia: pathname.startsWith("/economia"),
    relatorios: pathname.startsWith("/reports"),
  }), [pathname]);

  const isActive = useCallback((href: string) => {
    if (href === "/economia" || href === "/cartoes" || href === "/reports" || href === "/transactions") {
      return pathname === href;
    }
    return pathname === href;
  }, [pathname]);

  // Handlers que não fazem nada (apenas para manter interface consistente)
  const noopHandler = useCallback(() => {}, []);

  return (
    <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
      {mainMenuItems.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          onClick={onItemClick}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors",
            isActive(item.href)
              ? "bg-background/80 text-foreground font-medium border border-border/50"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <div className={cn(
            "flex items-center justify-center w-7 h-7 rounded-lg",
            isActive(item.href)
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground"
          )}>
            <item.icon className="h-4 w-4" />
          </div>
          {item.label}
        </Link>
      ))}

      {/* Menus com submenu - open derivado da URL */}
      <MenuCollapsible
        icon={transacoesMenu.icon}
        label={transacoesMenu.label}
        subItems={transacoesMenu.subItems}
        basePath="/transactions"
        open={menuStates.transacoes}
        onOpenChange={noopHandler}
        onItemClick={onItemClick}
      />

      <MenuCollapsible
        icon={cartoesMenu.icon}
        label={cartoesMenu.label}
        subItems={cartoesMenu.subItems}
        basePath="/cartoes"
        open={menuStates.cartoes}
        onOpenChange={noopHandler}
        onItemClick={onItemClick}
      />

      <MenuCollapsible
        icon={economiaMenu.icon}
        label={economiaMenu.label}
        subItems={economiaMenu.subItems}
        basePath="/economia"
        open={menuStates.economia}
        onOpenChange={noopHandler}
        onItemClick={onItemClick}
      />

      <MenuCollapsible
        icon={relatoriosMenu.icon}
        label={relatoriosMenu.label}
        subItems={relatoriosMenu.subItems}
        basePath="/reports"
        open={menuStates.relatorios}
        onOpenChange={noopHandler}
        onItemClick={onItemClick}
      />

      {/* Separador */}
      <div className="my-3 border-t border-border/50" />

      {/* Link Admin - apenas para admins */}
      {isAdmin && (
        <Link
          to="/admin"
          onClick={onItemClick}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors",
            isActive("/admin")
              ? "bg-background/80 text-foreground font-medium border border-border/50"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <div className={cn(
            "flex items-center justify-center w-7 h-7 rounded-lg",
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
  );
});
