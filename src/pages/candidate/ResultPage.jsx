import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Trophy,
} from "lucide-react"
import { toast } from "sonner"

import { api } from "@/api/client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

function getStatusVariant(status) {
  const normalized = (status || "").toLowerCase()

  if (["completed", "evaluated", "passed"].includes(normalized)) return "secondary"
  if (["submitted", "reviewed"].includes(normalized)) return "default"
  return "outline"
}

export default function ResultPage() {
  const { resultId } = useParams()

  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setIsLoading(true)

        const response = await api.get(`/api/candidate/results/${resultId}`)
        setResult(response.data || null)
      } catch (error) {
        const message = error?.response?.data?.detail || "Failed to load result"
        toast.error(typeof message === "string" ? message : "Failed to load result")
      } finally {
        setIsLoading(false)
      }
    }

    fetchResult()
  }, [resultId])

  const answers = useMemo(() => (Array.isArray(result?.responses) ? result.responses : []), [result])

  const summary = useMemo(() => {
    return {
      title: result?.assignment_title || "Assessment Result",
      score: result?.final_score ?? "-",
      status: result?.status || "pending",
      submittedAt: result?.submitted_at || "-",
      feedback: result?.feedback || "",
      passed:
        typeof result?.passed === "boolean"
          ? result.passed
          : Number(result?.final_score) >= 0 && Number.isFinite(Number(result?.final_score)),
    }
  }, [result])

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading result...
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

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mb-3">
          <Button asChild variant="ghost" className="px-0">
            <Link to="/candidate/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {summary.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              Review your submission outcome, feedback, and answer details.
            </p>
          </div>

          <Badge variant={getStatusVariant(summary.status)}>
            {summary.status}
          </Badge>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Evaluator Feedback</CardTitle>
              <CardDescription>
                Comments and review notes shared for this assessment.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {summary.feedback ? (
                <div className="rounded-xl border bg-muted/30 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-6">
                    {summary.feedback}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
                  Feedback is not available yet.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Submitted Answers</CardTitle>
              <CardDescription>
                Review the answers recorded for your submission.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              {answers.length > 0 ? (
                answers.map((answer, index) => (
                  <div key={answer.id || index} className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>

                      <div className="flex-1">
                        <p className="font-medium">
                          {answer.question_title ||
                            answer.title ||
                            answer.question ||
                            `Question ${index + 1}`}
                        </p>

                        {(answer.prompt || answer.question_prompt) ? (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {answer.prompt || answer.question_prompt}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="rounded-xl border bg-muted/30 p-4">
                      {(() => {
                        const answerContent = answer.answer || answer.response || answer.value
                        
                        // Handle video answers
                        if (answerContent && typeof answerContent === "object") {
                          if (answerContent.type === "video") {
                            return (
                              <div className="space-y-2">
                                <p className="text-sm font-medium">Video Answer</p>
                                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                  {answerContent.duration && (
                                    <p>Duration: {Math.round(answerContent.duration)} seconds</p>
                                  )}
                                  {answerContent.mime_type && (
                                    <p>Format: {answerContent.mime_type}</p>
                                  )}
                                </div>
                              </div>
                            )
                          }
                          // Unknown object type - render as fallback
                          return <p className="text-sm text-muted-foreground">Answer recorded</p>
                        }
                        
                        // Text answer
                        return (
                          <p className="whitespace-pre-wrap text-sm leading-6">
                            {answerContent || "No answer submitted"}
                          </p>
                        )
                      })()}
                    </div>

                    {index < answers.length - 1 ? <Separator /> : null}
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
                  No answer breakdown is available yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Result Summary</CardTitle>
              <CardDescription>
                Your current assessment outcome at a glance.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="flex items-center gap-3 rounded-2xl border bg-muted/30 p-4">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <Trophy className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Score</p>
                  <p className="text-2xl font-semibold">{summary.score}</p>
                </div>
              </div>

              <div className="grid gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium capitalize">{summary.status}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Submitted At</p>
                  <p className="font-medium">{summary.submittedAt}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Outcome</p>
                  <p className="font-medium">
                    {summary.passed ? "Passed / Qualified" : "Under Review / Not Qualified"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </section>
    </div>
  )
}
