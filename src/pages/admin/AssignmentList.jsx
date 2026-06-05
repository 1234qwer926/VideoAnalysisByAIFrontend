import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Edit, Eye, Loader2, Plus, RefreshCw, Search, Trash2, Users } from "lucide-react"
import { toast } from "sonner"

import { api } from "@/api/client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

function getStatusVariant(status) {
  const normalized = (status || "").toLowerCase()

  if (["completed", "closed"].includes(normalized)) return "secondary"
  if (["active", "started", "ongoing"].includes(normalized)) return "default"
  if (["pending", "draft"].includes(normalized)) return "outline"
  return "outline"
}

export default function AssignmentList() {
  const [assignments, setAssignments] = useState([])
  const [forms, setForms] = useState([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const fetchForms = async () => {
    try {
      const formsRes = await api.get("/api/admin/forms")
      setForms(Array.isArray(formsRes.data) ? formsRes.data : [])
    } catch (error) {
      console.error("Failed to fetch forms", error)
    }
  }

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
        error?.response?.data?.detail || "Failed to load assignments"
      toast.error(typeof message === "string" ? message : "Failed to load assignments")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchForms()
    fetchAssignments()
  }, [])

  const filteredAssignments = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return assignments

    return assignments.filter((assignment) => {
      const title = assignment.title || ""
      const description = assignment.description || ""
      const status = assignment.status || ""
      const formTitle =
        assignment.form_title ||
        assignment.form_name ||
        assignment.form?.title ||
        ""

      return [title, description, status, formTitle]
        .join(" ")
        .toLowerCase()
        .includes(query)
    })
  }, [assignments, search])

  const handleDeleteAssignment = async (assignmentId, assignmentTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${assignmentTitle}"? This action cannot be undone.`)) {
      return
    }

    try {
      setDeletingId(assignmentId)

      await api.delete(`/api/admin/assignments/${assignmentId}`)

      toast.success("Assignment deleted successfully")
      setAssignments((prev) => prev.filter((a) => a.id !== assignmentId))
    } catch (error) {
      const message =
        error?.response?.data?.detail || "Failed to delete assignment"
      toast.error(typeof message === "string" ? message : "Failed to delete assignment")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-lg border border-[#E5E7EB] bg-white p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Assignments</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage created assignments, review statuses, and access assigned users.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
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

          <Button asChild>
            <Link to="/admin/assignments/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Assignment
            </Link>
          </Button>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Assignment Directory</CardTitle>
          <CardDescription>
            Search and manage all interview assignments from one table.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search assignments..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : filteredAssignments.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-[#E5E7EB]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Form</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredAssignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="min-w-[220px]">
                        <div>
                          <p className="font-medium">
                            {assignment.title || `Assignment #${assignment.id}`}
                          </p>
                          <p className="line-clamp-1 text-sm text-muted-foreground">
                            {assignment.description || "No description"}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        {forms?.find((f) => f.id === assignment.form_id)?.title ||
                          assignment.form_title ||
                          assignment.form_name ||
                          assignment.form?.title ||
                          `Form #${assignment.form_id || "-"}`}
                      </TableCell>

                      <TableCell>
                        <Badge variant={getStatusVariant(assignment.status)}>
                          {assignment.status || "draft"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {assignment.start_time ||
                          assignment.start_date ||
                          assignment.created_at ||
                          "-"}
                      </TableCell>

                      <TableCell>
                        {assignment.end_time ||
                          assignment.end_date ||
                          "-"}
                      </TableCell>

                      <TableCell>
                        <div className="flex justify-end gap-2 flex-wrap">
                          <Button asChild variant="outline" size="sm">
                            <Link to={`/admin/assignments/${assignment.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </Button>

                          <Button asChild variant="outline" size="sm">
                            <Link to={`/admin/assignments/${assignment.id}/users`}>
                              <Users className="mr-2 h-4 w-4" />
                              Users
                            </Link>
                          </Button>

                          <Button asChild variant="outline" size="sm">
                            <Link to="/admin/results">
                              <Eye className="mr-2 h-4 w-4" />
                              Results
                            </Link>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAssignment(assignment.id, assignment.title || `Assignment #${assignment.id}`)}
                            disabled={deletingId === assignment.id}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            {deletingId === assignment.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              <>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="rounded-lg border border-[#E5E7EB] border-dashed py-14 text-center">
              <p className="text-sm text-muted-foreground">
                No assignments matched your search.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}