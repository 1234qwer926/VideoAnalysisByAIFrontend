import { useEffect, useRef, useState } from "react"
import {
  Camera,
  Loader2,
  Mic,
  RefreshCw,
  Square,
  Video,
  VideoOff,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

function getSupportedMimeType() {
  const mimeTypes = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ]

  for (const type of mimeTypes) {
    if (window.MediaRecorder?.isTypeSupported?.(type)) {
      return type
    }
  }

  return ""
}

export default function VideoRecorder({
  onRecordingComplete,
  onStateChange,
  maxDuration = 120,
  autoStart = false,
  autoInitialize = true,
  compact = false,
  hidePreview = false,
}) {
  const videoRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const mediaStreamRef = useRef(null)
  const chunksRef = useRef([])
  const stopTimeoutRef = useRef(null)

  const [permissionState, setPermissionState] = useState("idle")
  const [recordingState, setRecordingState] = useState("idle")
  const [previewUrl, setPreviewUrl] = useState("")
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [errorMessage, setErrorMessage] = useState("")

  // Notify parent of state changes
  useEffect(() => {
    if (onStateChange) {
      onStateChange({ recordingState, hasPreview: !!previewUrl })
    }
  }, [recordingState, previewUrl, onStateChange])

  useEffect(() => {
    let interval

    if (recordingState === "recording") {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [recordingState])

  useEffect(() => {
    if (recordingState === "recording" && maxDuration > 0) {
      stopTimeoutRef.current = setTimeout(() => {
        handleStopRecording()
      }, maxDuration * 1000)
    }

    return () => {
      if (stopTimeoutRef.current) {
        clearTimeout(stopTimeoutRef.current)
      }
    }
  }, [recordingState, maxDuration])

  useEffect(() => {
    if (autoInitialize) {
      initializeMedia(autoStart)
    }

    return () => {
      cleanupMedia()
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [])

  const cleanupMedia = () => {
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current?.stop?.()
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current)
    }
  }

  const initializeMedia = async (shouldAutoStart = false) => {
    try {
      setPermissionState("loading")
      setErrorMessage("")

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl("")
      }

      cleanupMedia()

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })

      mediaStreamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.muted = true
        await videoRef.current.play().catch(() => {})
      }

      setPermissionState("granted")
      setRecordingState("ready")
      setElapsedSeconds(0)

      if (shouldAutoStart) {
        startRecording(stream)
      }
    } catch (error) {
      const message =
        error?.message || "Camera or microphone permission was denied"

      setPermissionState("denied")
      setRecordingState("idle")
      setErrorMessage(message)
      toast.error("Unable to access camera and microphone")
    }
  }

  const startRecording = (providedStream = null) => {
    try {
      const stream = providedStream || mediaStreamRef.current

      if (!stream) {
        toast.error("Media stream is not ready")
        return
      }

      chunksRef.current = []
      setElapsedSeconds(0)

      const mimeType = getSupportedMimeType()
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const finalMimeType = mimeType || "video/webm"
        const blob = new Blob(chunksRef.current, { type: finalMimeType })
        const url = URL.createObjectURL(blob)

        if (previewUrl) {
          URL.revokeObjectURL(previewUrl)
        }

        setPreviewUrl(url)
        setRecordingState("stopped")

        if (typeof onRecordingComplete === "function") {
          onRecordingComplete({
            blob,
            url,
            mimeType: finalMimeType,
            duration: elapsedSeconds,
          })
        }
      }

      recorder.onerror = () => {
        setRecordingState("idle")
        toast.error("Recording failed")
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setRecordingState("recording")
      toast.success("Recording started")
    } catch (error) {
      setRecordingState("idle")
      setErrorMessage(error?.message || "Failed to start recording")
      toast.error("Failed to start recording")
    }
  }

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }

    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current)
    }
  }

  const handleRetake = async () => {
    setPreviewUrl("")
    setElapsedSeconds(0)
    await initializeMedia(false)
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  if (compact) {
    return (
      <div className="flex flex-col gap-2">
        {!hidePreview && (
          <div className="overflow-hidden rounded-lg border bg-black aspect-video">
            {previewUrl && recordingState === "stopped" ? (
              <video
                src={previewUrl}
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            )}
          </div>
        )}

        <div className="space-y-2">
          {permissionState === "granted" && recordingState !== "recording" && (
            <Button 
              size="sm" 
              onClick={() => startRecording()}
              className="w-full"
            >
              <Video className="mr-2 h-3.5 w-3.5" />
              Start Recording
            </Button>
          )}

          {recordingState === "recording" && (
            <Button 
              size="sm"
              variant="destructive" 
              onClick={handleStopRecording}
              className="w-full"
            >
              <Square className="mr-2 h-3.5 w-3.5" />
              Stop ({formatDuration(elapsedSeconds)})
            </Button>
          )}

          {(recordingState === "stopped" || previewUrl) && !recordingState === "recording" && (
            <Button 
              size="sm"
              variant="outline" 
              onClick={handleRetake}
              className="w-full"
            >
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              Retake
            </Button>
          )}
        </div>

        {errorMessage && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
            {errorMessage}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Video Recorder</CardTitle>
        <CardDescription>
          Record your response using camera and microphone access.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {!hidePreview && (
          <div className="overflow-hidden rounded-2xl border bg-black">
            {previewUrl && recordingState === "stopped" ? (
              <video
                src={previewUrl}
                controls
                className="aspect-video w-full"
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="aspect-video w-full"
              />
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={permissionState === "granted" ? "default" : "outline"}>
            <Camera className="mr-1 h-3.5 w-3.5" />
            {permissionState === "loading"
              ? "Requesting access"
              : permissionState === "granted"
              ? "Camera ready"
              : permissionState === "denied"
              ? "Permission denied"
              : "Not initialized"}
          </Badge>

          <Badge variant={recordingState === "recording" ? "destructive" : "secondary"}>
            <Mic className="mr-1 h-3.5 w-3.5" />
            {recordingState === "recording"
              ? `Recording ${formatDuration(elapsedSeconds)}`
              : recordingState}
          </Badge>
        </div>

        {errorMessage ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {permissionState !== "granted" && (
            <Button onClick={() => initializeMedia(false)} disabled={permissionState === "loading"}>
              {permissionState === "loading" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Requesting...
                </>
              ) : (
                <>
                  <Video className="mr-2 h-4 w-4" />
                  Enable Camera
                </>
              )}
            </Button>
          )}

          {permissionState === "granted" && recordingState !== "recording" && (
            <Button onClick={() => startRecording()}>
              <Video className="mr-2 h-4 w-4" />
              Start Recording
            </Button>
          )}

          {recordingState === "recording" && (
            <Button variant="destructive" onClick={handleStopRecording}>
              <Square className="mr-2 h-4 w-4" />
              Stop Recording
            </Button>
          )}

          {(recordingState === "stopped" || previewUrl) && (
            <Button variant="outline" onClick={handleRetake}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retake
            </Button>
          )}

          <Button variant="ghost" onClick={cleanupMedia}>
            <VideoOff className="mr-2 h-4 w-4" />
            Release Devices
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Maximum duration: {maxDuration} seconds. Your recording preview appears after stopping.
        </p>
      </CardContent>
    </Card>
  )
}