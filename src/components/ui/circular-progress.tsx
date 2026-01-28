import * as React from "react";
import { cn } from "@/lib/utils";

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  trackClassName?: string;
  indicatorClassName?: string;
  showValue?: boolean;
}

export function CircularProgress({
  value,
  size = 48,
  strokeWidth = 4,
  className,
  trackClassName,
  indicatorClassName,
  showValue = false,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;
  const center = size / 2;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          className={cn("stroke-muted", trackClassName)}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Indicator */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          className={cn("stroke-primary transition-all duration-500 ease-out", indicatorClassName)}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      {showValue && (
        <span className="absolute text-xs font-medium">
          {Math.round(value)}%
        </span>
      )}
    </div>
  );
}
