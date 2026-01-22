import { Link, useLocation } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface MenuItem {
  icon: LucideIcon;
  label: string;
  href: string;
}

interface MenuCollapsibleProps {
  icon: LucideIcon;
  label: string;
  subItems: MenuItem[];
  basePath: string | string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemClick?: () => void;
}

export function MenuCollapsible({
  icon: Icon,
  label,
  subItems,
  basePath,
  open,
  onOpenChange,
  onItemClick,
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
            "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all border-l-2",
            open
              ? "border-l-primary bg-secondary/50 text-foreground"
              : "border-l-muted-foreground/30 hover:border-l-muted-foreground/50",
            isMenuActive
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="pl-4 mt-0.5 space-y-0.5">
        {subItems.map((subItem) => (
          <Link
            key={subItem.href}
            to={subItem.href}
            onClick={onItemClick}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
              isItemActive(subItem.href)
                ? "bg-secondary text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            <subItem.icon className="h-3.5 w-3.5" />
            {subItem.label}
          </Link>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
