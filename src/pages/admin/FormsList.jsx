import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Edit, Plus, RefreshCw, Search, Trash2 } from "lucide-react"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

export default function FormsList() {
  const [forms, setForms] = useState([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const fetchForms = async (showLoader = true) => {
    try {
      if (showLoader) {
        setIsLoading(true)
      } else {
        setIsRefreshing(true)
      }

      const response = await api.get("/api/admin/forms")
      setForms(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      const message = error?.response?.data?.detail || "Failed to load forms"
      toast.error(typeof message === "string" ? message : "Failed to load forms")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchForms()
  }, [])

  const filteredForms = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return forms

    return forms.filter((form) => {
      const title = form.title || ""
      const description = form.description || ""
      const category = form.category || ""
      const status = form.status || ""

      return [title, description, category, status]
        .join(" ")
        .toLowerCase()
        .includes(query)
    })
  }, [forms, search])

  const handleDelete = async (formId) => {
    try {
      setDeletingId(formId)
      await api.delete(`/api/admin/forms/${formId}`)

      setForms((prev) => prev.filter((form) => form.id !== formId))
      toast.success("Form deleted successfully")
    } catch (error) {
      const message = error?.response?.data?.detail || "Failed to delete form"
      toast.error(typeof message === "string" ? message : "Failed to delete form")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Forms</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage interview forms, update questions, and remove unused drafts.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => fetchForms(false)}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          <Button asChild>
            <Link to="/admin/forms/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Form
            </Link>
          </Button>
        </div>
      </section>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Form Library</CardTitle>
          <CardDescription>
            Search through all created forms and open any form for editing.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search forms..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : filteredForms.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Questions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredForms.map((form) => (
                    <TableRow key={form.id}>
                      <TableCell className="min-w-[240px]">
                        <div>
                          <p className="font-medium">
                            {form.title || `Form #${form.id}`}
                          </p>
                          <p className="line-clamp-1 text-sm text-muted-foreground">
                            {form.description || "No description"}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>{form.category || "-"}</TableCell>

                      <TableCell>
                        {Array.isArray(form.questions)
                          ? form.questions.length
                          : form.question_count ?? 0}
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline">{form.status || "draft"}</Badge>
                      </TableCell>

                      <TableCell>
                        {form.updated_at || form.created_at || "-"}
                      </TableCell>

                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button asChild variant="outline" size="sm">
                            <Link to={`/admin/forms/${form.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>

                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete form?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. The selected form
                                  will be permanently removed.
                                </AlertDialogDescription>
                              </AlertDialogHeader>

                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(form.id)}
                                  disabled={deletingId === form.id}
                                >
                                  {deletingId === form.id ? "Deleting..." : "Delete"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed py-14 text-center">
              <p className="text-sm text-muted-foreground">
                No forms matched your search.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}