import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  CalendarDays,
  Clock,
  Edit,
  Eye,
  FileText,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from "lucide-react"
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

/* ── Helpers ── */

function getStatusVariant(status) {
  const s = (status || "").toLowerCase()
  if (["completed", "closed"].includes(s)) return "secondary"
  if (["active", "started", "ongoing"].includes(s)) return "default"
  if (["pending", "draft"].includes(s)) return "outline"
  return "outline"
}

function getStatusColor(status) {
  const s = (status || "").toLowerCase()
  if (["completed", "closed"].includes(s))
    return { bg: "#f0fdf4", text: "#15803d", dot: "#22c55e" }
  if (["active", "started", "ongoing"].includes(s))
    return { bg: "#eff6ff", text: "#1d4ed8", dot: "#3b82f6" }
  if (["expired"].includes(s))
    return { bg: "#fef2f2", text: "#b91c1c", dot: "#ef4444" }
  return { bg: "#f9fafb", text: "#6b7280", dot: "#9ca3af" }
}

function formatDate(raw) {
  if (!raw) return null
  try {
    const d = new Date(raw)
    if (isNaN(d.getTime())) return raw
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  } catch {
    return raw
  }
}

function formatTime(raw) {
  if (!raw) return null
  try {
    const d = new Date(raw)
    if (isNaN(d.getTime())) return null
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  } catch {
    return null
  }
}

/* ── Component ── */

