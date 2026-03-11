import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center border px-2.5 py-0.5 font-medium transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#F3F4F6] text-[#374151]",
        secondary: "border-transparent bg-[#F3F4F6] text-[#374151]",
        destructive: "border-transparent bg-[#FEE2E2] text-[#DC2626]",
        outline: "text-[#374151] border-[#E5E7EB]",
        warning: "border-transparent bg-[#FEF3C7] text-[#92400E]",
        success: "border-transparent bg-[#DCFCE7] text-[#16A34A]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      style={{ borderRadius: 6, fontSize: 11, fontWeight: 500 }}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
