import * as React from "react"
import { cva } from "class-variance-authority";
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex shrink-0 items-center justify-center h-[24px] px-3 py-1 rounded-[12px] text-[12px] font-medium whitespace-nowrap transition-all",
  {
    variants: {
      variant: {
        default: "bg-[#3B82F6] text-white",
        secondary: "bg-[#F3F4F6] text-[#374151]",
        destructive: "bg-[#EF4444] text-white",
        error: "bg-[#FEE2E2] text-[#991B1B]",
        success: "bg-[#D1FAE5] text-[#065F46]",
        warning: "bg-[#FEF3C7] text-[#92400E]",
        outline: "border border-[#E5E7EB] text-[#374151]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props} />
  );
}

export { Badge, badgeVariants }
