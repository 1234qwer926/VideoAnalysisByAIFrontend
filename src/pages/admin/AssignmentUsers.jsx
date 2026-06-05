import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import {
  ArrowLeft,
  Loader2,
  Mail,
  RefreshCw,
  Send,
  Trash2,
  UserPlus,
} from "lucide-react"
import { toast } from "sonner"

import { api } from "@/api/client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
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

  if (["completed", "submitted"].includes(normalized)) return "secondary"
  if (["invited", "pending"].includes(normalized)) return "outline"
  if (["active", "started", "in_progress"].includes(normalized)) return "default"
  return "outline"
}

export default function AssignmentUsers() {
  const { assignmentId } = useParams()

  const [assignment, setAssignment] = useState(null)
  const [users, setUsers] = useState([])
  const [email, setEmail] = useState("")

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [resendingId, setResendingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const fetchAssignmentUsers = async (showLoader = true) => {
    try {
      if (showLoader) {
        setIsLoading(true)
      } else {
        setIsRefreshing(true)
      }

      const [assignmentRes, usersRes] = await Promise.all([
        api.get(`/api/admin/assignments/${assignmentId}`).catch(() => ({ data: null })),
        api.get(`/api/admin/assignments/${assignmentId}/users`),
      ])

      setAssignment(assignmentRes.data || null)

      const incomingUsers = Array.isArray(usersRes.data)
        ? usersRes.data
        : usersRes.data?.users || []

      setUsers(incomingUsers)
    } catch (error) {
      const message =
        error?.response?.data?.detail || "Failed to load assignment users"
      toast.error(
        typeof message === "string" ? message : "Failed to load assignment users"
      )
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAssignmentUsers()
  }, [assignmentId])

  const stats = useMemo(() => {
    const total = users.length
    const invited = users.filter((user) =>
      ["invited", "pending"].includes((user.status || "").toLowerCase())
    ).length
    const active = users.filter((user) =>
      ["active", "started", "in_progress"].includes((user.status || "").toLowerCase())
    ).length
    const completed = users.filter((user) =>
      ["completed", "submitted"].includes((user.status || "").toLowerCase())
    ).length

    return { total, invited, active, completed }
  }, [users])

  const handleInviteUser = async (e) => {
    e.preventDefault()

    if (!email.trim()) {
      toast.error("Candidate email is required")
      return
    }

    try {
      setIsSubmitting(true)

      await api.post(`/api/admin/assignments/${assignmentId}/users`, {
        email: email.trim(),
      })

      toast.success("Candidate added to assignment")
      setEmail("")
      fetchAssignmentUsers(false)
    } catch (error) {
      const message =
        error?.response?.data?.detail || "Failed to add candidate"
      toast.error(typeof message === "string" ? message : "Failed to add candidate")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResend = async (userId) => {
    try {
      setResendingId(userId)

      await api.post(
        `/api/admin/assignments/${assignmentId}/users/${userId}/resend`
      )

      toast.success("Invitation resent successfully")
    } catch (error) {
      const message =
        error?.response?.data?.detail || "Failed to resend invitation"
      toast.error(
        typeof message === "string" ? message : "Failed to resend invitation"
      )
    } finally {
      setResendingId(null)
    }
  }

  const handleDeleteUser = async (userId, userEmail) => {
    if (!window.confirm(`Are you sure you want to delete ${userEmail} from this assignment?`)) {
      return
    }

    try {
      setDeletingId(userId)

      await api.delete(
        `/api/admin/assignments/${assignmentId}/users/${userId}`
      )

      toast.success("User deleted successfully")
      setUsers((prev) => prev.filter((u) => u.id !== userId))
    } catch (error) {
      const message =
        error?.response?.data?.detail || "Failed to delete user"
      toast.error(typeof message === "string" ? message : "Failed to delete user")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-[#E5E7EB] bg-white p-6">
        <div className="mb-3">
          <Button asChild variant="ghost" className="px-0">
            <Link to="/admin/assignments">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Assignments
            </Link>
          </Button>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Assignment Users
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage candidates assigned to this assessment and resend access when needed.
            </p>
            {assignment ? (
              <p className="mt-3 text-sm">
                <span className="font-medium">
                  {assignment.title || `Assignment #${assignmentId}`}
                </span>
              </p>
            ) : null}
          </div>

          <Button
            variant="outline"
            onClick={() => fetchAssignmentUsers(false)}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Users", value: stats.total },
          { label: "Invited", value: stats.invited },
          { label: "Active", value: stats.active },
          { label: "Completed", value: stats.completed },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Assigned Candidates</CardTitle>
            <CardDescription>
              Track invite status, progress, and result access for each candidate.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : users.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-[#E5E7EB]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Token</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="min-w-[220px]">
                          {user.email || user.candidate_email || "-"}
                        </TableCell>

                        <TableCell>
                          <Badge variant={getStatusVariant(user.status)}>
                            {user.status || "invited"}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          {user.score ??
                            user.final_score ??
                            user.percentage ??
                            "-"}
                        </TableCell>

                        <TableCell className="max-w-[180px] truncate">
                          {user.exam_token || user.token || "-"}
                        </TableCell>

                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResend(user.id)}
                              disabled={resendingId === user.id}
                            >
                              {resendingId === user.id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <Send className="mr-2 h-4 w-4" />
                                  Resend
                                </>
                              )}
                            </Button>

                            <Button asChild variant="outline" size="sm">
                              <Link to={`/admin/results?assignmentId=${assignmentId}&userId=${user.id}&userEmail=${encodeURIComponent(user.email || user.candidate_email)}`}>
                                <Mail className="mr-2 h-4 w-4" />
                                Results
                              </Link>
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id, user.email || user.candidate_email)}
                              disabled={deletingId === user.id}
                              className="text-destructive hover:bg-destructive/10"
                            >
                              {deletingId === user.id ? (
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
              <div className="rounded-lg border border-[#E5E7EB] border-dashed py-14 text-center text-sm text-[#9CA3AF]">
                No candidates have been assigned yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add Candidate</CardTitle>
            <CardDescription>
              Invite a candidate to this assignment by email.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleInviteUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="candidate-email">Candidate Email</Label>
                <Input
                  id="candidate-email"
                  type="email"
                  placeholder="candidate@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Candidate
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}