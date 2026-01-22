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

function MenuBadge({ count, variant = 'default', pulse, dot }: BadgeConfig) {
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
}

export function MenuCollapsible({
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

  const isMenuActive = Array.isArray(basePath)
    ? basePath.some((path) => location.pathname.startsWith(path))
    : location.pathname.startsWith(basePath);

  const isItemActive = (href: string) => location.pathname === href;

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all duration-200",
            "hover:glass-hover",
            open || isMenuActive
              ? "glass text-foreground font-medium"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center justify-center w-7 h-7 rounded-lg transition-colors",
              open || isMenuActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground"
            )}>
              <Icon className="h-4 w-4" />
            </div>
            {label}
          </div>
          <div className="flex items-center gap-2">
            {badge && <MenuBadge {...badge} />}
            <ChevronDown 
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                open && "rotate-180"
              )} 
            />
          </div>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-1.5 ml-5 space-y-1">
        {subItems.map((subItem) => (
          <Link
            key={subItem.href}
            to={subItem.href}
            onClick={onItemClick}
            className={cn(
              "flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-200",
              isItemActive(subItem.href)
                ? "bg-primary/10 text-primary font-medium border border-primary/20 shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:glass-hover"
            )}
          >
            <div className="flex items-center gap-2.5">
              <subItem.icon className={cn(
                "h-3.5 w-3.5",
                isItemActive(subItem.href) && "text-primary"
              )} />
              {subItem.label}
            </div>
            {subItem.badge && <MenuBadge {...subItem.badge} />}
          </Link>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
