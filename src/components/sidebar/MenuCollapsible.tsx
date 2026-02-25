import React, { useMemo, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { LucideIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface BadgeConfig {
  count?: number;
  variant?: 'default' | 'warning' | 'danger';
  pulse?: boolean;
  dot?: boolean;
}

interface MenuItem {
  icon: LucideIcon;
  label: string;
  href: string;
  badge?: BadgeConfig;
}

interface MenuCollapsibleProps {
  icon: LucideIcon;
  label: string;
  subItems: MenuItem[];
  basePath: string | string[];
  excludePaths?: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemClick?: () => void;
  badge?: BadgeConfig;
}

const MenuBadge = React.memo(function MenuBadge({ count, variant = 'default', pulse, dot }: BadgeConfig) {
  if (!count && !dot) return null;
  
  const colorClasses = {
    default: 'bg-primary text-primary-foreground',
    warning: 'bg-warning text-warning-foreground',
    danger: 'bg-destructive text-destructive-foreground',
  };

  return (
    <span 
      className={cn(
        "flex items-center justify-center rounded-full font-bold",
        dot ? "h-2 w-2" : "h-5 min-w-5 text-[10px] px-1.5",
        colorClasses[variant],
        pulse && "animate-pulse"
      )}
    >
      {!dot && (count && count > 9 ? "9+" : count)}
    </span>
  );
});

export const MenuCollapsible = React.memo(function MenuCollapsible({
  icon: Icon,
  label,
  subItems,
  basePath,
  excludePaths,
  open,
  onOpenChange,
  onItemClick,
  badge,
}: MenuCollapsibleProps) {
  const location = useLocation();

  const isMenuActive = useMemo(() => {
    const excluded = excludePaths?.some((p) => location.pathname.startsWith(p));
    if (excluded) return false;
    return Array.isArray(basePath)
      ? basePath.some((path) => location.pathname.startsWith(path))
      : location.pathname.startsWith(basePath);
  }, [basePath, excludePaths, location.pathname]);

  const isItemActive = useCallback(
    (href: string) => location.pathname === href,
    [location.pathname]
  );

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 text-sm transition-colors duration-150",
            open || isMenuActive
              ? "menu-item-active"
              : "text-muted-foreground menu-item-hover"
          )}
        >
          <div className="flex items-center gap-3">
            <Icon className="h-4 w-4" />
            {label}
          </div>
          <div className="flex items-center gap-2">
            {badge && <MenuBadge {...badge} />}
            <ChevronDown 
              className={cn(
                "h-3.5 w-3.5 text-muted-foreground transition-transform duration-150",
                open && "rotate-180"
              )}
              strokeWidth={1.5}
            />
          </div>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-0.5 ml-7 space-y-0.5 overflow-hidden">
        {subItems.map((subItem) => (
          <Link
            key={subItem.href}
            to={subItem.href}
            onClick={onItemClick}
            className={cn(
              "flex items-center justify-between px-3 py-1.5 text-sm transition-colors duration-150",
              isItemActive(subItem.href)
                ? "submenu-item-active"
                : "text-muted-foreground menu-item-hover"
            )}
          >
            <div className="flex items-center gap-2.5">
              <subItem.icon className="h-3.5 w-3.5" />
              {subItem.label}
            </div>
            {subItem.badge && <MenuBadge {...subItem.badge} />}
          </Link>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
});
