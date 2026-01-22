import { Link, useLocation } from "react-router-dom";
import { LucideIcon } from "lucide-react";
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
            "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-all border-l-2",
            open
              ? "border-l-primary bg-secondary/50 text-foreground"
              : "border-l-muted-foreground/30 hover:border-l-muted-foreground/50",
            isMenuActive
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          )}
        >
          <div className="flex items-center gap-3">
            <Icon className="h-4 w-4" />
            {label}
          </div>
          {badge && <MenuBadge {...badge} />}
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="pl-4 mt-0.5 space-y-0.5">
        {subItems.map((subItem) => (
          <Link
            key={subItem.href}
            to={subItem.href}
            onClick={onItemClick}
            className={cn(
              "flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
              isItemActive(subItem.href)
                ? "bg-secondary text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            <div className="flex items-center gap-3">
              <subItem.icon className="h-3.5 w-3.5" />
              {subItem.label}
            </div>
            {subItem.badge && <MenuBadge {...subItem.badge} />}
          </Link>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
