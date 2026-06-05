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

function getStatusVariant(status) {
  const n = (status || "").toLowerCase()
  if (["evaluated", "reviewed"].includes(n)) return "secondary"
  if (["completed", "submitted"].includes(n)) return "default"
  return "outline"
}

function prettyMetric(label) {
  return label.replace(/_/g, " ")
}

function MetricBar({ label, value, hideLabel = false }) {
  const numeric = Number(value)
  const hasValue = Number.isFinite(numeric)
  const pct = hasValue ? Math.min(100, Math.max(0, (numeric / 10) * 100)) : 0
  const color =
    pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500"

  return (
    <div className="space-y-1">
      <div className={`flex items-center text-xs ${hideLabel ? "justify-end" : "justify-between"}`}>
        {!hideLabel && (
          <span className="capitalize text-muted-foreground">
            {prettyMetric(label)}
          </span>
        )}
        <span className="font-semibold tabular-nums">
          {hasValue ? `${numeric}/10` : "-"}
        </span>
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

function formatScore(value) {
  if (value == null || value === "") return "-"
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric.toFixed(1) : "-"
}

function extractPlainAnswer(answer) {
  if (typeof answer === "string") return answer
  if (answer && typeof answer === "object") {
    return answer.user_answer_text || answer.transcript || answer.text || ""
  }
  return ""
}

function normalizeMetricMap(metrics) {
  return Object.fromEntries(
    Object.entries(metrics || {}).map(([key, value]) => [
      key,
      value == null || value === "" ? "" : String(value),
    ])
  )
}

export default function ResultDetail() {
  const { resultId } = useParams()

  const [result, setResult] = useState(null)
  const [score, setScore] = useState("")
  const [feedback, setFeedback] = useState("")
  const [questionScores, setQuestionScores] = useState({})
  const [overallMetricDrafts, setOverallMetricDrafts] = useState({})

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const fetchResult = async () => {
    try {
      setIsLoading(true)
      const response = await api.get(`/api/admin/results/submission/${resultId}`)
      const data = response.data || {}
      const review = data.review || {}

      setResult(data)
      setScore(String(review.final_score ?? data.score_summary?.final_percentage ?? ""))
      setFeedback(review.feedback_text || review.comments || "")

      const initialQScores = {}
      if (Array.isArray(data.responses)) {
        data.responses.forEach((r) => {
          const preferred = r.final_score ?? r.score ?? ""
          initialQScores[r.id] = preferred === "" || preferred == null ? "" : String(preferred)
        })
      }
      setQuestionScores(initialQScores)
      setOverallMetricDrafts(
        normalizeMetricMap(data.overall_metrics?.final || data.overall_metrics?.ai || {})
      )
    } catch (error) {
      const message = error?.response?.data?.detail || "Failed to load result"
      toast.error(typeof message === "string" ? message : "Failed to load result")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let alive = true

    ;(async () => {
      try {
        setIsLoading(true)
        const response = await api.get(`/api/admin/results/submission/${resultId}`)
        if (!alive) return

        const data = response.data || {}
        const review = data.review || {}

        setResult(data)
        setScore(String(review.final_score ?? data.score_summary?.final_percentage ?? ""))
        setFeedback(review.feedback_text || review.comments || "")

        const initialQScores = {}
        if (Array.isArray(data.responses)) {
          data.responses.forEach((r) => {
            const preferred = r.final_score ?? r.score ?? ""
            initialQScores[r.id] = preferred === "" || preferred == null ? "" : String(preferred)
          })
        }
        setQuestionScores(initialQScores)
        setOverallMetricDrafts(
          normalizeMetricMap(data.overall_metrics?.final || data.overall_metrics?.ai || {})
        )
      } catch (error) {
        if (!alive) return
        const message = error?.response?.data?.detail || "Failed to load result"
        toast.error(typeof message === "string" ? message : "Failed to load result")
      } finally {
        if (alive) setIsLoading(false)
      }
    })()

    return () => {
      alive = false
    }
  }, [resultId])

  const answers = useMemo(
    () => (Array.isArray(result?.responses) ? result.responses : []),
    [result]
  )

  const summary = useMemo(
    () => ({
      candidateEmail: result?.candidate_email || "-",
      assignmentTitle: result?.assignment_title || "-",
      submittedAt: result?.submitted_at
        ? new Date(result.submitted_at).toLocaleString()
        : "-",
      status: result?.status || "submitted",
    }),
    [result]
  )

  const overallMetrics = useMemo(
    () => result?.overall_metrics || { ai: {}, final: {} },
    [result]
  )
  const overallMetricKeys = useMemo(
    () =>
      Array.from(
        new Set([
          ...Object.keys(overallMetrics.ai || {}),
          ...Object.keys(overallMetrics.final || {}),
        ])
      ).sort(),
    [overallMetrics]
  )

  const summaryStats = result?.score_summary || {}
  const review = result?.review || {}

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
        overall_metrics_override: Object.fromEntries(
          Object.entries(overallMetricDrafts).map(([k, v]) => [
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
      <Card>
        <CardContent className="py-16 text-center text-sm text-muted-foreground">
          Result not found.
        </CardContent>
      </Card>
    )
  }

  const aiScore = review.ai_score != null ? Number(review.ai_score).toFixed(1) : null
  const finalScore = review.final_score != null ? Number(review.final_score).toFixed(1) : null
  const allQuestionRows = answers.map((answer, index) => {
    const isVideo = !!answer.video_url || !!answer.s3_key || answer.question_type === "video"
    return {
      ...answer,
      rowNumber: index + 1,
      isVideo,
      answerText: extractPlainAnswer(answer.answer),
      aiMetrics: answer.ai_metrics || {},
      aiFeedback: answer.ai_feedback || "",
    }
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <section
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "16px",
          alignItems: "flex-start",
          justifyContent: "space-between",
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "24px 28px",
        }}
      >
        <div>
          <div className="mb-4">
            <Button asChild variant="ghost" className="px-0 h-auto text-muted-foreground hover:text-foreground">
              <Link to="/admin/results">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Results
              </Link>
            </Button>
          </div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#111827",
              margin: 0,
              letterSpacing: "-0.3px",
            }}
          >
            Result Detail
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "#6b7280",
              margin: "4px 0 0",
            }}
          >
            Table view of responses, AI scoring, final scoring, and metric overrides.
          </p>
        </div>
        <div style={{ alignSelf: "center" }}>
          <Badge variant={getStatusVariant(summary.status)}>{summary.status}</Badge>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Submission Info</CardTitle>
              <CardDescription>Core details and aggregated scores.</CardDescription>
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
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium">{summary.status}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">AI Overall</p>
                <p className="font-bold text-lg text-[#3B82F6]">
                  {summaryStats.ai_percentage != null ? `${summaryStats.ai_percentage}%` : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Final Overall</p>
                <p className="font-bold text-lg text-foreground">
                  {summaryStats.final_percentage != null ? `${summaryStats.final_percentage}%` : "-"}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">AI Score</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-[#3B82F6]">
                  {aiScore != null ? `${aiScore}%` : "-"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Automatic score from the evaluator
                </p>
                {summaryStats.ai_percentage != null && (
                  <Progress value={Number(summaryStats.ai_percentage)} className="mt-3" />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Final Score</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {finalScore != null ? `${finalScore}%` : "-"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Current reviewer-controlled final score
                </p>
                {summaryStats.final_percentage != null && (
                  <Progress value={Number(summaryStats.final_percentage)} className="mt-3" />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Raw Points</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {summaryStats.final_points != null
                    ? `${summaryStats.final_points} / ${summaryStats.max_points ?? summaryStats.final_points}`
                    : "-"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Final points and total available points
                </p>
              </CardContent>
            </Card>
          </div>

          <div
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #f3f4f6",
              }}
            >
              <h2
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#111827",
                  margin: "0 0 4px",
                }}
              >
                Candidate Answers
              </h2>
              <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
                Each row includes the submitted response, AI evaluation, and the final score override.
              </p>
            </div>

            <div style={{ padding: "0" }}>
              {allQuestionRows.length > 0 ? (
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
                        <th style={{ ...thStyle, textAlign: "left", minWidth: "240px" }}>Question</th>
                        <th style={{ ...thStyle, textAlign: "left", minWidth: "300px" }}>Response</th>
                        <th style={{ ...thStyle, textAlign: "left", minWidth: "220px" }}>AI Metrics</th>
                        <th style={{ ...thStyle, textAlign: "left", minWidth: "260px" }}>AI Feedback</th>
                        <th style={{ ...thStyle, textAlign: "center" }}>AI Score</th>
                        <th style={{ ...thStyle, textAlign: "center" }}>Final Score</th>
                        <th style={{ ...thStyle, textAlign: "left", width: "140px" }}>Admin Override</th>
                        <th style={{ ...thStyle, textAlign: "left", width: "110px" }}>Artifact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allQuestionRows.map((answer) => (
                        <tr
                          key={answer.id}
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
                          <td style={{ ...tdStyle, color: "#9ca3af", fontWeight: 500, textAlign: "center" }}>
                            {answer.rowNumber}
                          </td>
                          <td style={tdStyle}>
                            <div className="space-y-1">
                              <p style={{ fontWeight: 600, color: "#111827", lineHeight: 1.3 }}>
                                {answer.question_title || `Question ${answer.rowNumber}`}
                              </p>
                              <p style={{ fontSize: "12.5px", color: "#6b7280" }}>
                                {answer.question_type || "text"}
                                {answer.question_points != null
                                  ? ` • ${answer.question_points} pts`
                                  : ""}
                              </p>
                              {answer.question_description ? (
                                <p style={{ fontSize: "13px", color: "#6b7280", whiteSpace: "pre-wrap", marginTop: "4px" }}>
                                  {answer.question_description}
                                </p>
                              ) : null}
                            </div>
                          </td>
                          <td style={tdStyle}>
                            <div className="space-y-2">
                              {answer.isVideo ? (
                                <div style={{ background: "#f3f4f6", padding: "12px", borderRadius: "8px", fontSize: "13px", color: "#6b7280" }}>
                                  Video response recorded.
                                </div>
                              ) : (
                                <p style={{ whiteSpace: "pre-wrap", fontSize: "14px", lineHeight: 1.6, color: "#374151" }}>
                                  {answer.answerText || "No answer submitted"}
                                </p>
                              )}
                              {answer.video_url ? (
                                <Button asChild variant="outline" size="sm">
                                  <a href={answer.video_url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="mr-2 h-3 w-3" />
                                    Open Response
                                  </a>
                                </Button>
                              ) : null}
                            </div>
                          </td>
                          <td style={tdStyle}>
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-sm">
                                <Bot className="h-4 w-4 text-[#3B82F6]" />
                                <span className="font-semibold" style={{ color: "#111827" }}>
                                  {formatScore(answer.ai_score)}
                                  {answer.question_points != null
                                    ? ` / ${answer.question_points}`
                                    : ""}
                                </span>
                              </div>
                              {Object.keys(answer.aiMetrics || {}).length > 0 ? (
                                <div className="space-y-2">
                                  {Object.entries(answer.aiMetrics).map(([key, value]) => (
                                    <MetricBar key={key} label={key} value={value} />
                                  ))}
                                </div>
                              ) : (
                                <p style={{ fontSize: "12px", color: "#9ca3af" }}>No AI metrics available.</p>
                              )}
                            </div>
                          </td>
                          <td style={tdStyle}>
                            {answer.aiFeedback ? (
                              <p style={{ fontSize: "13px", lineHeight: 1.6, color: "#4b5563", whiteSpace: "pre-wrap", background: "#f9fafb", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                                {answer.aiFeedback}
                              </p>
                            ) : (
                              <span style={{ fontSize: "12px", color: "#9ca3af" }}>No feedback provided.</span>
                            )}
                          </td>
                          <td style={{ ...tdStyle, textAlign: "center" }}>
                            <div style={{ fontWeight: 600, color: "#111827" }}>
                              {formatScore(answer.ai_score)}
                            </div>
                          </td>
                          <td style={{ ...tdStyle, textAlign: "center" }}>
                            <div style={{ fontWeight: 600, color: "#111827" }}>
                              {formatScore(answer.final_score)}
                            </div>
                          </td>
                          <td style={tdStyle}>
                            <Input
                              type="number"
                              min="0"
                              max={answer.question_points || 100}
                              value={questionScores[answer.id] ?? ""}
                              onChange={(e) =>
                                setQuestionScores((prev) => ({
                                  ...prev,
                                  [answer.id]: e.target.value,
                                }))
                              }
                              placeholder={
                                answer.final_score != null
                                  ? String(answer.final_score)
                                  : "Score"
                              }
                              className="w-full"
                            />
                          </td>
                          <td style={tdStyle}>
                            {answer.video_url ? (
                              <Button asChild variant="ghost" size="sm">
                                <a href={answer.video_url} target="_blank" rel="noopener noreferrer">
                                  <Video className="mr-2 h-3 w-3" />
                                  Open
                                </a>
                              </Button>
                            ) : (
                              <span style={{ fontSize: "13px", color: "#9ca3af" }}>Text</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: "48px 24px", textAlign: "center" }}>
                  <div style={{ color: "#6b7280", fontSize: "14px" }}>
                    No answer breakdown is available for this result.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <Card className="border-primary/20 bg-[#F3F4F6]">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-[#3B82F6]" />
                <CardTitle className="text-base">Candidate Metrics</CardTitle>
              </div>
              <CardDescription>
                AI values on the left, final values on the right. Edit the final column before saving.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {overallMetricKeys.length > 0 ? (
                overallMetricKeys.map((key) => (
                  <div key={key} className="space-y-2 rounded-md border bg-white p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">
                        {prettyMetric(key)}
                      </span>
                      <span className="text-xs text-muted-foreground">0 - 10</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground mb-1">AI</p>
                        <MetricBar label={key} value={overallMetrics.ai?.[key]} hideLabel />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Final</p>
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          value={overallMetricDrafts[key] ?? ""}
                          onChange={(e) =>
                            setOverallMetricDrafts((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }))
                          }
                          placeholder={
                            overallMetrics.final?.[key] != null
                              ? String(overallMetrics.final[key])
                              : "Override"
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-dashed bg-white p-4 text-sm text-muted-foreground">
                  No candidate-level AI metrics were returned.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Admin Review</CardTitle>
              <CardDescription>
                Set the overall final score and reviewer feedback.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="score">Final Score (0 - 100)</Label>
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
  padding: "16px",
  verticalAlign: "top",
}
