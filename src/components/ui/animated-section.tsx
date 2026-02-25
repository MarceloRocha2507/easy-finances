import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedSection({ children, className, delay = 0 }: AnimatedSectionProps) {
  return (
    <div
      className={cn("animate-fade-in-up", className)}
      style={delay > 0 ? { animationDelay: `${delay}s`, opacity: 0 } : undefined}
    >
      {children}
    </div>
  );
}

interface AnimatedItemProps {
  children: ReactNode;
  index: number;
  className?: string;
}

export function AnimatedItem({ children, index, className }: AnimatedItemProps) {
  const cappedIndex = Math.min(index, 12);
  return (
    <div
      className={cn("stagger-item", className)}
      style={{ "--stagger-index": cappedIndex } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
