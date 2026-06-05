import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { BarChart3, RefreshCw, Search } from "lucide-react"
import { toast } from "sonner"

import { api } from "@/api/client"

import { Input } from "@/components/ui/input"
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

function getStatusVariant(status) {
  const value = (status || "").toLowerCase()

  if (value === "completed") return "default"
  if (value === "started") return "secondary"
  if (value === "expired") return "destructive"
  return "outline"
}

export default function Results() {
  const [assignments, setAssignments] = useState([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchAssignments = async (showLoader = true) => {
    try {
      if (showLoader) {
        setIsLoading(true)
      } else {
        setIsRefreshing(true)
      }

      const response = await api.get("/api/admin/assignments")
      setAssignments(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      const message =
        error?.response?.data?.detail || "Failed to load assignments for results"

      toast.error(
        typeof message === "string"
          ? message
          : "Failed to load assignments for results"
      )
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAssignments()
  }, [])

  const filteredAssignments = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return assignments

    return assignments.filter((assignment) => {
      const title = assignment?.title?.toLowerCase() || ""
      const description = assignment?.description?.toLowerCase() || ""
      return title.includes(query) || description.includes(query)
    })
  }, [assignments, search])

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Results</h1>
          <p className="text-sm text-muted-foreground">
            Select an assignment to review submissions, scores, and warnings.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => fetchAssignments(false)}
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
          <CardTitle>Search Assignments</CardTitle>
          <CardDescription>
            Find the assignment you want to review.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by assignment title or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="space-y-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-56" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </section>
      ) : filteredAssignments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-4 rounded-lg bg-[#F3F4F6] p-3 text-[#9CA3AF]">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold">No assignments available</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Results will appear here once assignments are created and submitted.
            </p>
            <Button asChild className="mt-5">
              <Link to="/admin/assignments/create">Create Assignment</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredAssignments.map((assignment) => (
            <Card
              key={assignment.id}
              className="transition-all hover:-translate-y-0.5"
            >
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="line-clamp-1 text-lg">
                    {assignment.title || "Untitled Assignment"}
                  </CardTitle>

                  <Badge variant={getStatusVariant(assignment.status)}>
                    {assignment.status || "Active"}
                  </Badge>
                </div>

                <CardDescription className="line-clamp-2">
                  {assignment.description || "No description provided"}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Assignment ID:</span>{" "}
                    {assignment.id}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Form ID:</span>{" "}
                    {assignment.form_id ?? assignment.formId ?? "-"}
                  </p>
                </div>

                <Button asChild className="w-full">
                  <Link to={`/admin/assignments/${assignment.id}/users`}>
                    Open Review Flow
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>
      )}
    </div>
  )
}