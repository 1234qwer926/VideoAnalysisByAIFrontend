import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { api } from "@/api/client"

function getQuestions(payload) {
  return payload?.questions || payload?.form?.questions || []
}

function getInitialAnswers(payload) {
  return (
    payload?.saved_answers ||
    payload?.answers ||
    payload?.responses ||
    {}
  )
}

function getInitialTime(payload) {
  if (payload?.remaining_seconds != null) {
    return Number(payload.remaining_seconds)
  }

  if (payload?.overall_timer != null) {
    return Number(payload.overall_timer) * 60
  }

  const questions = payload?.questions || payload?.form?.questions || []
  if (questions.length > 0) {
    const totalSeconds = questions.reduce((total, q) => {
      const time = Number(q.section_time_seconds) || Number(q.config?.section_time_seconds) || 0
      return total + time
    }, 0)
    if (totalSeconds > 0) {
      return totalSeconds
    }
  }

  return null
}

function hasAnswerChanged(a, b) {
  return JSON.stringify(a) !== JSON.stringify(b)
}

export function useExam(token) {
  const [exam, setExam] = useState(null)
  const [answers, setAnswers] = useState({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [saveError, setSaveError] = useState(null)

  const autosaveTimerRef = useRef(null)
  const latestAnswersRef = useRef({})
  const lastSavedAnswersRef = useRef({})
  const autoSubmittedRef = useRef(false)

  const questions = useMemo(() => getQuestions(exam), [exam])

  const answeredCount = useMemo(() => {
    return questions.filter((question, index) => {
      const key = question.id ?? index
      const value = answers[key]
      return value != null && String(value).trim() !== ""
    }).length
  }, [questions, answers])

  const progressValue = useMemo(() => {
    if (questions.length === 0) return 0
    return Math.round((answeredCount / questions.length) * 100)
  }, [answeredCount, questions.length])

  const fetchExam = useCallback(async () => {
    try {
      setIsLoading(true)

      const response = await api.get(`/api/candidate/exam/${token}`)
      const payload = response.data

      const initialAnswers = getInitialAnswers(payload)

      setExam(payload)
      setAnswers(initialAnswers)
      setCurrentIndex(payload?.current_question_index ?? 0)
      setTimeLeft(getInitialTime(payload))

      latestAnswersRef.current = initialAnswers
      lastSavedAnswersRef.current = initialAnswers
      setSaveError(null)
    } catch (error) {
      const message = error?.response?.data?.detail || "Failed to load exam"
      toast.error(typeof message === "string" ? message : "Failed to load exam")
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchExam()
  }, [fetchExam])

  useEffect(() => {
    latestAnswersRef.current = answers
  }, [answers])

  const saveProgress = useCallback(
    async (customAnswers = null, silent = false) => {
      const payloadAnswers = customAnswers || latestAnswersRef.current

      if (!exam) return null
      if (!hasAnswerChanged(payloadAnswers, lastSavedAnswersRef.current)) {
        return null
      }

      try {
        setIsSaving(true)
        setSaveError(null)

        const response = await api.post(`/api/candidate/exam/${token}/save`, {
          answers: payloadAnswers,
          current_question_index: currentIndex,
        })

        lastSavedAnswersRef.current = payloadAnswers

        if (!silent) {
          toast.success("Progress saved")
        }

        return response.data
      } catch (error) {
        const message = error?.response?.data?.detail || "Failed to save progress"
        setSaveError(message)
        if (!silent) {
          toast.error(typeof message === "string" ? message : "Failed to save progress")
        }
        return null
      } finally {
        setIsSaving(false)
      }
    },
    [exam, token, currentIndex]
  )

  useEffect(() => {
    if (!exam) return

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current)
    }

    autosaveTimerRef.current = setTimeout(() => {
      saveProgress(latestAnswersRef.current, true)
    }, 1500)

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current)
      }
    }
  }, [answers, exam, saveProgress])

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

  const submitExam = useCallback(
    async ({ autoSubmit = false } = {}) => {
      if (!exam || isSubmitting) return null

      try {
        setIsSubmitting(true)

        await saveProgress(latestAnswersRef.current, true)

        const response = await api.post(`/api/candidate/exam/${token}/submit`, {
          answers: latestAnswersRef.current,
          auto_submitted: autoSubmit,
        })

        if (!autoSubmit) {
          toast.success("Exam submitted")
        }

        return response.data
      } catch (error) {
        const message = error?.response?.data?.detail || "Failed to submit exam"
        toast.error(typeof message === "string" ? message : "Failed to submit exam")
        return null
      } finally {
        setIsSubmitting(false)
      }
    },
    [exam, isSubmitting, saveProgress, token]
  )

  useEffect(() => {
    if (timeLeft !== 0 || autoSubmittedRef.current) return

    autoSubmittedRef.current = true

    ;(async () => {
      const result = await submitExam({ autoSubmit: true })
      if (result) {
        toast.success("Time is up. Exam submitted automatically")
      }
    })()
  }, [timeLeft, submitExam])

  const setAnswer = useCallback((questionKey, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionKey]: value,
    }))
  }, [])

  const goToQuestion = useCallback(
    (index) => {
      setCurrentIndex(Math.max(0, Math.min(index, questions.length - 1)))
    },
    [questions.length]
  )

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1))
  }, [questions.length])

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0))
  }, [])

  const currentQuestion = questions[currentIndex] || null

  return {
    exam,
    questions,
    currentQuestion,
    currentIndex,
    answers,
    timeLeft,
    answeredCount,
    progressValue,
    isLoading,
    isSaving,
    isSubmitting,
    saveError,
    setAnswer,
    setCurrentIndex: goToQuestion,
    goToNext,
    goToPrevious,
    saveProgress,
    submitExam,
    refetchExam: fetchExam,
  }
}