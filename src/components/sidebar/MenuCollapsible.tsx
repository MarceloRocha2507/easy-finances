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
            "group w-full flex items-center justify-between mx-1 px-3 py-2.5 text-sm rounded-lg transition-colors duration-150",
            isMenuActive
              ? "bg-[hsl(var(--accent-violet)/0.07)]"
              : "text-muted-foreground menu-item-hover"
          )}
          style={isMenuActive ? { color: 'hsl(var(--accent-violet))' } : undefined}
        >
          <div className="flex items-center gap-3">
            <Icon
              className={cn("h-[18px] w-[18px] shrink-0 transition-opacity duration-150", isMenuActive ? "opacity-100" : "opacity-40 group-hover:opacity-70")}
              style={isMenuActive ? { color: 'hsl(var(--accent-violet))' } : undefined}
            />
            {label}
          </div>
          <div className="flex items-center gap-2">
            {badge && <MenuBadge {...badge} />}
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-muted-foreground/50 transition-transform duration-150",
                open && "rotate-180"
              )}
              strokeWidth={1.5}
            />
          </div>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-0.5 ml-6 space-y-0.5 overflow-hidden">
        {subItems.map((subItem) => (
          <Link
            key={subItem.href}
            to={subItem.href}
            onClick={onItemClick}
            className={cn(
              "group flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors duration-150",
              isItemActive(subItem.href)
                ? "bg-[hsl(var(--accent-violet)/0.05)]"
                : "text-muted-foreground menu-item-hover"
            )}
            style={isItemActive(subItem.href)
              ? { color: 'hsl(var(--accent-violet))' }
              : undefined
            }
          >
            <div className="flex items-center gap-2.5">
              <subItem.icon
                className={cn("h-3.5 w-3.5 shrink-0 transition-opacity duration-150", isItemActive(subItem.href) ? "opacity-100" : "opacity-40 group-hover:opacity-70")}
                style={isItemActive(subItem.href) ? { color: 'hsl(var(--accent-violet))' } : undefined}
              />
              {subItem.label}
            </div>
            {subItem.badge && <MenuBadge {...subItem.badge} />}
          </Link>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
});
