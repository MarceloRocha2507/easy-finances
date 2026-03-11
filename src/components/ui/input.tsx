import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex w-full bg-white text-foreground placeholder:text-[#9CA3AF] disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          className,
        )}
        style={{
          height: 40,
          borderRadius: 8,
          border: "1px solid #E5E7EB",
          padding: "10px 12px",
          fontSize: 14,
          color: "#111827",
          outline: "none",
        }}
        onFocus={(e) => {
          e.currentTarget.style.border = "1.5px solid #111827";
          e.currentTarget.style.boxShadow = "none";
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.border = "1px solid #E5E7EB";
          props.onBlur?.(e);
        }}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
