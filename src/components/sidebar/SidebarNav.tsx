import React, { memo, useCallback, useState, useEffect } from "react";
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
  Bot,
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

  // Estado local para controle de menus abertos
  const [openMenus, setOpenMenus] = useState(() => ({
    transacoes: pathname.startsWith("/transactions"),
    cartoes: pathname.startsWith("/cartoes"),
    economia: pathname.startsWith("/economia"),
    relatorios: pathname.startsWith("/reports"),
  }));

  // Sincronizar quando URL muda (abrir menu se entrar em subrota)
  useEffect(() => {
    setOpenMenus(prev => ({
      ...prev,
      transacoes: prev.transacoes || pathname.startsWith("/transactions"),
      cartoes: prev.cartoes || pathname.startsWith("/cartoes"),
      economia: prev.economia || pathname.startsWith("/economia"),
      relatorios: prev.relatorios || pathname.startsWith("/reports"),
    }));
  }, [pathname]);

  // Handler para toggle manual
  const handleMenuChange = useCallback((menu: keyof typeof openMenus) => (open: boolean) => {
    setOpenMenus(prev => ({ ...prev, [menu]: open }));
  }, []);

  const isActive = useCallback((href: string) => pathname === href, [pathname]);

  return (
    <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
      {mainMenuItems.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          onClick={onItemClick}
          className={cn(
            "group flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-150",
            isActive(item.href)
              ? "menu-item-floating-active text-foreground font-medium"
              : "text-muted-foreground menu-item-floating-hover"
          )}
        >
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-150",
            isActive(item.href)
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground group-hover:text-foreground"
          )}>
            <item.icon className="h-4 w-4" />
          </div>
          {item.label}
        </Link>
      ))}

      {/* Menus com submenu - estado local + sincronização URL */}
      <MenuCollapsible
        icon={transacoesMenu.icon}
        label={transacoesMenu.label}
        subItems={transacoesMenu.subItems}
        basePath="/transactions"
        open={openMenus.transacoes}
        onOpenChange={handleMenuChange("transacoes")}
        onItemClick={onItemClick}
      />

      <MenuCollapsible
        icon={cartoesMenu.icon}
        label={cartoesMenu.label}
        subItems={cartoesMenu.subItems}
        basePath="/cartoes"
        open={openMenus.cartoes}
        onOpenChange={handleMenuChange("cartoes")}
        onItemClick={onItemClick}
      />

      <MenuCollapsible
        icon={economiaMenu.icon}
        label={economiaMenu.label}
        subItems={economiaMenu.subItems}
        basePath="/economia"
        open={openMenus.economia}
        onOpenChange={handleMenuChange("economia")}
        onItemClick={onItemClick}
      />

      <MenuCollapsible
        icon={relatoriosMenu.icon}
        label={relatoriosMenu.label}
        subItems={relatoriosMenu.subItems}
        basePath="/reports"
        open={openMenus.relatorios}
        onOpenChange={handleMenuChange("relatorios")}
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
            "group flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-150",
            isActive("/admin")
              ? "menu-item-floating-active text-foreground font-medium"
              : "text-muted-foreground menu-item-floating-hover"
          )}
        >
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-150",
            isActive("/admin")
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground group-hover:text-foreground"
          )}>
            <Shield className="h-4 w-4" />
          </div>
          Admin
        </Link>
      )}

      {/* Fina IA */}
      <Link
        to="/assistente"
        onClick={onItemClick}
        className={cn(
          "group flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-150",
          isActive("/assistente")
            ? "menu-item-floating-active text-foreground font-medium"
            : "text-muted-foreground menu-item-floating-hover"
        )}
      >
        <div className={cn(
          "flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-150",
          isActive("/assistente")
            ? "bg-primary/15 text-primary"
            : "text-muted-foreground group-hover:text-foreground"
        )}>
          <Bot className="h-4 w-4" />
        </div>
        Fina IA
      </Link>
    </nav>
  );
});