export default function AssignmentList() {
  const [assignments, setAssignments] = useState([])
  const [forms, setForms] = useState([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [openMenuId, setOpenMenuId] = useState(null)

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

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!openMenuId) return
    const handler = () => setOpenMenuId(null)
    document.addEventListener("click", handler)
    return () => document.removeEventListener("click", handler)
  }, [openMenuId])

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

  const getFormTitle = (assignment) =>
    forms?.find((f) => f.id === assignment.form_id)?.title ||
    assignment.form_title ||
    assignment.form_name ||
    assignment.form?.title ||
    null

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <section
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "16px",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "24px 28px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#111827",
              margin: 0,
              letterSpacing: "-0.3px",
            }}
          >
            Assignments
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "#6b7280",
              margin: "4px 0 0",
            }}
          >
            Manage interview assignments, view statuses, and access assigned candidates.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
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

      {/* Table Card */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        {/* Card Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #f3f4f6",
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "#111827",
                margin: 0,
              }}
            >
              All Assignments
              <span
                style={{
                  marginLeft: "10px",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "#9ca3af",
                  background: "#f3f4f6",
                  padding: "2px 10px",
                  borderRadius: "999px",
                }}
              >
                {filteredAssignments.length}
              </span>
            </h2>
          </div>

          <div style={{ position: "relative", minWidth: "240px", maxWidth: "320px", flex: 1 }}>
            <Search
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "16px",
                height: "16px",
                color: "#9ca3af",
                pointerEvents: "none",
              }}
            />
            <Input
              placeholder="Search by title, form, or status..."
              style={{ paddingLeft: "36px" }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table Body */}
        <div style={{ padding: "0" }}>
          {isLoading ? (
            <div style={{ padding: "24px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            </div>
          ) : filteredAssignments.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "14px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                      background: "#f9fafb",
                    }}
                  >
                    <th style={thStyle}>#</th>
                    <th style={{ ...thStyle, textAlign: "left", minWidth: "220px" }}>
                      Assignment
                    </th>
                    <th style={{ ...thStyle, textAlign: "left" }}>Form</th>
                    <th style={{ ...thStyle, textAlign: "center" }}>Status</th>
                    <th style={{ ...thStyle, textAlign: "left" }}>Schedule</th>
                    <th style={{ ...thStyle, textAlign: "right", minWidth: "80px" }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssignments.map((assignment, idx) => {
                    const formTitle = getFormTitle(assignment)
                    const statusColor = getStatusColor(assignment.status)
                    const startRaw =
                      assignment.start_time || assignment.start_date || assignment.created_at
                    const endRaw = assignment.end_time || assignment.end_date
                    const startDate = formatDate(startRaw)
                    const startTime = formatTime(startRaw)
                    const endDate = formatDate(endRaw)

                    return (
                      <tr
                        key={assignment.id}
                        style={{
                          borderBottom: "1px solid #f3f4f6",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#f9fafb")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        {/* Index */}
                        <td style={{ ...tdStyle, color: "#9ca3af", fontWeight: 500, textAlign: "center", width: "48px" }}>
                          {idx + 1}
                        </td>

                        {/* Title + Description */}
                        <td style={tdStyle}>
                          <div>
                            <div
                              style={{
                                fontWeight: 600,
                                color: "#111827",
                                lineHeight: 1.3,
                              }}
                            >
                              {assignment.title || `Assignment #${assignment.id}`}
                            </div>
                            <div
                              style={{
                                fontSize: "12.5px",
                                color: "#9ca3af",
                                marginTop: "2px",
                                lineHeight: 1.4,
                                maxWidth: "280px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {assignment.description || "No description provided"}
                            </div>
                          </div>
                        </td>

                        {/* Form */}
                        <td style={tdStyle}>
                          {formTitle ? (
                            <div
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "13px",
                                color: "#374151",
                                background: "#f3f4f6",
                                padding: "4px 10px",
                                borderRadius: "6px",
                              }}
                            >
                              <FileText size={13} style={{ color: "#6b7280" }} />
                              {formTitle}
                            </div>
                          ) : (
                            <span style={{ color: "#d1d5db", fontSize: "13px" }}>—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td style={{ ...tdStyle, textAlign: "center" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              fontSize: "12px",
                              fontWeight: 600,
                              textTransform: "capitalize",
                              padding: "4px 12px",
                              borderRadius: "999px",
                              background: statusColor.bg,
                              color: statusColor.text,
                            }}
                          >
                            <span
                              style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                background: statusColor.dot,
                              }}
                            />
                            {assignment.status || "draft"}
                          </span>
                        </td>

                        {/* Schedule */}
                        <td style={tdStyle}>
                          {startDate || endDate ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                              {startDate && (
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "5px",
                                    fontSize: "12.5px",
                                    color: "#374151",
                                  }}
                                >
                                  <CalendarDays size={13} style={{ color: "#9ca3af" }} />
                                  {startDate}
                                  {startTime && (
                                    <span style={{ color: "#9ca3af", fontSize: "11.5px" }}>
                                      {startTime}
                                    </span>
                                  )}
                                </div>
                              )}
                              {endDate && (
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "5px",
                                    fontSize: "12px",
                                    color: "#9ca3af",
                                  }}
                                >
                                  <Clock size={12} style={{ color: "#d1d5db" }} />
                                  ends {endDate}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: "#d1d5db", fontSize: "13px" }}>—</span>
                          )}
                        </td>

                        {/* Actions Dropdown */}
                        <td style={{ ...tdStyle, textAlign: "right" }}>
                          <div style={{ position: "relative", display: "inline-block" }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setOpenMenuId(
                                  openMenuId === assignment.id ? null : assignment.id
                                )
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "32px",
                                height: "32px",
                                borderRadius: "8px",
                                border: "1px solid #e5e7eb",
                                background: openMenuId === assignment.id ? "#f3f4f6" : "#fff",
                                cursor: "pointer",
                                transition: "all 0.15s",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background = "#f3f4f6")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background =
                                  openMenuId === assignment.id ? "#f3f4f6" : "#fff")
                              }
                            >
                              <MoreHorizontal size={16} style={{ color: "#6b7280" }} />
                            </button>

                            {openMenuId === assignment.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  position: "absolute",
                                  right: 0,
                                  top: "100%",
                                  marginTop: "6px",
                                  width: "180px",
                                  background: "#fff",
                                  border: "1px solid #e5e7eb",
                                  borderRadius: "10px",
                                  boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                                  zIndex: 50,
                                  overflow: "hidden",
                                  animation: "fadeIn 0.12s ease-out",
                                }}
                              >
                                <Link
                                  to={`/admin/assignments/${assignment.id}/edit`}
                                  style={menuItemStyle}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.background = "#f9fafb")
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.background = "transparent")
                                  }
                                >
                                  <Edit size={14} style={{ color: "#6b7280" }} />
                                  Edit Assignment
                                </Link>

                                <Link
                                  to={`/admin/assignments/${assignment.id}/users`}
                                  style={menuItemStyle}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.background = "#f9fafb")
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.background = "transparent")
                                  }
                                >
                                  <Users size={14} style={{ color: "#6b7280" }} />
                                  Manage Users
                                </Link>

                                <Link
                                  to="/admin/results"
                                  style={menuItemStyle}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.background = "#f9fafb")
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.background = "transparent")
                                  }
                                >
                                  <Eye size={14} style={{ color: "#6b7280" }} />
                                  View Results
                                </Link>

                                <div
                                  style={{
                                    height: "1px",
                                    background: "#f3f4f6",
                                    margin: "4px 0",
                                  }}
                                />

                                <button
                                  onClick={() => {
                                    setOpenMenuId(null)
                                    handleDeleteAssignment(
                                      assignment.id,
                                      assignment.title || `Assignment #${assignment.id}`
                                    )
                                  }}
                                  disabled={deletingId === assignment.id}
                                  style={{
                                    ...menuItemStyle,
                                    width: "100%",
                                    border: "none",
                                    color: "#dc2626",
                                    cursor:
                                      deletingId === assignment.id
                                        ? "not-allowed"
                                        : "pointer",
                                    opacity: deletingId === assignment.id ? 0.5 : 1,
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.background = "#fef2f2")
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.background = "transparent")
                                  }
                                >
                                  {deletingId === assignment.id ? (
                                    <>
                                      <Loader2
                                        size={14}
                                        className="animate-spin"
                                        style={{ color: "#dc2626" }}
                                      />
                                      Deleting...
                                    </>
                                  ) : (
                                    <>
                                      <Trash2 size={14} style={{ color: "#dc2626" }} />
                                      Delete
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              style={{
                padding: "60px 24px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  margin: "0 auto 16px",
                  background: "#f3f4f6",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FileText size={22} style={{ color: "#9ca3af" }} />
              </div>
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#6b7280",
                  margin: "0 0 4px",
                }}
              >
                No assignments found
              </p>
              <p
                style={{
                  fontSize: "13px",
                  color: "#9ca3af",
                  margin: 0,
                }}
              >
                {search
                  ? "Try adjusting your search query"
                  : "Create your first assignment to get started"}
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

/* ── Inline Style Constants ── */

const thStyle = {
  padding: "10px 16px",
  fontSize: "11.5px",
  fontWeight: 600,
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  whiteSpace: "nowrap",
}

const tdStyle = {
  padding: "14px 16px",
  verticalAlign: "middle",
}

const menuItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "9px 14px",
  fontSize: "13px",
  fontWeight: 500,
  color: "#374151",
  textDecoration: "none",
  cursor: "pointer",
  background: "transparent",
  transition: "background 0.1s",
}