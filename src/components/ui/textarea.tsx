import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full bg-white text-foreground placeholder:text-[#9CA3AF] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      style={{
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
});
Textarea.displayName = "Textarea";

export { Textarea };
