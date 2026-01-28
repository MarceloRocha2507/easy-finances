import * as React from "react";
import { cn } from "@/lib/utils";

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  color?: string;
  variant?: "default" | "outline";
}

export function Chip({
  children,
  active = false,
  color,
  variant = "default",
  className,
  ...props
}: ChipProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full",
        "transition-all duration-200 ease-out",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        variant === "default" && [
          "border",
          active
            ? "bg-foreground text-background border-foreground"
            : "bg-background text-foreground border-border hover:border-foreground/30 hover:bg-muted/50",
        ],
        variant === "outline" && [
          "border-2",
          active
            ? "border-current bg-current/10"
            : "border-border hover:border-current/50",
        ],
        className
      )}
      style={color && active ? { 
        backgroundColor: `${color}20`, 
        borderColor: color,
        color: color 
      } : color ? {
        borderColor: `${color}40`,
      } : undefined}
      {...props}
    >
      {color && (
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
      )}
      {children}
    </button>
  );
}
