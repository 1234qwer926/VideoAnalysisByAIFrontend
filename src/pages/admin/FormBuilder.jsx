import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Loader2, Plus, Save } from "lucide-react"
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

import QuestionCard from "@/components/forms/QuestionCard"

function createEmptyQuestion(order = 0) {
  return {
    id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: "",
    prompt: "",
    type: "text",
    required: true,
    options: [],
    order,
  }
}

export default function FormBuilder() {
  const navigate = useNavigate()
  const { formId } = useParams()
  const isEditMode = Boolean(formId)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [questions, setQuestions] = useState([createEmptyQuestion(0)])

  const [isLoading, setIsLoading] = useState(isEditMode)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isEditMode) return

    const fetchForm = async () => {
      try {
        setIsLoading(true)

        const response = await api.get(`/api/admin/forms/${formId}`)
        const data = response.data || {}

        setTitle(data.title || "")
        setDescription(data.description || "")
        setCategory(data.category || "")

        const incomingQuestions = Array.isArray(data.questions) ? data.questions : []

        if (incomingQuestions.length > 0) {
          setQuestions(
            incomingQuestions.map((question, index) => ({
              id: question.id || `existing-${index}`,
              title: question.title || question.question || "",
              prompt:
                question.prompt ||
                question.text ||
                question.description ||
                "",
              type: question.type || "text",
              required:
                typeof question.required === "boolean" ? question.required : true,
              options: Array.isArray(question.options)
                ? question.options
                : Array.isArray(question.config?.options)
                  ? question.config.options
                  : [],
              section: question.section || question.config?.section || "",
              section_time_seconds:
                question.section_time_seconds ||
                question.config?.section_time_seconds ||
                "",
              order: question.order ?? index,
            }))
          )
        } else {
          setQuestions([createEmptyQuestion(0)])
        }
      } catch (error) {
        const message = error?.response?.data?.detail || "Failed to load form"
        toast.error(typeof message === "string" ? message : "Failed to load form")
      } finally {
        setIsLoading(false)
      }
    }

    fetchForm()
  }, [formId, isEditMode])

  const sortedQuestions = useMemo(() => {
    return [...questions].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }, [questions])

  const handleQuestionChange = (questionId, field, value) => {
    setQuestions((prev) =>
      prev.map((question) =>
        question.id === questionId ? { ...question, [field]: value } : question
      )
    )
  }

  const handleAddQuestion = () => {
    setQuestions((prev) => [...prev, createEmptyQuestion(prev.length)])
  }

  const handleDeleteQuestion = (questionId) => {
    setQuestions((prev) => {
      const updated = prev.filter((question) => question.id !== questionId)

      if (updated.length === 0) {
        return [createEmptyQuestion(0)]
      }

      return updated.map((question, index) => ({
        ...question,
        order: index,
      }))
    })
  }

  const handleMoveQuestion = (questionId, direction) => {
    setQuestions((prev) => {
      const currentIndex = prev.findIndex((question) => question.id === questionId)
      if (currentIndex === -1) return prev

      const targetIndex =
        direction === "up" ? currentIndex - 1 : currentIndex + 1

      if (targetIndex < 0 || targetIndex >= prev.length) return prev

      const next = [...prev]
      const temp = next[currentIndex]
      next[currentIndex] = next[targetIndex]
      next[targetIndex] = temp

      return next.map((question, index) => ({
        ...question,
        order: index,
      }))
    })
  }

  const normalizePayload = () => {
    return {
      title,
      description,
      category,
      questions: sortedQuestions.map((question, index) => ({
        id:
          typeof question.id === "string" && question.id.startsWith("temp-")
            ? undefined
            : question.id,
        title: question.title,
        prompt: question.prompt,
        type: question.type,
        required: question.required,
        options:
          ["mcq", "single_select", "multiple_select", "select"].includes(
            question.type
          )
            ? (question.options || []).filter(
                (option) => String(option).trim() !== ""
              )
            : [],
        section: question.section || undefined,
        section_time_seconds:
          Number(question.section_time_seconds) > 0
            ? Number(question.section_time_seconds)
            : undefined,
        order: index,
      })),
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error("Form title is required")
      return
    }

    const hasEmptyQuestionTitle = sortedQuestions.some(
      (question) => !question.title?.trim()
    )

    if (hasEmptyQuestionTitle) {
      toast.error("Every question must have a title")
      return
    }

    try {
      setIsSubmitting(true)

      const payload = normalizePayload()

      if (isEditMode) {
        await api.put(`/api/admin/forms/${formId}`, payload)
        toast.success("Form updated successfully")
      } else {
        await api.post("/api/admin/forms", payload)
        toast.success("Form created successfully")
      }

      navigate("/admin/forms")
    } catch (error) {
      const message = error?.response?.data?.detail || "Failed to save form"
      toast.error(typeof message === "string" ? message : "Failed to save form")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading form...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-lg border border-[#E5E7EB] bg-white p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2">
            <Button asChild variant="ghost" className="px-0">
              <Link to="/admin/forms">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Forms
              </Link>
            </Button>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">
            {isEditMode ? "Edit Form" : "Create Form"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Build an interview form with flexible question types and reusable structure.
          </p>
        </div>

        <Button onClick={handleAddQuestion}>
          <Plus className="mr-2 h-4 w-4" />
          Add Question
        </Button>
      </section>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Form Details</CardTitle>
            <CardDescription>
              Set the base information for this interview form.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Frontend Developer Screening"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                placeholder="Describe the purpose of this form..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                placeholder="Technical Interview"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {sortedQuestions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              index={index}
              totalQuestions={sortedQuestions.length}
              onChange={handleQuestionChange}
              onDelete={handleDeleteQuestion}
              onMove={handleMoveQuestion}
            />
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={handleAddQuestion}>
            <Plus className="mr-2 h-4 w-4" />
            Add Another Question
          </Button>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditMode ? "Update Form" : "Create Form"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
