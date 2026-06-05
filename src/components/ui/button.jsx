import * as React from "react"
import { cva } from "class-variance-authority";
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-md border border-transparent font-medium whitespace-nowrap transition-all outline-none select-none disabled:pointer-events-none disabled:bg-[#D1D5DB] disabled:text-gray-500 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-[#3B82F6] text-white hover:bg-[#2563EB] active:bg-[#1D4ED8] hover:scale-[0.98] active:scale-[0.95]",
        primary: "bg-[#3B82F6] text-white hover:bg-[#2563EB] active:bg-[#1D4ED8] hover:scale-[0.98] active:scale-[0.95]",
        secondary: "bg-[#F3F4F6] text-[#374151] border border-[#D1D5DB] hover:bg-[#E5E7EB] active:bg-[#D1D5DB]",
        destructive: "bg-[#EF4444] text-white hover:bg-[#DC2626]",
        outline: "border border-border bg-background hover:bg-muted hover:text-foreground",
        ghost: "bg-transparent text-[#3B82F6] border border-transparent hover:bg-[#3B82F6]/10 hover:border-[#3B82F6]",
        link: "text-[#3B82F6] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2.5 text-sm",
        md: "h-10 px-4 py-2.5 text-sm",
        sm: "h-8 px-3 py-2 text-xs",
        lg: "h-12 px-5 py-3 text-base",
        icon: "size-10",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props} />
  );
}

export { Button, buttonVariants }
