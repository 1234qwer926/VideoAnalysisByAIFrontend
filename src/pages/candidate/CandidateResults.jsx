import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Trophy, RefreshCw, Eye, ArrowLeft } from "lucide-react"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/layout/page-header"

function getStatusVariant(status) {
  const normalized = (status || "").toLowerCase()
  if (["completed", "evaluated", "reviewed"].includes(normalized)) return "secondary"
  if (["active", "started", "assigned"].includes(normalized)) return "default"
  return "outline"
}

export default function CandidateResults() {
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchResults = async (showLoader = true) => {
    try {
      if (showLoader) {
        setIsLoading(true)
      } else {
        setIsRefreshing(true)
      }

      const response = await api.get("/api/candidate/results")
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.results || []
      
      setResults(data)
    } catch (error) {
      const message = error?.response?.data?.detail || "Failed to load results"
      toast.error(typeof message === "string" ? message : "Failed to load results")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchResults()
  }, [])

  const stats = useMemo(() => {
    const total = results.length
    const evaluated = results.filter((r) =>
      ["evaluated", "reviewed"].includes((r.status || "").toLowerCase())
    ).length
    const averageScore = total > 0
      ? Math.round(
          results.reduce((sum, r) => {
            const score = Number(r.score ?? r.final_score ?? r.percentage ?? 0)
            return sum + (isNaN(score) ? 0 : score)
          }, 0) / total
        )
      : 0

    return { total, evaluated, averageScore }
  }, [results])

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader title="My Results" description="View your assessment results and feedback." />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Results"
        description="View your assessment results, scores, and feedback."
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/candidate/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => fetchResults(false)}
              disabled={isRefreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Results</p>
              <p className="text-3xl font-semibold tracking-tight">{stats.total}</p>
            </div>
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <Trophy className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Evaluated</p>
              <p className="text-3xl font-semibold tracking-tight">{stats.evaluated}</p>
            </div>
            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-500">
              <Eye className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Average Score</p>
              <p className="text-3xl font-semibold tracking-tight">
                {stats.averageScore}%
              </p>
            </div>
            <div className="rounded-xl bg-blue-500/10 p-3 text-blue-500">
              <Trophy className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Results</CardTitle>
          <CardDescription>
            Review your scores and feedback for completed assessments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-12 text-center">
              <Trophy className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No results yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Complete an assignment to see your results here.
              </p>
              <Button asChild className="mt-4">
                <Link to="/candidate/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell>
                        <div className="font-medium">
                          {result.assignment_title || result.title || "Untitled Assignment"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(result.status)}>
                          {result.status || "pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {result.score ?? result.final_score ?? result.percentage ?? "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {result.submitted_at
                          ? new Date(result.submitted_at).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/candidate/result/${result.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
