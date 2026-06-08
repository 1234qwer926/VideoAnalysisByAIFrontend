import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Expand,
  Loader2,
  Send,
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

import { api } from "@/api/client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
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
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

export default function ExamPage() {
  const { token } = useParams()
  const navigate = useNavigate()

  const [exam, setExam] = useState(null)
  const [answers, setAnswers] = useState({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(null)
  const [sectionTimeLeft, setSectionTimeLeft] = useState(null)
  const [questionTimeLeft, setQuestionTimeLeft] = useState(null)

  const [showInstructions, setShowInstructions] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVideoUploading, setIsVideoUploading] = useState(false)
  const [cameraState, setCameraState] = useState({ recordingState: "idle", hasPreview: false })
  // autoSubmitPending: waiting for video upload to finish before auto-advancing
  const [autoSubmitPending, setAutoSubmitPending] = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)

  const videoRecorderRef = useRef(null)
  // Guards against concurrent submissions; always reset in finally blocks
  const submitInFlightRef = useRef(false)
  // Stable ref so timer effects can call the latest handleSubmitExam without stale closures
  const handleSubmitExamRef = useRef(null)

  // ─── Derived data ────────────────────────────────────────────────────────────

  const questions = useMemo(() => {
    if (!exam) return []
    return exam.questions || exam.form?.questions || []
  }, [exam])

  const sections = useMemo(() => exam?.sections || [], [exam])

  const currentSection = useMemo(() => {
    return (
      sections.find(
        (s) => currentIndex >= s.start_index && currentIndex <= s.end_index
      ) || null
    )
  }, [sections, currentIndex])

  const currentQuestion = questions[currentIndex]

  const answeredCount = useMemo(() => {
    return questions.filter((question, index) => {
      const key = question.id ?? index
      const value = answers[key]
      if (question.type === "video") {
        return value && typeof value === "object" && value.upload_status === "uploaded"
      }
      return value != null && String(value).trim() !== ""
    }).length
  }, [questions, answers])

  const progressValue =
    questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0

  // ─── Fetch exam ──────────────────────────────────────────────────────────────

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
        } else if (payload?.assignment?.overall_timer_minutes != null) {
          setTimeLeft(Number(payload.assignment.overall_timer_minutes) * 60)
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

  // ─── Submit exam (final) ─────────────────────────────────────────────────────

  /**
   * FIX #1 & #3: Wrapped in useCallback so the ref stays stable and stale
   * closure issues in timer effects are eliminated.  The ref is updated every
   * render so effects that call handleSubmitExamRef.current always get the
   * latest version without needing it in their dependency arrays.
   */
  const handleSubmitExam = useCallback(
    async (answersOverride = null, autoSubmitted = false) => {
      if (!exam) return
      // Guard: only one submission in flight at a time
      if (submitInFlightRef.current) return

      try {
        submitInFlightRef.current = true
        setIsSubmitting(true)

        const sourceAnswers = answersOverride || answers
        const responses = Object.entries(sourceAnswers).map(([questionId, answer]) => {
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
          is_auto_submitted: autoSubmitted,
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
        toast.error(typeof message === "string" ? message : "Failed to submit exam")
        // FIX #3: Always release the lock — even on error
        submitInFlightRef.current = false
        setIsSubmitting(false)
      }
      // NOTE: we intentionally do NOT release submitInFlightRef on success
      // because navigation will unmount the component anyway.
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [exam, answers, token, navigate]
  )

  // Keep the ref in sync with the latest callback
  useEffect(() => {
    handleSubmitExamRef.current = handleSubmitExam
  }, [handleSubmitExam])

  // ─── Submit / advance question ────────────────────────────────────────────────

  /**
   * FIX #2: On the last question with forceSubmit=false, we now trigger the
   * confirmation dialog instead of silently saving and doing nothing.
   * FIX #3: submitInFlightRef is always released in the finally block.
   */
  const submitQuestion = useCallback(
    async (moveToNext = true, forceSubmit = false) => {
      if (!exam || !currentQuestion) return
      if (submitInFlightRef.current) return
      if (isVideoUploading) {
        toast.error("Please wait for the video upload to finish before continuing.")
        return
      }

      const questionKey = currentQuestion?.id ?? currentIndex
      let answer = answers[questionKey]
      let nextAnswers = answers
      const isVideoQuestion = currentQuestion?.type === "video"

      // ── Validate ────────────────────────────────────────────────────────────
      if (isVideoQuestion) {
        if (!answer || typeof answer !== "object" || (!answer.s3_key && !answer.blob)) {
          if (!forceSubmit) {
            toast.error("Please record a video answer before submitting.")
            return
          }
          answer = null
        }

        // ── Upload pending video blob ────────────────────────────────────────
        if (answer && answer.upload_status === "pending" && answer.blob) {
          try {
            setIsVideoUploading(true)
            const formData = new FormData()
            const ext = answer.mime_type === "video/mp4" ? ".mp4" : ".webm"
            formData.append("file", answer.blob, `q${questionKey}${ext}`)

            const uploadResponse = await api.post(
              `/api/exam/upload-video?token=${token}&question_id=${Number(questionKey)}`,
              formData,
              { headers: { "Content-Type": "multipart/form-data" } }
            )

            const s3Key = uploadResponse?.data?.s3_key
            if (!s3Key) throw new Error("Missing S3 key from upload response")

            answer = { ...answer, upload_status: "uploaded", s3_key: s3Key }
            nextAnswers = { ...answers, [questionKey]: answer }
            setAnswers(nextAnswers)
          } catch (error) {
            if (!forceSubmit) {
              const message =
                error?.response?.data?.detail || error?.message || "Video upload failed"
              toast.error(typeof message === "string" ? message : "Video upload failed")
              // FIX #3: release flag before returning on upload error
              setIsVideoUploading(false)
              return
            }
          } finally {
            setIsVideoUploading(false)
          }
        }
      } else {
        if (!forceSubmit && (answer == null || String(answer).trim() === "")) {
          toast.error("Please answer the question before submitting.")
          return
        }
      }

      // ── Save progress ────────────────────────────────────────────────────────
      try {
        submitInFlightRef.current = true
        setIsSubmitting(true)

        await api.post(`/api/exam/save?token=${token}`, {
          answers: nextAnswers,
          current_question_index: moveToNext ? currentIndex + 1 : currentIndex,
        })

        toast.success("Progress saved!")

        if (moveToNext) {
          if (currentIndex < questions.length - 1) {
            setQuestionTimeLeft(null)
            setCurrentIndex((prev) => prev + 1)
          } else {
            // Last question: trigger full exam submission
            // FIX #2: release the guard so handleSubmitExam can acquire it
            submitInFlightRef.current = false
            setIsSubmitting(false)
            await handleSubmitExamRef.current(nextAnswers, forceSubmit)
            return
          }
        }
      } catch (error) {
        const message = error?.response?.data?.detail || "Failed to save progress"
        toast.error(typeof message === "string" ? message : "Failed to save progress")
      } finally {
        submitInFlightRef.current = false
        setIsSubmitting(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [exam, currentQuestion, currentIndex, answers, questions.length, isVideoUploading, token]
  )

  // ─── Overall timer ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (timeLeft == null || timeLeft <= 0 || isSubmitting || isVideoUploading) return

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
  }, [timeLeft, isSubmitting, isVideoUploading])

  /**
   * FIX #1: Use the ref instead of handleSubmitExam directly so we never
   * capture a stale closure.  exam and isSubmitting are intentionally omitted
   * from deps — we only want this to fire when timeLeft hits 0.
   */
  useEffect(() => {
    if (timeLeft === 0) {
      handleSubmitExamRef.current?.(undefined, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft])

  // ─── Section timer ───────────────────────────────────────────────────────────

  /**
   * FIX #4: Use section ID (or a composite key) rather than name+duration to
   * detect section changes, so sections sharing the same name/duration still
   * reset the timer correctly.
   */
  const sectionKey = currentSection
    ? `${currentSection.start_index}-${currentSection.end_index}`
    : null

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
  }, [sectionKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (sectionTimeLeft == null || sectionTimeLeft <= 0 || isSubmitting || isVideoUploading) return

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
  }, [sectionTimeLeft, isSubmitting, isVideoUploading])

  useEffect(() => {
    if (sectionTimeLeft === 0) {
      setSectionTimeLeft(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionTimeLeft])

  // ─── Per-question timer ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!currentQuestion) {
      setQuestionTimeLeft(null)
      return
    }
    const qSeconds =
      Number(currentQuestion.section_time_seconds) ||
      Number(currentQuestion.config?.section_time_seconds)
    if (!Number.isFinite(qSeconds) || qSeconds <= 0) {
      setQuestionTimeLeft(null)
      return
    }
    setQuestionTimeLeft(qSeconds)
  }, [currentQuestion?.id, currentIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (questionTimeLeft == null || questionTimeLeft <= 0 || isSubmitting || isVideoUploading) return

    const interval = setInterval(() => {
      setQuestionTimeLeft((prev) => {
        if (prev == null) return prev
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [questionTimeLeft, isSubmitting, isVideoUploading])

  useEffect(() => {
    if (questionTimeLeft !== 0 || isSubmitting || isVideoUploading) return

    toast.error("Time is up for this question.")

    if (currentQuestion?.type === "video" && videoRecorderRef.current?.isRecording()) {
      // Signal that once recording stops we should auto-advance
      setAutoSubmitPending(true)
      videoRecorderRef.current.stopRecording()
    } else {
      submitQuestion(true, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionTimeLeft])

  /**
   * FIX #5: Only fire autoSubmit once the video upload_status has changed to
   * "uploaded" (not while it is still "pending").
   */
  useEffect(() => {
    if (!autoSubmitPending) return

    const questionKey = currentQuestion?.id ?? currentIndex
    const answer = answers[questionKey]

    // Wait until the blob has been committed (VideoRecorder sets upload_status="pending"
    // when recording is complete; we wait for the recorder to hand us the blob)
    if (answer && answer.upload_status === "pending" && answer.blob) {
      setAutoSubmitPending(false)
      submitQuestion(true, true)
    }
  }, [answers, autoSubmitPending, currentQuestion, currentIndex, submitQuestion])

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const handleAnswerChange = (questionKey, value) => {
    setAnswers((prev) => ({ ...prev, [questionKey]: value }))
  }

  const logProctorEvent = async (type, detail) => {
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

  const requestFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      }
    } catch {
      toast.error("Unable to enter fullscreen mode.")
    }
  }

  // ─── Proctoring ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        logProctorEvent("tab_switch", "You switched tabs or minimized the window.")
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange)
    return () => document.removeEventListener("visibilitychange", onVisibilityChange)
  }, [currentIndex, token]) // eslint-disable-line react-hooks/exhaustive-deps

  // Warn before accidental navigation away
  useEffect(() => {
    if (showInstructions) return

    const handleBeforeUnload = (e) => {
      e.preventDefault()
      e.returnValue = "You have an ongoing exam. Are you sure you want to leave?"
      return e.returnValue
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [showInstructions])

  // ─── Render guards ────────────────────────────────────────────────────────────

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
      <Card className="mx-auto max-w-3xl">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 rounded-lg bg-gray-100 p-3 text-gray-500">
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

  if (showInstructions) {
    return (
      <div className="py-8">
        <ExamInstructions exam={exam} onStartExam={() => setShowInstructions(false)} />
      </div>
    )
  }

  const currentQuestionText =
    currentQuestion?.prompt ||
    currentQuestion?.description ||
    currentQuestion?.text ||
    currentQuestion?.question_text ||
    "Answer the question below."

  const questionKey = currentQuestion?.id ?? currentIndex

  // ─── Main render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background space-y-6 pb-8">
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold">{exam.title || "Assessment"}</h1>
              <p className="text-sm text-muted-foreground">
                Question {currentIndex + 1} of {questions.length}
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Section timer */}
              {sectionTimeLeft != null && currentSection && (
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm ${sectionTimeLeft < 60
                      ? "border-red-300 bg-red-50 text-red-700"
                      : "border-amber-300 bg-amber-50 text-amber-700"
                    }`}
                >
                  <Clock3 className="h-3.5 w-3.5" />
                  <span className="font-medium">
                    Section: {formatTime(sectionTimeLeft)}
                  </span>
                </div>
              )}

              {/* Overall timer */}
              {timeLeft != null && (
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${timeLeft < 120
                      ? "border-red-300 bg-red-50 text-red-700"
                      : "bg-muted/30"
                    }`}
                >
                  <Clock3 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{formatTime(timeLeft)}</span>
                </div>
              )}
            </div>
          </div>

          <Progress value={progressValue} className="mt-4" />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Main question card ── */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            {currentQuestion ? (
              <>
                <CardHeader className="space-y-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <Badge variant="secondary">
                      {currentQuestion?.type || "text"}
                    </Badge>

                    {currentSection && (
                      <Badge variant="outline">Section: {currentSection.name}</Badge>
                    )}

                    {/* Per-question timer badge */}
                    {questionTimeLeft != null && (
                      <Badge
                        variant={questionTimeLeft < 30 ? "destructive" : "outline"}
                        className="flex items-center gap-1"
                      >
                        <Clock3 className="h-3 w-3" />
                        {formatTime(questionTimeLeft)} left for this question
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
                  <div className="rounded-lg border border-[#E5E7EB] bg-white p-4">
                    <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
                      {currentQuestionText}
                    </p>
                  </div>

                  {/* Answer area */}
                  {currentQuestion?.type === "video" ? (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Your Video Response</label>
                      <VideoRecorder
                        ref={videoRecorderRef}
                        maxDuration={120}
                        autoInitialize={true}
                        compact={false}
                        hidePreview={true}
                        onRecordingComplete={({ blob, url, duration, mimeType }) => {
                          handleAnswerChange(questionKey, {
                            type: "video",
                            upload_status: "pending",
                            preview_url: url,
                            blob,
                            duration,
                            mime_type: mimeType,
                          })
                        }}
                      />
                      {answers[questionKey]?.upload_status && (
                        <p className="text-xs text-muted-foreground">
                          Upload status:{" "}
                          <span className="font-medium capitalize">
                            {answers[questionKey].upload_status}
                          </span>
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Your Answer *</label>
                      <Textarea
                        rows={8}
                        placeholder="Write your answer here..."
                        value={
                          typeof answers[questionKey] === "string"
                            ? answers[questionKey]
                            : ""
                        }
                        onChange={(e) => handleAnswerChange(questionKey, e.target.value)}
                      />
                    </div>
                  )}

                  {/* Navigation / submit buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (currentIndex > 0) setCurrentIndex((prev) => prev - 1)
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
                      onClick={() => {
                        if (currentIndex === questions.length - 1) {
                          // FIX #9: Ensure any pending video for the last question
                          // is uploaded before showing the confirm dialog.
                          // The dialog's confirm handler calls handleSubmitExam which
                          // receives the current (possibly updated) answers snapshot.
                          setShowSubmitConfirm(true)
                        } else {
                          submitQuestion(true)
                        }
                      }}
                      disabled={isSubmitting || isVideoUploading}
                      className="gap-2"
                    >
                      {isSubmitting || isVideoUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {isVideoUploading ? "Uploading video..." : "Submitting..."}
                        </>
                      ) : currentIndex < questions.length - 1 ? (
                        <>
                          Submit &amp; Next
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

        {/* ── Sidebar ── */}
        <div className="space-y-4">
          {/* Camera preview — monitoring only, separate instance from question recorder */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Your Camera</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <VideoRecorder
                onStateChange={setCameraState}
                maxDuration={120}
                autoInitialize={true}
                compact={true}
                previewOnly={true}
              />
            </CardContent>
          </Card>

          {/* Progress */}
          <Card>
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
                <p className="text-xs font-medium text-muted-foreground">
                  QUESTION NAVIGATOR
                </p>
                <div className="grid grid-cols-5 gap-1">
                  {questions.map((question, index) => {
                    const key = question.id ?? index
                    const answer = answers[key]
                    const isAnswered =
                      question.type === "video"
                        ? answer &&
                        typeof answer === "object" &&
                        answer.upload_status === "uploaded"
                        : answer != null && String(answer).trim() !== ""
                    const isActive = currentIndex === index

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setCurrentIndex(index)}
                        className={`h-8 flex items-center justify-center rounded text-xs font-medium border transition-colors ${isActive
                            ? "bg-primary text-primary-foreground border-primary"
                            : isAnswered
                              ? "bg-green-100 text-green-800 border-green-300"
                              : "bg-muted border-input hover:bg-muted/70"
                          }`}
                      >
                        {isAnswered ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </button>
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

      {/* ── Submit confirmation dialog ── */}
      <Dialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Exam?</DialogTitle>
            <DialogDescription asChild>
              <div>
                <p>
                  You are about to submit your exam. Once submitted, you cannot make
                  any changes.
                </p>
                <p className="mt-3">
                  <strong>Questions Answered:</strong> {answeredCount} /{" "}
                  {questions.length}
                  <br />
                  <strong>Unanswered:</strong> {questions.length - answeredCount}
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowSubmitConfirm(false)}
              disabled={isSubmitting || isVideoUploading}
            >
              Cancel
            </Button>
            {/*
              FIX #9: Run submitQuestion for the current (last) question first so
              any pending video is uploaded, then handleSubmitExam is called
              internally once the save succeeds.
            */}
            <Button
              onClick={async () => {
                setShowSubmitConfirm(false)
                await submitQuestion(true, false)
              }}
              disabled={isSubmitting || isVideoUploading}
            >
              {isSubmitting || isVideoUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isVideoUploading ? "Uploading..." : "Submitting..."}
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Confirm Submit
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}