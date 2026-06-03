import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import { toast } from "sonner"

import { api } from "@/api/client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function AssignmentCreate() {
  const navigate = useNavigate()
  const { assignmentId } = useParams()
  const isEditMode = !!assignmentId

  const [forms, setForms] = useState([])
  const [isLoadingForms, setIsLoadingForms] = useState(true)
  const [isLoadingAssignment, setIsLoadingAssignment] = useState(isEditMode)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    form_id: "",
    start_date: "",
    end_date: "",
    overall_timer_minutes: "",
    knowledge_base: "",
    ai_prompt: "",
    per_question_timer_seconds: "",
    submission_timer_minutes: "",
  })

  // Convert ISO datetime to datetime-local format
  const formatDateTimeLocal = (isoString) => {
    if (!isoString) return ""
    // Convert "2026-06-03T15:04:00Z" to "2026-06-03T15:04"
    return new Date(isoString).toISOString().slice(0, 16)
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Always load forms
        setIsLoadingForms(true)
        const formsRes = await api.get("/api/admin/forms")
        setForms(Array.isArray(formsRes.data) ? formsRes.data : [])

        // Load assignment if in edit mode
        if (isEditMode) {
          setIsLoadingAssignment(true)
          const assignmentRes = await api.get(`/api/admin/assignments/${assignmentId}`)
          const assignment = assignmentRes.data

          setFormData({
            title: assignment.title || "",
            description: assignment.description || "",
            form_id: assignment.form_id || "",
            start_date: formatDateTimeLocal(assignment.start_date),
            end_date: formatDateTimeLocal(assignment.end_date),
            overall_timer_minutes: assignment.overall_timer_minutes || "",
            knowledge_base: assignment.knowledge_base || "",
            ai_prompt: assignment.ai_prompt || "",
            per_question_timer_seconds: assignment.per_question_timer_seconds || "",
            submission_timer_minutes: assignment.submission_timer_minutes || "",
          })
        }
      } catch (error) {
        const message = isEditMode
          ? error?.response?.data?.detail || "Failed to load assignment"
          : error?.response?.data?.detail || "Failed to load forms"
        toast.error(typeof message === "string" ? message : "Failed to load data")
      } finally {
        setIsLoadingForms(false)
        setIsLoadingAssignment(false)
      }
    }

    fetchData()
  }, [isEditMode, assignmentId])

  const selectedForm = useMemo(() => {
    return forms.find((form) => String(form.id) === String(formData.form_id)) || null
  }, [forms, formData.form_id])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error("Assignment title is required")
      return false
    }

    if (!formData.form_id) {
      toast.error("Please select a form")
      return false
    }

    if (
      formData.start_date &&
      formData.end_date &&
      new Date(formData.end_date) <= new Date(formData.start_date)
    ) {
      toast.error("End date must be after start date")
      return false
    }

    return true
  }

  const buildPayload = () => {
    return {
      title: formData.title,
      description: formData.description,
      form_id: Number(formData.form_id),
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      overall_timer_minutes: formData.overall_timer_minutes
        ? Number(formData.overall_timer_minutes)
        : null,
      knowledge_base: formData.knowledge_base || null,
      ai_prompt: formData.ai_prompt || null,
      per_question_timer_seconds: formData.per_question_timer_seconds
        ? Number(formData.per_question_timer_seconds)
        : null,
      submission_timer_minutes: formData.submission_timer_minutes
        ? Number(formData.submission_timer_minutes)
        : null,
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      setIsSubmitting(true)

      const payload = buildPayload()
      
      if (isEditMode) {
        // Update existing assignment
        await api.put(`/api/admin/assignments/${assignmentId}`, payload)
        toast.success("Assignment updated successfully")
      } else {
        // Create new assignment
        await api.post("/api/admin/assignments", payload)
        toast.success("Assignment created successfully")
      }
      
      navigate("/admin/assignments")
    } catch (error) {
      const message =
        error?.response?.data?.detail || `Failed to ${isEditMode ? "update" : "create"} assignment`
      toast.error(
        typeof message === "string" ? message : `Failed to ${isEditMode ? "update" : "create"} assignment`
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {isLoadingAssignment ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading assignment...
          </div>
        </div>
      ) : (
        <>
          <section className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="mb-3">
              <Button asChild variant="ghost" className="px-0">
                <Link to="/admin/assignments">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Assignments
                </Link>
              </Button>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight">
              {isEditMode ? "Edit Assignment" : "Create Assignment"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isEditMode
                ? "Update the assignment details, form, and scheduling."
                : "Link a form to a scheduled candidate assessment with instructions and timing."}
            </p>
          </section>

          <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Assignment Details</CardTitle>
              <CardDescription>
                Define the core information for this assessment.
              </CardDescription>
            </CardHeader>

            <CardContent className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Frontend Developer Assessment"
                  value={formData.title}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={4}
                  placeholder="Add a short internal or candidate-facing description..."
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="form_id">Select Form</Label>
                <select
                  id="form_id"
                  name="form_id"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.form_id}
                  onChange={handleChange}
                  disabled={isLoadingForms}
                >
                  <option value="">
                    {isLoadingForms ? "Loading forms..." : "Choose a form"}
                  </option>
                  {forms.map((form) => (
                    <option key={form.id} value={form.id}>
                      {form.title || `Form #${form.id}`}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Schedule & Timing</CardTitle>
              <CardDescription>
                Configure date range and timer settings.
              </CardDescription>
            </CardHeader>

            <CardContent className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  name="end_date"
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="overall_timer_minutes">Overall Timer (minutes)</Label>
                <Input
                  id="overall_timer_minutes"
                  name="overall_timer_minutes"
                  type="number"
                  min="1"
                  placeholder="60"
                  value={formData.overall_timer_minutes}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="per_question_timer_seconds">Per Question Timer (seconds)</Label>
                <Input
                  id="per_question_timer_seconds"
                  name="per_question_timer_seconds"
                  type="number"
                  min="1"
                  placeholder="60"
                  value={formData.per_question_timer_seconds}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="submission_timer_minutes">Submission Timer (minutes)</Label>
                <Input
                  id="submission_timer_minutes"
                  name="submission_timer_minutes"
                  type="number"
                  min="1"
                  placeholder="5"
                  value={formData.submission_timer_minutes}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="knowledge_base">Knowledge Base</Label>
                <Textarea
                  id="knowledge_base"
                  name="knowledge_base"
                  rows={3}
                  placeholder="Add reference materials or knowledge base..."
                  value={formData.knowledge_base}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="ai_prompt">AI Prompt</Label>
                <Textarea
                  id="ai_prompt"
                  name="ai_prompt"
                  rows={3}
                  placeholder="Add AI evaluation prompt..."
                  value={formData.ai_prompt}
                  onChange={handleChange}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isSubmitting || isLoadingForms}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEditMode ? "Update Assignment" : "Create Assignment"}
                </>
              )}
            </Button>

            <Button type="button" variant="outline" asChild>
              <Link to="/admin/assignments">Cancel</Link>
            </Button>
          </div>
        </div>

        <aside>
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Selected Form</CardTitle>
              <CardDescription>
                Review the form linked to this assignment.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              {selectedForm ? (
                <>
                  <div>
                    <p className="font-medium">
                      {selectedForm.title || `Form #${selectedForm.id}`}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedForm.description || "No description available"}
                    </p>
                  </div>

                  <div className="rounded-xl border bg-muted/30 p-4 text-sm">
                    <p>
                      Questions:{" "}
                      <span className="font-medium">
                        {Array.isArray(selectedForm.questions)
                          ? selectedForm.questions.length
                          : selectedForm.question_count ?? 0}
                      </span>
                    </p>
                    <p className="mt-2">
                      Category:{" "}
                      <span className="font-medium">
                        {selectedForm.category || "-"}
                      </span>
                    </p>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
                  Select a form to preview its details.
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </form>
        </>
      )}
    </div>
  )
}