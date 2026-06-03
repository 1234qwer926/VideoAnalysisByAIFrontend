import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

function getBadgeVariant(status) {
  const value = (status || "").toLowerCase()

  if (value === "completed" || value === "passed" || value === "success") {
    return "default"
  }

  if (value === "started" || value === "in_review" || value === "warning") {
    return "secondary"
  }

  if (value === "failed" || value === "expired" || value === "error") {
    return "destructive"
  }

  return "outline"
}

export default function ScoreCard({
  title,
  value,
  description,
  icon: Icon,
  status,
  progress,
  footer,
  className = "",
  valueSuffix = "",
}) {
  const normalizedProgress =
    typeof progress === "number"
      ? Math.max(0, Math.min(progress, 100))
      : null

  return (
    <Card className={`rounded-2xl ${className}`}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-1">
          <CardDescription>{title}</CardDescription>
          <CardTitle className="text-2xl font-semibold tracking-tight">
            {value}
            {valueSuffix}
          </CardTitle>
        </div>

        <div className="flex items-center gap-2">
          {status ? (
            <Badge variant={getBadgeVariant(status)} className="capitalize">
              {status}
            </Badge>
          ) : null}

          {Icon ? (
            <div className="rounded-2xl bg-muted p-2.5 text-muted-foreground">
              <Icon className="h-4 w-4" />
            </div>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}

        {normalizedProgress !== null ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span className="font-medium text-foreground">
                {normalizedProgress}%
              </span>
            </div>
            <Progress value={normalizedProgress} />
          </div>
        ) : null}

        {footer ? (
          <div className="text-xs text-muted-foreground">{footer}</div>
        ) : null}
      </CardContent>
    </Card>
  )
}