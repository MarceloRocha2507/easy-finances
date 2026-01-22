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

      <CollapsibleContent className="relative ml-[18px] mt-1 border-l border-border">
        {subItems.map((subItem, index) => {
          const isLast = index === subItems.length - 1;
          
          return (
            <div key={subItem.href} className="relative">
              {/* Linha horizontal conectora */}
              <div 
                className={cn(
                  "absolute left-0 top-1/2 w-3 h-px bg-border",
                  isLast && "rounded-bl"
                )} 
              />
              {/* Esconde a linha vertical após o último item */}
              {isLast && (
                <div className="absolute left-[-1px] top-1/2 bottom-0 w-px bg-background" />
              )}
              
              <Link
                to={subItem.href}
                onClick={onItemClick}
                className={cn(
                  "ml-3 flex items-center justify-between pl-2 pr-3 py-1.5 rounded-md text-sm transition-colors",
                  isItemActive(subItem.href)
                    ? "bg-secondary text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <div className="flex items-center gap-2">
                  <subItem.icon className="h-3.5 w-3.5" />
                  {subItem.label}
                </div>
                {subItem.badge && <MenuBadge {...subItem.badge} />}
              </Link>
            </div>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
}
