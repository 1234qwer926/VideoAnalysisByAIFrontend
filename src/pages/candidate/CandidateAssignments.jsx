import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ClipboardCheck, RefreshCw, Clock, Calendar } from "lucide-react"
import { toast } from "sonner"

import { api } from "@/api/client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/layout/page-header"

function getStatusVariant(status) {
  const normalized = (status || "").toLowerCase()
  if (["completed", "evaluated", "reviewed"].includes(normalized)) return "secondary"
  if (["active", "started", "assigned", "submitted"].includes(normalized)) return "default"
  return "outline"
}

function formatDate(dateString) {
  if (!dateString) return "-"
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return dateString
  }
}

export default function CandidateAssignments() {
  const [assignments, setAssignments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchAssignments = async (showLoader = true) => {
    try {
      if (showLoader) {
        setIsLoading(true)
      } else {
        setIsRefreshing(true)
      }

      const response = await api.get("/api/candidate/dashboard")
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.assignments || []
      
      setAssignments(data)
    } catch (error) {
      const message = error?.response?.data?.detail || "Failed to load assignments"
      toast.error(typeof message === "string" ? message : "Failed to load assignments")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAssignments()
  }, [])

  const stats = useMemo(() => {
    const total = assignments.length
    const active = assignments.filter((a) =>
      ["active", "assigned", "started"].includes((a.status || "").toLowerCase())
    ).length
    const completed = assignments.filter((a) =>
      ["completed", "submitted", "evaluated"].includes((a.status || "").toLowerCase())
    ).length

    return { total, active, completed }
  }, [assignments])

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader title="My Assignments" description="View all your assigned assessments." />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Assignments"
        description="View all your assigned assessments and track your progress."
        actions={
          <Button
            variant="outline"
            onClick={() => fetchAssignments(false)}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Assignments</p>
              <p className="text-3xl font-semibold tracking-tight">{stats.total}</p>
            </div>
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <ClipboardCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active</p>
              <p className="text-3xl font-semibold tracking-tight">{stats.active}</p>
            </div>
            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-500">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completed</p>
              <p className="text-3xl font-semibold tracking-tight">{stats.completed}</p>
            </div>
            <div className="rounded-xl bg-blue-500/10 p-3 text-blue-500">
              <Calendar className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignments List */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Assessments</CardTitle>
          <CardDescription>
            Start or continue your assigned interview tasks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {assignments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-12 text-center">
              <ClipboardCheck className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No assignments yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                You haven't been assigned any assessments yet.
              </p>
            </div>
          ) : (
            assignments.map((assignment) => {
              const token = assignment.exam_token || assignment.token
              const isCompleted = ["completed", "evaluated", "reviewed", "submitted"].includes(
                (assignment.status || "").toLowerCase()
              )
              const isActive = ["active", "assigned", "started"].includes(
                (assignment.status || "").toLowerCase()
              )

              return (
                <div
                  key={assignment.assignment_id || assignment.id}
                  className="rounded-xl border border-border p-4 transition-colors hover:border-primary/50"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">
                          {assignment.assignment_title || assignment.title || `Assignment #${assignment.assignment_id}`}
                        </h3>
                        <Badge variant={getStatusVariant(assignment.status)}>
                          {assignment.status || "assigned"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {assignment.description || assignment.form_description || "No description available"}
                      </p>
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Start: {formatDate(assignment.start_time || assignment.start_date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          End: {formatDate(assignment.end_time || assignment.end_date)}
                        </span>
                        {assignment.duration_minutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Duration: {assignment.duration_minutes} mins
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {token && !isCompleted ? (
                        <Button asChild size="sm">
                          <Link to={`/candidate/exam/${token}`}>
                            <ClipboardCheck className="mr-2 h-4 w-4" />
                            {assignment.status?.toLowerCase() === "started" ? "Continue" : "Start Exam"}
                          </Link>
                        </Button>
                      ) : null}

                      {isCompleted && (assignment.submission_id || assignment.result_id) ? (
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/candidate/result/${assignment.submission_id || assignment.result_id}`}>
                            View Result
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
