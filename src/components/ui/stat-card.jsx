import { TrendingDown, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

const StatCard = ({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
  className,
}) => {
  return (
    <Card className={cn("bg-white", className)}>
      <CardContent className="p-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {Icon && (
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
                  <Icon className="w-5 h-5" />
                </div>
              )}
              <span className="text-sm font-medium text-muted-foreground">
                {title}
              </span>
            </div>
            {trend && (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs font-medium",
                  trend === "up" && "text-emerald-500",
                  trend === "down" && "text-red-500"
                )}
              >
                {trend === "up" && <TrendingUp className="w-4 h-4" />}
                {trend === "down" && <TrendingDown className="w-4 h-4" />}
                <span>{trendValue}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-3xl font-semibold tracking-tight text-foreground">
              {value}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export { StatCard }