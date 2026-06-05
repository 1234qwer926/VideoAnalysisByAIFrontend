import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowRight,
  ClipboardCheck,
  RefreshCw,
  Trophy,
} from "lucide-react"
import { toast } from "sonner"

import { api } from "@/api/client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

function getStatusVariant(status) {
  const normalized = (status || "").toLowerCase()

  if (["completed", "evaluated", "reviewed"].includes(normalized)) return "secondary"
  if (["active", "started", "assigned", "submitted"].includes(normalized)) return "default"
  return "outline"
}

export default function CandidateDashboard() {
  const [assignments, setAssignments] = useState([])
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchDashboardData = async (showLoader = true) => {
    try {
      if (showLoader) {
        setIsLoading(true)
      } else {
        setIsRefreshing(true)
      }

      const [assignmentsRes, resultsRes] = await Promise.all([
        api.get("/api/candidate/dashboard").catch(() => ({ data: [] })),
        api.get("/api/candidate/results").catch(() => ({ data: [] })),
      ])

      setAssignments(
        Array.isArray(assignmentsRes.data)
          ? assignmentsRes.data
          : assignmentsRes.data?.assignments || []
      )

      setResults(
        Array.isArray(resultsRes.data)
          ? resultsRes.data
          : resultsRes.data?.results || []
      )
    } catch (error) {
      const message =
        error?.response?.data?.detail || "Failed to load dashboard data"
      toast.error(
        typeof message === "string" ? message : "Failed to load dashboard data"
      )
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const stats = useMemo(() => {
    const totalAssignments = assignments.length
    const activeAssignments = assignments.filter((item) =>
      ["active", "assigned", "started"].includes((item.status || "").toLowerCase())
    ).length
    const completedAssignments = assignments.filter((item) =>
      ["completed", "submitted"].includes((item.status || "").toLowerCase())
    ).length
    const availableResults = results.length

    return {
      totalAssignments,
      activeAssignments,
      completedAssignments,
      availableResults,
    }
  }, [assignments, results])

  const overallProgress = useMemo(() => {
    if (!assignments.length) return 0
    return Math.round((stats.completedAssignments / assignments.length) * 100)
  }, [assignments.length, stats.completedAssignments])

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-lg border border-[#E5E7EB] bg-white p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Candidate Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View assigned assessments, continue active exams, and check your results.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => fetchDashboardData(false)}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Assignments", value: stats.totalAssignments },
          { label: "Active", value: stats.activeAssignments },
          { label: "Completed", value: stats.completedAssignments },
          { label: "Results", value: stats.availableResults },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Assessments</CardTitle>
              <CardDescription>
                Start or continue your currently assigned interview tasks.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-28 w-full rounded-lg" />
                ))
              ) : assignments.length > 0 ? (
                assignments.map((assignment) => {
                  const token =
                    assignment.exam_token ||
                    assignment.token ||
                    assignment.access_token

                  const isResultReady = [
                    "completed",
                    "evaluated",
                    "reviewed",
                  ].includes((assignment.status || "").toLowerCase())

                  const isCompleted = [
                    "completed",
                    "evaluated",
                    "reviewed",
                    "submitted",
                  ].includes((assignment.status || "").toLowerCase())

                  return (
                    <div
                      key={assignment.assignment_id || assignment.id}
                      className="rounded-lg border border-[#E5E7EB] p-4 transition-colors hover:border-[#D1D5DB]"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">
                              {assignment.assignment_title || assignment.title || `Assignment #${assignment.assignment_id || assignment.id}`}
                            </p>
                            <Badge variant={getStatusVariant(assignment.status)}>
                              {assignment.status || "assigned"}
                            </Badge>
                          </div>

                          <p className="text-sm text-muted-foreground">
                            {assignment.description || "No description available"}
                          </p>

                          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                            <span>
                              Start:{" "}
                              {assignment.start_time ||
                                assignment.start_date ||
                                "-"}
                            </span>
                            <span>
                              End:{" "}
                              {assignment.end_time ||
                                assignment.end_date ||
                                "-"}
                            </span>
                            <span>
                              Duration:{" "}
                              {assignment.duration_minutes
                                ? `${assignment.duration_minutes} mins`
                                : "-"}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {token && !isCompleted ? (
                            <Button asChild size="sm">
                              <Link to={`/candidate/exam/${token}`}>
                                <ClipboardCheck className="mr-2 h-4 w-4" />
                                Start Exam
                              </Link>
                            </Button>
                          ) : null}

                          {isResultReady && (assignment.submission_id || assignment.result_id) ? (
                            <Button asChild size="sm" variant="outline">
                              <Link to={`/candidate/result/${assignment.submission_id || assignment.result_id}`}>
                                <Trophy className="mr-2 h-4 w-4" />
                                View Result
                              </Link>
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="rounded-lg border border-[#E5E7EB] border-dashed py-14 text-center text-sm text-[#374151]">
                  No assignments are available right now.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Progress</CardTitle>
              <CardDescription>
                Track overall completion across all assignments.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Completion</span>
                <span className="font-medium">{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} />
              <p className="text-sm text-muted-foreground">
                {stats.completedAssignments} of {stats.totalAssignments} assignments completed.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Results</CardTitle>
              <CardDescription>
                Open the latest available evaluation updates.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              {results.length > 0 ? (
                results.slice(0, 5).map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between rounded-lg border border-[#E5E7EB] p-3 hover:border-[#D1D5DB] transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {result.assignment_title || result.title || "Result"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Score:{" "}
                        {result.score ??
                          result.final_score ??
                          result.percentage ??
                          result.overall_score ??
                          "-"}
                      </p>
                    </div>

                    <Button asChild size="sm" variant="ghost">
                      <Link to={`/candidate/result/${result.submission_id || result.id}`}>
                        Open
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-[#E5E7EB] border-dashed py-10 text-center text-sm text-[#374151]">
                  No results available yet.
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </section>
    </div>
  )
}
