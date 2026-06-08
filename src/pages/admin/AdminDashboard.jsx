import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  BarChart3,
  ClipboardList,
  FileText,
  Plus,
  RefreshCw,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import { api } from "@/api/client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { PageHeader } from "@/components/layout/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import { StatCard } from "@/components/ui/stat-card"

export default function AdminDashboard() {
  const [forms, setForms] = useState([])
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

      const [formsRes, assignmentsRes, resultsRes] = await Promise.all([
        api.get("/api/admin/forms").catch(() => ({ data: [] })),
        api.get("/api/admin/assignments").catch(() => ({ data: [] })),
        api.get("/api/admin/results").catch(() => ({ data: [] })),
      ])

      setForms(Array.isArray(formsRes.data) ? formsRes.data : [])
      setAssignments(Array.isArray(assignmentsRes.data) ? assignmentsRes.data : [])
      setResults(Array.isArray(resultsRes.data) ? resultsRes.data : [])
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

  const metrics = useMemo(() => {
    const completedResults = results.filter(
      (item) => (item.status || "").toLowerCase() === "completed"
    ).length

    const pendingAssignments = assignments.filter((item) =>
      ["pending", "active", "started"].includes((item.status || "").toLowerCase())
    ).length

    const averageScoreValues = results
      .map((item) =>
        Number(
          item.score ??
            item.final_score ??
            item.percentage ??
            item.overall_score
        )
      )
      .filter((value) => Number.isFinite(value))

    const averageScore =
      averageScoreValues.length > 0
        ? Math.round(
            averageScoreValues.reduce((sum, value) => sum + value, 0) /
              averageScoreValues.length
          )
        : 0

    return {
      totalForms: forms.length,
      totalAssignments: assignments.length,
      completedResults,
      pendingAssignments,
      averageScore,
    }
  }, [forms, assignments, results])

  const recentAssignments = useMemo(
    () => assignments.slice(0, 5),
    [assignments]
  )

  const recentResults = useMemo(() => results.slice(0, 5), [results])

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Dashboard"
        description="Monitor forms, assignments, and evaluation activity from one place."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => fetchDashboardData(false)}
              disabled={isRefreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/forms/create">
                <Plus className="mr-2 h-4 w-4" />
                New Form
              </Link>
            </Button>
            <Button asChild>
              <Link to="/admin/assignments/create">
                <Plus className="mr-2 h-4 w-4" />
                New Assignment
              </Link>
            </Button>
          </>
        }
      />

      {isLoading ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-32 w-full rounded-xl" />
          ))}
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title="Forms"
            value={metrics.totalForms}
            description="Available interview forms"
            icon={FileText}
          />
          <StatCard
            title="Assignments"
            value={metrics.totalAssignments}
            description="Total created assignments"
            icon={ClipboardList}
          />
          <StatCard
            title="Pending"
            value={metrics.pendingAssignments}
            description="Assignments still in progress"
            icon={Users}
          />
          <StatCard
            title="Completed Results"
            value={metrics.completedResults}
            description="Finished candidate submissions"
            icon={BarChart3}
          />
          <StatCard
            title="Average Score"
            value={`${metrics.averageScore}%`}
            description="Across evaluated submissions"
            icon={BarChart3}
          />
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Jump directly into common admin workflows.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Button asChild variant="outline" className="justify-start">
              <Link to="/admin/forms">Manage Forms</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/admin/forms/create">Create Form</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/admin/assignments">View Assignments</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/admin/assignments/create">Create Assignment</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start sm:col-span-2">
              <Link to="/admin/results">Review Results</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Assignments</CardTitle>
            <CardDescription>
              Recently created assignments and their current states.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {recentAssignments.length > 0 ? (
              recentAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between rounded-lg border border-[#E5E7EB] p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {assignment.title || `Assignment #${assignment.id}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {assignment.description || "No description available"}
                    </p>
                  </div>

                  <Badge variant="outline">
                    {assignment.status || "active"}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-[#E5E7EB] border-dashed py-10 text-center text-sm text-[#9CA3AF]">
                No assignments found.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Recent Results</CardTitle>
            <CardDescription>
              Latest candidate submissions available for review.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {recentResults.length > 0 ? (
              recentResults.map((result) => (
                <div
                  key={result.id}
                  className="flex flex-col gap-3 rounded-lg border border-[#E5E7EB] p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      {result.email || result.candidate_email || "Unknown Candidate"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {result.assignment_title || result.title || "Untitled Assignment"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      {result.status || "pending"}
                    </Badge>
                    <Badge variant="secondary">
                      {result.score ??
                        result.final_score ??
                        result.percentage ??
                        result.overall_score ??
                        "-"}
                    </Badge>
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/admin/results/${result.id}`}>Open</Link>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-[#E5E7EB] border-dashed py-10 text-center text-sm text-[#9CA3AF]">
                No results available yet.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}