import React, { memo, useCallback, useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { MenuCollapsible } from "./MenuCollapsible";
import { useRadarGastos } from "@/hooks/useRadarGastos";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tags,
  CreditCard,
  PiggyBank,
  Repeat,
  Shield,
  Users,
  Building2,
  CalendarDays,
  Sparkles,
  StickyNote,
  Wrench,
  BarChart3,
} from "lucide-react";

const mainMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: CalendarDays, label: "Calendário", href: "/calendario" },
  { icon: CreditCard, label: "Cartões", href: "/cartoes" },
  { icon: BarChart3, label: "Relatórios", href: "/relatorios" },
  { icon: Wrench, label: "Utilitários", href: "/utilitarios" },
  { icon: PiggyBank, label: "Metas", href: "/economia/metas" },
  { icon: StickyNote, label: "Anotações", href: "/anotacoes" },
];


const transacoesMenu = {
  icon: ArrowLeftRight,
  label: "Transações",
  subItems: [
    { icon: ArrowLeftRight, label: "Visão Geral", href: "/transactions" },
    { icon: Repeat, label: "Assinaturas", href: "/assinaturas" },
  ],
};





interface SidebarNavProps {
  isAdmin: boolean;
  onItemClick?: () => void;
}

export const SidebarNav = memo(function SidebarNav({ isAdmin, onItemClick }: SidebarNavProps) {
  const location = useLocation();
  const pathname = location.pathname;
  const { totalDetectados } = useRadarGastos();

  const transacoesMenuWithBadge = useMemo(() => ({
    ...transacoesMenu,
    subItems: transacoesMenu.subItems.map((item) =>
      item.href === "/assinaturas" && totalDetectados > 0
        ? { ...item, badge: { count: totalDetectados, variant: "warning" as const } }
        : item
    ),
  }), [totalDetectados]);

  type MenuKey = "transacoes" | "cartoes";
  const getActiveMenu = useCallback((path: string): MenuKey | null => {
    if (path.startsWith("/transactions") || path === "/assinaturas") return "transacoes";
    if (path.startsWith("/cartoes") && path !== "/cartoes/bancos" && path !== "/cartoes/responsaveis") return "cartoes";
    return null;
  }, []);

  const [openMenus, setOpenMenus] = useState(() => {
    const active = getActiveMenu(pathname);
    return {
      transacoes: active === "transacoes",
      cartoes: active === "cartoes",
    };
  });

  useEffect(() => {
    const active = getActiveMenu(pathname);
    if (active) {
      setOpenMenus(prev => {
        // Only update if it actually changes, to avoid unnecessary re-renders
        if (prev[active]) return prev;
        return {
          transacoes: active === "transacoes",
          cartoes: active === "cartoes",
        };
      });
    }
  }, [pathname, getActiveMenu]);

  const handleMenuChange = useCallback((menu: MenuKey) => (open: boolean) => {
    if (open) {
      setOpenMenus({
        transacoes: menu === "transacoes",
        cartoes: menu === "cartoes",
      });
    } else {
      setOpenMenus(prev => ({ ...prev, [menu]: false }));
    }
  }, []);

  const isActive = useCallback((href: string) => pathname === href, [pathname]);

  return (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {mainMenuItems.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          onClick={onItemClick}
          className={cn(
            "group flex items-center gap-3 mx-1 px-3 py-2.5 text-sm rounded-lg transition-colors duration-150",
            isActive(item.href)
              ? "text-[hsl(var(--accent-violet))] bg-[hsl(var(--accent-violet)/0.07)]"
              : "text-muted-foreground menu-item-hover"
          )}
          style={isActive(item.href) ? { color: 'hsl(var(--accent-violet))' } : undefined}
        >
          <item.icon
            className={cn(
              "h-[18px] w-[18px] shrink-0 transition-opacity duration-150",
              isActive(item.href) ? "opacity-100" : "opacity-40 group-hover:opacity-70"
            )}
            style={isActive(item.href) ? { color: 'hsl(var(--accent-violet))' } : undefined}
          />
          {item.label}
        </Link>
      ))}

      <MenuCollapsible
        icon={transacoesMenuWithBadge.icon}
        label={transacoesMenuWithBadge.label}
        subItems={transacoesMenuWithBadge.subItems}
        basePath={["/transactions", "/assinaturas"]}
        open={openMenus.transacoes}
        onOpenChange={handleMenuChange("transacoes")}
        onItemClick={onItemClick}
      />





      {isAdmin && (
        <>
          <div className="mx-3 my-2 border-t border-border/40" />
          <Link
            to="/admin"
            onClick={onItemClick}
            className={cn(
              "group flex items-center gap-3 mx-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150",
              isActive("/admin")
                ? "bg-destructive/10 text-destructive border border-destructive/20"
                : "text-destructive/70 hover:text-destructive"
            )}
          >
            <Shield className={cn("h-4 w-4 transition-opacity duration-150", isActive("/admin") ? "opacity-100" : "opacity-70 group-hover:opacity-100")} />
            Admin
          </Link>
        </>
      )}

      
    </nav>
  );
});
