import * as React from "react"

import { cn } from "@/lib/utils"

function Card({ className, size = "default", ...props }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card flex flex-col bg-card border border-border/50 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden text-sm text-card-foreground",
        className
      )}
      {...props} />
  );
}

function CardHeader({ className, ...props }) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col p-6 pb-4", className)}
      {...props} />
  );
}

function CardTitle({ className, ...props }) {
  return (
    <div
      data-slot="card-title"
      className={cn("text-base font-semibold text-card-foreground leading-none tracking-tight", className)}
      {...props} />
  );
}

function CardDescription({ className, ...props }) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props} />
  );
}

function CardContent({ className, ...props }) {
  return (
    <div
      data-slot="card-content"
      className={cn("p-6 pt-0", className)}
      {...props} />
  );
}

function CardFooter({ className, ...props }) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center border-t border-border/50 rounded-b-xl bg-muted/50 p-4 group-data-[size=sm]/card:p-3", className)}
      {...props} />
  );
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }