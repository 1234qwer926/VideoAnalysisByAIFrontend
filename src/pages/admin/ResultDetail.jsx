import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft, Bot, ExternalLink, Loader2, Save, Video } from "lucide-react"
import { toast } from "sonner"

import { api } from "@/api/client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

function getStatusVariant(status) {
  const n = (status || "").toLowerCase()
  if (["evaluated", "reviewed"].includes(n)) return "secondary"
  if (["completed", "submitted"].includes(n)) return "default"
  return "outline"
}

function MetricBar({ label, value }) {
  const pct = Math.min(100, Math.max(0, (value / 10) * 100))
  const color =
    pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500"

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="capitalize text-muted-foreground">
          {label.replace(/_/g, " ")}
        </span>
        <span className="font-semibold tabular-nums">{value}/10</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function ResultDetail() {
  const { resultId } = useParams()

  const [result, setResult] = useState(null)
  const [score, setScore] = useState("")
  const [feedback, setFeedback] = useState("")
  const [questionScores, setQuestionScores] = useState({})

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const fetchResult = async () => {
    try {
      setIsLoading(true)
      const response = await api.get(`/api/admin/results/submission/${resultId}`)
      const data = response.data || {}
      const review = data.review || {}

      setResult(data)
      setScore(String(review.final_score ?? ""))
      setFeedback(review.comments || "")

      const initialQScores = {}
      if (Array.isArray(data.responses)) {
        data.responses.forEach((r) => {
          if (r.score != null) initialQScores[r.id] = String(r.score)
        })
      }
      setQuestionScores(initialQScores)
    } catch (error) {
      const message = error?.response?.data?.detail || "Failed to load result"
      toast.error(typeof message === "string" ? message : "Failed to load result")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchResult() }, [resultId])

  const answers = useMemo(
    () => (Array.isArray(result?.responses) ? result.responses : []),
    [result]
  )

  const summary = useMemo(() => ({
    candidateEmail: result?.candidate_email || "-",
    assignmentTitle: result?.assignment_title || "-",
    submittedAt: result?.submitted_at
      ? new Date(result.submitted_at).toLocaleString()
      : "-",
    status: result?.status || "submitted",
  }), [result])

  const handleSaveReview = async () => {
    try {
      setIsSaving(true)
      await api.put(`/api/admin/results/${resultId}`, {
        score: score === "" ? null : Number(score),
        feedback,
        question_scores: Object.fromEntries(
          Object.entries(questionScores).map(([k, v]) => [
            k,
            v === "" ? null : Number(v),
          ])
        ),
      })
      toast.success("Review saved successfully")
      fetchResult()
    } catch (error) {
      const message = error?.response?.data?.detail || "Failed to save review"
      toast.error(typeof message === "string" ? message : "Failed to save review")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading result details...
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="py-16 text-center text-sm text-muted-foreground">
          Result not found.
        </CardContent>
      </Card>
    )
  }

  const review = result.review || {}
  const aiScore = review.ai_score != null ? Number(review.ai_score).toFixed(1) : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mb-3">
          <Button asChild variant="ghost" className="px-0">
            <Link to="/admin/results">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Results
            </Link>
          </Button>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Result Detail
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Review submission answers, AI evaluation metrics, and set the final score.
            </p>
          </div>
          <Badge variant={getStatusVariant(summary.status)}>
            {summary.status}
          </Badge>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* Left column */}
        <div className="space-y-6">
          {/* Submission Info */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Submission Info</CardTitle>
              <CardDescription>Core details about this submission.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{summary.candidateEmail}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Assignment</p>
                <p className="font-medium">{summary.assignmentTitle}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Submitted At</p>
                <p className="font-medium">{summary.submittedAt}</p>
              </div>
              {aiScore && (
                <div>
                  <p className="text-sm text-muted-foreground">AI Score</p>
                  <p className="font-bold text-lg text-primary">{aiScore}%</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Candidate Answers */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Candidate Answers</CardTitle>
              <CardDescription>
                Per-question AI evaluation, metrics, and video responses.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {answers.length > 0 ? (
                answers.map((answer, index) => {
                  const answerObj =
                    answer.answer && typeof answer.answer === "object"
                      ? answer.answer
                      : {}
                  const aiMetrics = answerObj.ai_metrics || null
                  const aiFeedback = answerObj.ai_feedback || null
                  const isVideo = !!answer.video_url || !!answer.s3_key

                  return (
                    <div key={answer.id || index} className="space-y-4">
                      {/* Question label */}
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                          {index + 1}
                        </span>
                        <p className="font-semibold">
                          {answer.question_title ||
                            answer.title ||
                            answer.question ||
                            `Question ${index + 1}`}
                        </p>
                        {isVideo && (
                          <Badge variant="outline" className="ml-auto gap-1 text-xs">
                            <Video className="h-3 w-3" />
                            Video
                          </Badge>
                        )}
                      </div>

                      {/* Answer / Video */}
                      <div className="rounded-xl border bg-muted/30 p-4">
                        {answer.video_url ? (
                          <div className="flex items-center gap-3">
                            <p className="text-sm text-muted-foreground flex-1">
                              Video response recorded.
                            </p>
                            <Button asChild variant="outline" size="sm">
                              <a
                                href={answer.video_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="mr-2 h-3 w-3" />
                                View Video
                              </a>
                            </Button>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap text-sm leading-6">
                            {typeof answerObj === "string"
                              ? answerObj
                              : answer.answer || "No answer submitted"}
                          </p>
                        )}
                      </div>

                      {/* AI Evaluation Metrics */}
                      {(aiMetrics || aiFeedback) && (
                        <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 space-y-4">
                          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                            <Bot className="h-4 w-4" />
                            AI Evaluation
                            {answer.score != null && (
                              <span className="ml-auto text-xs font-bold bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                                {answer.score} pts
                              </span>
                            )}
                          </div>

                          {aiMetrics && Object.keys(aiMetrics).length > 0 && (
                            <div className="space-y-2">
                              {Object.entries(aiMetrics).map(([k, v]) => (
                                <MetricBar key={k} label={k} value={v} />
                              ))}
                            </div>
                          )}

                          {aiFeedback && (
                            <p className="text-sm text-muted-foreground leading-relaxed border-t pt-3">
                              {aiFeedback}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Admin override score */}
                      <div className="flex items-center gap-3">
                        <Label
                          htmlFor={`qscore-${answer.id}`}
                          className="text-sm font-medium whitespace-nowrap"
                        >
                          Admin Score Override
                        </Label>
                        <Input
                          id={`qscore-${answer.id}`}
                          type="number"
                          min="0"
                          max="100"
                          className="w-24 h-8 text-sm"
                          value={questionScores[answer.id] || ""}
                          onChange={(e) =>
                            setQuestionScores((prev) => ({
                              ...prev,
                              [answer.id]: e.target.value,
                            }))
                          }
                          placeholder={
                            answer.score != null ? String(answer.score) : "Score"
                          }
                        />
                      </div>

                      {index < answers.length - 1 && <Separator />}
                    </div>
                  )
                })
              ) : (
                <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
                  No answer breakdown is available for this result.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar - Evaluation */}
        <aside className="space-y-6">
          {/* AI Score summary */}
          {aiScore && (
            <Card className="rounded-2xl border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">AI Evaluation Score</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-primary">{aiScore}%</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Auto-generated by Gemini 2.5 Flash
                </p>
                <Progress value={Number(aiScore)} className="mt-3" />
              </CardContent>
            </Card>
          )}

          {/* Admin evaluation */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Admin Review</CardTitle>
              <CardDescription>
                Set the final score and add your feedback.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="score">Final Score (0 – 100)</Label>
                <Input
                  id="score"
                  type="number"
                  min="0"
                  max="100"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  placeholder={aiScore ? `AI suggested: ${aiScore}` : "Enter score"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback">Reviewer Feedback</Label>
                <Textarea
                  id="feedback"
                  rows={8}
                  placeholder="Add reviewer comments for this submission..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
              </div>

              <Button className="w-full" onClick={handleSaveReview} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Review
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </aside>
      </section>
    </div>
  )
}
