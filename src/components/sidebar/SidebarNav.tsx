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
  PieChart,
  Download,
  Upload,
  History,
  Building2,
  CalendarClock,
  Bot,
  Sparkles,
} from "lucide-react";

const mainMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Building2, label: "Bancos", href: "/cartoes/bancos" },
  { icon: Tags, label: "Categorias", href: "/categories" },
  { icon: PiggyBank, label: "Metas", href: "/economia/metas" },
];

const transacoesMenu = {
  icon: ArrowLeftRight,
  label: "Transações",
  subItems: [
    { icon: ArrowLeftRight, label: "Visão Geral", href: "/transactions" },
    { icon: Upload, label: "Importar", href: "/transactions/importar" },
    { icon: CalendarClock, label: "Despesas Futuras", href: "/transactions/futuras" },
  ],
};

const cartoesMenu = {
  icon: CreditCard,
  label: "Cartões",
  subItems: [
    { icon: CreditCard, label: "Visão Geral", href: "/cartoes" },
    { icon: Layers, label: "Parcelamentos", href: "/cartoes/parcelamentos" },
    { icon: Users, label: "Responsáveis", href: "/cartoes/responsaveis" },
  ],
};

const relatoriosMenu = {
  icon: BarChart3,
  label: "Relatórios",
  subItems: [
    { icon: BarChart3, label: "Visão Geral", href: "/reports" },
    { icon: PieChart, label: "Por Categoria", href: "/reports/categorias" },
    { icon: Download, label: "Exportações", href: "/reports/exportar" },
    { icon: History, label: "Auditoria", href: "/cartoes/auditoria" },
  ],
};

interface SidebarNavProps {
  isAdmin: boolean;
  onItemClick?: () => void;
}

export const SidebarNav = memo(function SidebarNav({ isAdmin, onItemClick }: SidebarNavProps) {
  const location = useLocation();
  const pathname = location.pathname;

  const [openMenus, setOpenMenus] = useState(() => ({
    transacoes: pathname.startsWith("/transactions"),
    cartoes: pathname.startsWith("/cartoes") && pathname !== "/cartoes/bancos" && pathname !== "/cartoes/auditoria",
    relatorios: pathname.startsWith("/reports") || pathname === "/cartoes/auditoria",
  }));

  useEffect(() => {
    setOpenMenus(prev => ({
      ...prev,
      transacoes: prev.transacoes || pathname.startsWith("/transactions"),
      cartoes: prev.cartoes || (pathname.startsWith("/cartoes") && pathname !== "/cartoes/bancos" && pathname !== "/cartoes/auditoria"),
      relatorios: prev.relatorios || pathname.startsWith("/reports") || pathname === "/cartoes/auditoria",
    }));
  }, [pathname]);

  const handleMenuChange = useCallback((menu: keyof typeof openMenus) => (open: boolean) => {
    setOpenMenus(prev => ({ ...prev, [menu]: open }));
  }, []);

  const isActive = useCallback((href: string) => pathname === href, [pathname]);

  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
      {mainMenuItems.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          onClick={onItemClick}
          className={cn(
            "flex items-center gap-3 px-3 py-2 text-sm transition-colors duration-150",
            isActive(item.href)
              ? "menu-item-active"
              : "text-muted-foreground menu-item-hover"
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}

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
        icon={relatoriosMenu.icon}
        label={relatoriosMenu.label}
        subItems={relatoriosMenu.subItems}
        basePath="/reports"
        open={openMenus.relatorios}
        onOpenChange={handleMenuChange("relatorios")}
        onItemClick={onItemClick}
      />

      <div className="my-3 border-t border-border/50" />

      <Link
        to="/changelog"
        onClick={onItemClick}
        className={cn(
          "flex items-center gap-3 px-3 py-2 text-sm transition-colors duration-150",
          isActive("/changelog")
            ? "menu-item-active"
            : "text-muted-foreground menu-item-hover"
        )}
      >
        <Sparkles className="h-4 w-4" />
        Novidades
      </Link>

      {isAdmin && (
        <Link
          to="/admin"
          onClick={onItemClick}
          className={cn(
            "flex items-center gap-3 px-3 py-2 text-sm transition-colors duration-150 mt-1",
            isActive("/admin")
              ? "menu-item-active"
              : "text-muted-foreground menu-item-hover"
          )}
        >
          <Shield className="h-4 w-4" />
          Admin
        </Link>
      )}

      <Link
        to="/assistente"
        onClick={onItemClick}
        className={cn(
          "flex items-center gap-3 px-3 py-2 text-sm transition-colors duration-150 mt-1",
          isActive("/assistente")
            ? "menu-item-active"
            : "text-muted-foreground menu-item-hover"
        )}
      >
        <Bot className="h-4 w-4" />
        Fina IA
      </Link>
    </nav>
  );
});
