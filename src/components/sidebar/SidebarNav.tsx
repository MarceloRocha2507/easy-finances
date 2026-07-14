import React, { memo, useCallback, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ArrowLeftRight,
  CreditCard,
  PiggyBank,
  Shield,
  CalendarDays,
  StickyNote,
  Wrench,
  BarChart3,
} from "lucide-react";

const mainMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: ArrowLeftRight, label: "Transações", href: "/transactions" },
  { icon: CalendarDays, label: "Calendário", href: "/calendario" },
  { icon: CreditCard, label: "Cartões", href: "/cartoes" },
  { icon: BarChart3, label: "Relatórios", href: "/relatorios" },
  { icon: Wrench, label: "Utilitários", href: "/utilitarios" },
  { icon: PiggyBank, label: "Metas", href: "/economia/metas" },
  { icon: StickyNote, label: "Anotações", href: "/anotacoes" },
];

interface SidebarNavProps {
  isAdmin: boolean;
  onItemClick?: () => void;
}

export const SidebarNav = memo(function SidebarNav({ isAdmin, onItemClick }: SidebarNavProps) {
  const location = useLocation();
  const pathname = location.pathname;

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
