import {
  AlertTriangle,
  Clock3,
  Info,
  ShieldAlert,
  Siren,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

function getSeverityMeta(event) {
  const value = (
    event?.severity ||
    event?.level ||
    event?.status ||
    event?.type ||
    ""
  ).toLowerCase()

  if (["high", "critical", "error", "danger", "blocked"].includes(value)) {
    return {
      badge: "destructive",
      dot: "bg-destructive",
      icon: Siren,
      label: value || "critical",
    }
  }

  if (["medium", "warning", "warn", "suspicious"].includes(value)) {
    return {
      badge: "secondary",
      dot: "bg-yellow-500",
      icon: AlertTriangle,
      label: value || "warning",
    }
  }

  if (["low", "info", "started", "notice"].includes(value)) {
    return {
      badge: "outline",
      dot: "bg-blue-500",
      icon: Info,
      label: value || "info",
    }
  }

  return {
    badge: "outline",
    dot: "bg-muted-foreground",
    icon: ShieldAlert,
    label: value || "event",
  }
}

function getEventTitle(item, index) {
  return (
    item?.title ||
    item?.event ||
    item?.type ||
    item?.label ||
    `Event ${index + 1}`
  )
}

function getEventTime(item) {
  return item?.timestamp || item?.time || item?.created_at || "Time unavailable"
}

function getEventMessage(item) {
  return item?.message || item?.description || item?.reason || item?.details || ""
}

export default function WarningsTimeline({
  items = [],
  title = "Warnings Timeline",
  description = "Chronological review of warnings and proctoring events.",
  emptyTitle = "No warnings recorded",
  emptyDescription = "This submission does not contain warning or proctoring events.",
}) {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent>
        {Array.isArray(items) && items.length > 0 ? (
          <ol className="relative space-y-6">
            {items.map((item, index) => {
              const severity = getSeverityMeta(item)
              const Icon = severity.icon
              const isLast = index === items.length - 1

              return (
                <li key={item?.id || index} className="relative pl-8">
                  {!isLast && (
                    <span className="absolute left-[11px] top-6 h-[calc(100%+12px)] w-px bg-border" />
                  )}

                  <span
                    className={`absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full border border-background ${severity.dot}`}
                  >
                    <Icon className="h-3.5 w-3.5 text-white" />
                  </span>

                  <div className="rounded-2xl border bg-card p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-medium">
                          {getEventTitle(item, index)}
                        </p>

                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock3 className="h-4 w-4" />
                          {getEventTime(item)}
                        </p>
                      </div>

                      <Badge variant={severity.badge} className="capitalize">
                        {severity.label}
                      </Badge>
                    </div>

                    {getEventMessage(item) ? (
                      <p className="mt-3 text-sm leading-6 text-foreground">
                        {getEventMessage(item)}
                      </p>
                    ) : null}

                    {(item?.value != null || item?.count != null) && (
                      <div className="mt-3 text-xs text-muted-foreground">
                        {item?.value != null ? `Value: ${item.value}` : null}
                        {item?.value != null && item?.count != null ? " • " : null}
                        {item?.count != null ? `Count: ${item.count}` : null}
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-14 text-center">
            <div className="mb-4 rounded-2xl bg-muted p-3 text-muted-foreground">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold">{emptyTitle}</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              {emptyDescription}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}