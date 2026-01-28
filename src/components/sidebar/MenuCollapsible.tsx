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
    danger: 'bg-expense text-expense-foreground',
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
  open,
  onOpenChange,
  onItemClick,
  badge,
}: MenuCollapsibleProps) {
  const location = useLocation();

  const isMenuActive = useMemo(() => {
    return Array.isArray(basePath)
      ? basePath.some((path) => location.pathname.startsWith(path))
      : location.pathname.startsWith(basePath);
  }, [basePath, location.pathname]);

  const isItemActive = useCallback(
    (href: string) => location.pathname === href,
    [location.pathname]
  );

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            "group w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
            open || isMenuActive
              ? "bg-accent text-foreground font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          )}
        >
          <div className="flex items-center gap-3">
            <Icon className={cn(
              "h-4 w-4 transition-transform duration-200 group-hover:scale-110",
              open || isMenuActive ? "text-foreground" : "text-muted-foreground"
            )} />
            {label}
          </div>
          <div className="flex items-center gap-2">
            {badge && <MenuBadge {...badge} />}
            <ChevronDown 
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-300 ease-out",
                open && "rotate-180"
              )} 
            />
          </div>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-1 ml-4 space-y-0.5 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden">
        {subItems.map((subItem, index) => (
          <Link
            key={subItem.href}
            to={subItem.href}
            onClick={onItemClick}
            style={{ animationDelay: `${index * 30}ms` }}
            className={cn(
              "group/item flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-200",
              "animate-fade-in opacity-0 [animation-fill-mode:forwards]",
              isItemActive(subItem.href)
                ? "bg-accent text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
          >
            <div className="flex items-center gap-2.5">
              <subItem.icon className={cn(
                "h-3.5 w-3.5 transition-transform duration-200 group-hover/item:scale-110",
                isItemActive(subItem.href) ? "text-foreground" : "text-muted-foreground"
              )} />
              {subItem.label}
            </div>
            {subItem.badge && <MenuBadge {...subItem.badge} />}
          </Link>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
});
