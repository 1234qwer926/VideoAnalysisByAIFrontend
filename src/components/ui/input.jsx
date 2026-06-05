import * as React from "react"

import { cn } from "@/lib/utils"

function Input({
  className,
  type,
  ...props
}) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-[40px] w-full min-w-0 rounded-md border border-[#D1D5DB] bg-white px-3 py-[10px] text-sm transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-[#3B82F6] focus-visible:ring-[3px] focus-visible:ring-[rgba(59,130,246,0.1)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50",
        className
      )}
      {...props} />
  );
}

export { Input }
