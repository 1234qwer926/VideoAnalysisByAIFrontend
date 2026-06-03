import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Expand,
  Loader2,
  Save,
  Send,
} from "lucide-react"
import { toast } from "sonner"

import { api } from "@/api/client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import VideoRecorder from "@/components/interview/VideoRecorder"
import ExamInstructions from "@/components/interview/ExamInstructions"

function formatTime(totalSeconds) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "00:00"

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`
}

export default function ExamPage() {
  const { token } = useParams()
  const navigate = useNavigate()

  const [exam, setExam] = useState(null)
  const [answers, setAnswers] = useState({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(null)
  const [sectionTimeLeft, setSectionTimeLeft] = useState(null)

  const [showInstructions, setShowInstructions] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVideoUploading, setIsVideoUploading] = useState(false)
  const [cameraState, setCameraState] = useState({ recordingState: "idle", hasPreview: false })
  const lastViolationAtRef = useRef(0)
  const questions = useMemo(() => {
    if (!exam) return []
    return exam.questions || exam.form?.questions || []
  }, [exam])
  const sections = useMemo(() => exam?.sections || [], [exam])
  const currentSection = useMemo(() => {
    return (
      sections.find(
        (section) =>
          currentIndex >= section.start_index && currentIndex <= section.end_index
      ) || null
    )
  }, [sections, currentIndex])

  useEffect(() => {
    const fetchExam = async () => {
      try {
        setIsLoading(true)

        const response = await api.get(`/api/exam/info?token=${token}`)
        const payload = response.data

        setExam(payload)

        const initialAnswers =
          payload?.saved_answers ||
          payload?.answers ||
          payload?.responses ||
          {}

        setAnswers(initialAnswers)

        if (payload?.remaining_seconds != null) {
          setTimeLeft(Number(payload.remaining_seconds))
        } else if (payload?.overall_timer != null) {
          setTimeLeft(Number(payload.overall_timer) * 60)
        } else {
          setTimeLeft(null)
        }
      } catch (error) {
        const message = error?.response?.data?.detail || "Failed to load exam"
        toast.error(typeof message === "string" ? message : "Failed to load exam")
      } finally {
        setIsLoading(false)
      }
    }

    fetchExam()
  }, [token])

  useEffect(() => {
    if (timeLeft == null || timeLeft <= 0) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev == null) return prev
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timeLeft])

  useEffect(() => {
    if (timeLeft === 0 && exam && !isSubmitting) {
      handleSubmit(true)
    }
  }, [timeLeft])

  useEffect(() => {
    if (!currentSection) {
      setSectionTimeLeft(null)
      return
    }
    const seconds = Number(currentSection.time_seconds)
    if (!Number.isFinite(seconds) || seconds <= 0) {
      setSectionTimeLeft(null)
      return
    }
    setSectionTimeLeft(seconds)
  }, [currentSection?.name, currentSection?.time_seconds])

  useEffect(() => {
    if (sectionTimeLeft == null || sectionTimeLeft <= 0) return

    const interval = setInterval(() => {
      setSectionTimeLeft((prev) => {
        if (prev == null) return prev
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [sectionTimeLeft])

  useEffect(() => {
    if (sectionTimeLeft !== 0 || !currentSection || isSubmitting) return

    const nextIndex = currentSection.end_index + 1
    if (nextIndex < questions.length) {
      setCurrentIndex(nextIndex)
      toast.error(`Time is up for ${currentSection.name}. Moving to next section.`)
      return
    }

    handleSubmit(true)
  }, [sectionTimeLeft, currentSection, isSubmitting, questions.length])

  const currentQuestion = questions[currentIndex]
  const currentQuestionText =
    currentQuestion?.prompt ||
    currentQuestion?.description ||
    currentQuestion?.text ||
    currentQuestion?.question_text ||
    "Answer the question below."

  const answeredCount = useMemo(() => {
    return questions.filter((question, index) => {
      const key = question.id ?? index
      const value = answers[key]
      return value != null && String(value).trim() !== ""
    }).length
  }, [questions, answers])

  const progressValue =
    questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0

  const handleAnswerChange = (questionKey, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionKey]: value,
    }))
  }

  const submitQuestion = async (moveToNext = true) => {
    if (!exam || !currentQuestion) return
    if (isVideoUploading) {
      toast.error("Please wait for video upload to finish before submitting.")
      return
    }

    const questionKey = currentQuestion?.id ?? currentIndex
    const answer = answers[questionKey]
    const isVideoQuestion = currentQuestion?.type === "video"

    // Validate answer based on question type
    if (isVideoQuestion) {
      if (!answer || typeof answer !== "object" || !answer.upload_status) {
        toast.error("Please record a video answer before submitting.")
        return
      }
      if (answer.upload_status !== "uploaded") {
        toast.error("Please wait for video to be uploaded before submitting.")
        return
      }
    } else {
      if (answer == null || String(answer).trim() === "") {
        toast.error("Please answer the question before submitting.")
        return
      }
    }

    try {
      setIsSubmitting(true)

      // Submit progress
      const response = await api.post(`/api/exam/save?token=${token}`, {
        answers: answers,
        current_question_index: moveToNext ? currentIndex + 1 : currentIndex
      })

      toast.success("Progress saved!")

      if (moveToNext) {
        if (currentIndex < questions.length - 1) {
          // Move to next question
          setCurrentIndex(currentIndex + 1)
        } else {
          // All questions answered, show completion
          // Submit all remaining answers and finish
          handleSubmitExam()
        }
      }
    } catch (error) {
      const message = error?.response?.data?.detail || "Failed to submit question"
      toast.error(
        typeof message === "string" ? message : "Failed to submit question"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitExam = async () => {
    if (!exam) return

    try {
      setIsSubmitting(true)

      const responses = Object.entries(answers).map(([questionId, answer]) => {
        const isVideoAnswer =
          answer && typeof answer === "object" && answer.type === "video"
        return {
          question_id: Number(questionId),
          s3_key: isVideoAnswer ? answer.s3_key || null : null,
          answer: isVideoAnswer
            ? {
                type: "video",
                duration: answer.duration || null,
                mime_type: answer.mime_type || null,
              }
            : answer,
        }
      })

      const response = await api.post(`/api/exam/submit`, {
        assignment_user_token: token,
        responses,
        is_auto_submitted: false,
      })

      toast.success("Exam submitted successfully!")

      const resultId =
        response?.data?.submission_id ||
        response?.data?.result_id ||
        response?.data?.id

      if (resultId) {
        navigate(`/candidate/result/${resultId}`)
      } else {
        navigate("/candidate/dashboard")
      }
    } catch (error) {
      const message = error?.response?.data?.detail || "Failed to submit exam"
      toast.error(
        typeof message === "string" ? message : "Failed to submit exam"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (autoSubmit = false) => {
    if (autoSubmit) {
      handleSubmitExam()
    } else {
      submitQuestion(true)
    }
  }

  const logProctorEvent = async (type, detail) => {
    // Simplified - just log, no violation counting
    try {
      await api.post(`/api/exam/proctor-event?token=${token}`, {
        type,
        detail,
        current_question_index: currentIndex,
      })
    } catch {
      // Silent fail
    }
  }

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        logProctorEvent("tab_switch", "You switched tabs or minimized the window.")
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange)
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [currentIndex, token])

  const requestFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      }
    } catch {
      toast.error("Unable to enter fullscreen mode.")
    }
  }

  const handleStartExam = () => {
    setShowInstructions(false)
  }

  const uploadVideoAnswer = async (questionId, blob, mimeType, duration, previewUrl) => {
    setIsVideoUploading(true)
    handleAnswerChange(questionId, {
      type: "video",
      upload_status: "uploading",
      preview_url: previewUrl,
      duration,
      mime_type: mimeType,
    })

    try {
      const presigned = await api.post(
        `/api/exam/presigned-upload?token=${token}&question_id=${Number(questionId)}&content_type=${encodeURIComponent(mimeType || "video/webm")}`
      )
      const uploadUrl = presigned?.data?.upload_url
      const s3Key = presigned?.data?.s3_key

      if (!uploadUrl || !s3Key) {
        throw new Error("Missing upload URL or S3 key")
      }

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": mimeType || "video/webm",
        },
        body: blob,
      })

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed with status ${uploadResponse.status}`)
      }

      handleAnswerChange(questionId, {
        type: "video",
        upload_status: "uploaded",
        s3_key: s3Key,
        preview_url: previewUrl,
        duration,
        mime_type: mimeType,
      })
      toast.success("Video uploaded successfully")
    } catch (error) {
      handleAnswerChange(questionId, {
        type: "video",
        upload_status: "failed",
        preview_url: previewUrl,
        duration,
        mime_type: mimeType,
      })
      const message =
        error?.response?.data?.detail ||
        error?.message ||
        "Video upload failed"
      toast.error(typeof message === "string" ? message : "Video upload failed")
    } finally {
      setIsVideoUploading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading exam...
        </div>
      </div>
    )
  }

  if (!exam || questions.length === 0) {
    return (
      <Card className="mx-auto max-w-3xl rounded-2xl">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 rounded-2xl bg-muted p-3 text-muted-foreground">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold">Exam unavailable</h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            This assignment could not be loaded or does not contain any questions.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Show instructions first
  if (showInstructions) {
    return (
      <div className="py-8">
        <ExamInstructions exam={exam} onStartExam={handleStartExam} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background space-y-6 pb-8">
      {/* Header with timer and progress */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold">{exam.title || "Assessment"}</h1>
              <p className="text-sm text-muted-foreground">
                Question {currentIndex + 1} of {questions.length}
              </p>
            </div>

            {timeLeft != null && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-muted/30">
                <Clock3 className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{formatTime(timeLeft)}</span>
              </div>
            )}
          </div>

          <Progress value={progressValue} className="mt-4" />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - Question */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="rounded-2xl">
            {currentQuestion ? (
              <>
                <CardHeader className="space-y-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <Badge variant="secondary">
                      {currentQuestion?.type || "text"}
                    </Badge>

                    {currentSection && (
                      <Badge variant="outline">
                        Section: {currentSection.name}
                      </Badge>
                    )}
                  </div>

                  <CardTitle className="text-xl">
                    {currentQuestion?.title ||
                      currentQuestion?.question ||
                      `Question ${currentIndex + 1}`}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="rounded-2xl border bg-card p-4">
                    <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
                      {currentQuestionText}
                    </p>
                  </div>

                  {/* Question Answer Area */}
                  {currentQuestion?.type === "video" ? (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Your Video Response</label>
                      <VideoRecorder
                        maxDuration={120}
                        autoInitialize={true}
                        compact={false}
                        hidePreview={true}
                        onRecordingComplete={({ blob, url, duration, mimeType }) => {
                          const questionId = currentQuestion?.id ?? currentIndex
                          uploadVideoAnswer(questionId, blob, mimeType, duration, url)
                        }}
                      />
                      {answers[currentQuestion?.id ?? currentIndex]?.upload_status && (
                        <p className="text-xs text-muted-foreground">
                          Upload status: <span className="font-medium">{answers[currentQuestion?.id ?? currentIndex]?.upload_status}</span>
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Your Answer *</label>
                      <Textarea
                        rows={8}
                        placeholder="Write your answer here..."
                        value={typeof answers[currentQuestion?.id ?? currentIndex] === "string" ? answers[currentQuestion?.id ?? currentIndex] : ""}
                        onChange={(e) =>
                          handleAnswerChange(
                            currentQuestion?.id ?? currentIndex,
                            e.target.value
                          )
                        }
                      />
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (currentIndex > 0) {
                          setCurrentIndex(currentIndex - 1)
                        }
                      }}
                      disabled={currentIndex === 0 || isSubmitting || isVideoUploading}
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>

                    <div className="text-sm text-muted-foreground">
                      {currentIndex + 1} / {questions.length}
                    </div>

                    <Button
                      type="button"
                      onClick={() => submitQuestion(true)}
                      disabled={isSubmitting || isVideoUploading}
                      className="gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : currentIndex < questions.length - 1 ? (
                        <>
                          Submit & Next
                          <ChevronRight className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Submit Exam
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p>Loading question...</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Sidebar - Camera preview + Progress */}
        <div className="space-y-4">
          {/* Camera in top right - always show for monitoring */}
          <Card className="rounded-2xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Your Camera</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <VideoRecorder
                onStateChange={setCameraState}
                maxDuration={120}
                autoInitialize={true}
                compact={true}
              />
            </CardContent>
          </Card>

          {/* Progress indicator */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Answered</span>
                  <span className="font-medium">
                    {answeredCount}/{questions.length}
                  </span>
                </div>
                <Progress value={progressValue} />
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">QUESTION NAVIGATOR</p>
                <div className="grid grid-cols-5 gap-1">
                  {questions.map((question, index) => {
                    const key = question.id ?? index
                    const answer = answers[key]
                    let isAnswered = false

                    if (question.type === "video") {
                      // For video, check if answer object has upload_status
                      isAnswered = answer && typeof answer === "object" && answer.upload_status === "uploaded"
                    } else {
                      // For text, check if not empty
                      isAnswered = answer != null && String(answer).trim() !== ""
                    }

                    const isActive = currentIndex === index

                    return (
                      <div
                        key={key}
                        className={`h-8 flex items-center justify-center rounded text-xs font-medium border transition-colors ${
                          isActive
                            ? "bg-primary text-primary-foreground border-primary"
                            : isAnswered
                            ? "bg-green-100 text-green-800 border-green-300"
                            : "bg-muted border-input"
                        }`}
                      >
                        {isAnswered ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={requestFullscreen}
              >
                <Expand className="mr-2 h-4 w-4" />
                Enter Fullscreen
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
