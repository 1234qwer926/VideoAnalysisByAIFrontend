import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({
  className,
  ...props
}) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-[100px] resize-y w-full rounded-md border border-[#D1D5DB] bg-white px-3 py-[10px] text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-[#3B82F6] focus-visible:ring-[3px] focus-visible:ring-[rgba(59,130,246,0.1)] disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50",
        className
      )}
      {...props} />
  );
}

export { Textarea }
