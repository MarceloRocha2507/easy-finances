import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  indicatorClassName?: string;
  variant?: "default" | "income" | "expense" | "warning";
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, indicatorClassName, variant = "default", ...props }, ref) => {
  const variantClasses = {
    default: "bg-primary",
    income: "bg-income",
    expense: "bg-expense",
    warning: "bg-warning",
  };

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-secondary", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full w-full flex-1 transition-all duration-300 ease-out",
          variantClasses[variant],
          indicatorClassName
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

// Circular Progress Component
interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  variant?: "default" | "income" | "expense";
  showValue?: boolean;
}

const CircularProgress = React.forwardRef<SVGSVGElement, CircularProgressProps>(
  ({ value, size = 48, strokeWidth = 4, className, variant = "default", showValue = false }, ref) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

    const colorClasses = {
      default: "stroke-primary",
      income: "stroke-income",
      expense: "stroke-expense",
    };

    return (
      <div className={cn("relative inline-flex items-center justify-center", className)}>
        <svg
          ref={ref}
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-muted"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn(
              "transition-all duration-300 ease-out",
              colorClasses[variant]
            )}
          />
        </svg>
        {showValue && (
          <span className="absolute text-xs font-semibold tabular-nums">
            {Math.round(value)}%
          </span>
        )}
      </div>
    );
  }
);
CircularProgress.displayName = "CircularProgress";

export { Progress, CircularProgress };
