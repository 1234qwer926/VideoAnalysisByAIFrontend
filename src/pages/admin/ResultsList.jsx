import { useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Eye, RefreshCw, Search, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

import { api } from "@/api/client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

function getStatusVariant(status) {
  const normalized = (status || "").toLowerCase()

  if (["completed", "evaluated", "reviewed"].includes(normalized)) return "secondary"
  if (["pending", "invited"].includes(normalized)) return "outline"
  if (["active", "submitted", "in_progress"].includes(normalized)) return "default"
  return "outline"
}

export default function ResultsList() {
  const [searchParams] = useSearchParams()
  const assignmentId = searchParams.get("assignmentId")
  const userId = searchParams.get("userId")
  const userEmail = searchParams.get("userEmail")
  const isFiltered = !!(assignmentId || userId || userEmail)

  const [results, setResults] = useState([])
  const [assignments, setAssignments] = useState([])
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("all")
  const [hasLoaded, setHasLoaded] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fetch assignments on mount (lightweight call)
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await api.get("/api/admin/assignments")
        setAssignments(Array.isArray(response.data) ? response.data : [])
      } catch (error) {
        console.error("Failed to load assignments", error)
      }
    }
    fetchAssignments()
  }, [])

  const fetchResults = async (assignmentIdParam, showLoader = true) => {
    try {
      if (showLoader) {
        setIsLoading(true)
      } else {
        setIsRefreshing(true)
      }

      const url = assignmentIdParam && assignmentIdParam !== "all"
        ? `/api/admin/results?assignment_id=${assignmentIdParam}`
        : "/api/admin/results"

      const response = await api.get(url)
      setResults(Array.isArray(response.data) ? response.data : [])
      setHasLoaded(true)
    } catch (error) {
      const message = error?.response?.data?.detail || "Failed to load results"
      toast.error(typeof message === "string" ? message : "Failed to load results")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Load results on mount if assignmentId is in URL params
  useEffect(() => {
    if (assignmentId) {
      setSelectedAssignmentId(assignmentId)
      fetchResults(assignmentId, true)
    }
  }, [assignmentId])

  const filteredResults = useMemo(() => {
    const query = search.trim().toLowerCase()

    return results.filter((result) => {
      const status = (result.status || "").toLowerCase()
      const matchesStatus =
        statusFilter === "all" ? true : status === statusFilter.toLowerCase()

      // Check if result matches the URL filter parameters
      const matchesAssignmentId = assignmentId
        ? String(result.assignment_id) === assignmentId || String(result.id) === assignmentId
        : true

      const matchesUserId = userId
        ? String(result.user_id) === userId || String(result.assignment_user_id) === userId
        : true

      const matchesUserEmail = userEmail
        ? (result.email || result.candidate_email || "").toLowerCase() === userEmail.toLowerCase()
        : true

      const searchableText = [
        result.email,
        result.candidate_email,
        result.name,
        result.candidate_name,
        result.assignment_title,
        result.title,
        result.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      const matchesSearch = query ? searchableText.includes(query) : true

      return matchesStatus && matchesSearch && matchesAssignmentId && matchesUserId && matchesUserEmail
    })
  }, [results, search, statusFilter, assignmentId, userId, userEmail])

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-lg border border-[#E5E7EB] bg-white p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          {isFiltered && (
            <div className="mb-3">
              <Link to="/admin/assignments" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Assignments
              </Link>
            </div>
          )}
          <h1 className="text-2xl font-semibold tracking-tight">
            {isFiltered ? `Results for ${userEmail || "User"}` : "Results"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isFiltered
              ? "View submissions and scores for this candidate."
              : "Review candidate submissions, scores, and evaluation status."}
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => fetchResults(selectedAssignmentId, false)}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Submission Results</CardTitle>
          <CardDescription>
            Search and filter candidate results before opening detailed review.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Assignment</label>
              <Select value={selectedAssignmentId} onValueChange={setSelectedAssignmentId}>
                <SelectTrigger className="w-full sm:w-[280px]">
                  <SelectValue placeholder="Select assignment..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignments</SelectItem>
                  {assignments.map((assignment) => (
                    <SelectItem key={assignment.id} value={String(assignment.id)}>
                      {assignment.title || `Assignment #${assignment.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => fetchResults(selectedAssignmentId, false)}
              disabled={isRefreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Load Results
            </Button>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by candidate or assignment..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm lg:w-[220px]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="submitted">Submitted</option>
              <option value="completed">Completed</option>
              <option value="evaluated">Evaluated</option>
            </select>
          </div>

          {!hasLoaded && !isLoading && (
            <div className="text-center py-12 text-muted-foreground">
              Select an assignment and click "Load Results" to view submissions
            </div>
          )}

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : filteredResults.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-[#E5E7EB]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredResults.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell className="min-w-[220px]">
                        <div>
                          <p className="font-medium">
                            {result.candidate_name || result.name || "Unknown Candidate"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {result.candidate_email || result.email || "-"}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        {result.assignment_title || result.title || "-"}
                      </TableCell>

                      <TableCell>
                        <Badge variant={getStatusVariant(result.status)}>
                          {result.status || "pending"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {result.score ??
                          result.final_score ??
                          result.percentage ??
                          result.overall_score ??
                          "-"}
                      </TableCell>

                      <TableCell>
                        {result.submitted_at || result.completed_at || "-"}
                      </TableCell>

                      <TableCell>
                        <div className="flex justify-end">
                          <Button asChild variant="outline" size="sm">
                            <Link to={`/admin/results/${result.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Open
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : hasLoaded ? (
            <div className="rounded-lg border border-[#E5E7EB] border-dashed py-14 text-center">
              <p className="text-sm text-muted-foreground">
                No results matched the current filters.
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}