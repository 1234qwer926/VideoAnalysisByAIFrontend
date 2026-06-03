import { useEffect, useState } from "react"
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Loader2,
  Mic,
  Monitor,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function ExamInstructions({ exam, onStartExam }) {
  const [permissionState, setPermissionState] = useState("idle")
  const [cameraStatus, setCameraStatus] = useState(null)
  const [microphoneStatus, setMicrophoneStatus] = useState(null)
  const [isRequestingPermission, setIsRequestingPermission] = useState(false)

  const requestPermissions = async () => {
    try {
      setIsRequestingPermission(true)
      setPermissionState("loading")

      // Request camera and microphone permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })

      // Stop the stream - we just needed to request permissions
      stream.getTracks().forEach((track) => track.stop())

      setCameraStatus("granted")
      setMicrophoneStatus("granted")
      setPermissionState("granted")
      toast.success("Camera and microphone access granted!")
    } catch (error) {
      const message = error?.message || "Permission denied"

      if (message.includes("camera") || message.includes("camera")) {
        setCameraStatus("denied")
      } else if (message.includes("microphone") || message.includes("audio")) {
        setMicrophoneStatus("denied")
      } else {
        setCameraStatus("denied")
        setMicrophoneStatus("denied")
      }

      setPermissionState("denied")
      toast.error("Camera or microphone permission was denied. Please enable in your browser settings.")
    } finally {
      setIsRequestingPermission(false)
    }
  }

  const canStartExam = permissionState === "granted"

  return (
    <div className="mx-auto max-w-4xl">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">
            {exam?.title || "Assessment"}
          </CardTitle>
          <CardDescription>
            Please review the instructions below before starting the exam.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Instructions Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Exam Instructions</h3>
            <div className="rounded-lg border bg-card p-4 space-y-3 text-sm">
              <p>
                <strong>Duration:</strong>{" "}
                {exam?.overall_timer ? `${exam.overall_timer} minutes` : "Not specified"}
              </p>

              <div>
                <strong>Questions:</strong> Total of{" "}
                {exam?.questions?.length || 0} questions
              </div>

              <div className="space-y-2">
                <strong>Important Guidelines:</strong>
                <ul className="space-y-2 ml-4 list-disc text-muted-foreground">
                  <li>
                    Answer each question completely. All questions are mandatory.
                  </li>
                  <li>
                    Your camera and microphone must be enabled for the entire exam.
                  </li>
                  <li>
                    For video questions, click "Start Recording" when you're ready
                    to begin your response.
                  </li>
                  <li>
                    After recording, your video will be uploaded to the server before
                    moving to the next question.
                  </li>
                  <li>
                    Do not leave the exam page or switch to other applications during
                    the exam.
                  </li>
                  <li>
                    Ensure you have a stable internet connection throughout the exam.
                  </li>
                  <li>
                    Your camera feed will be displayed in the top-right corner of the
                    exam page.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Permissions Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Device Requirements</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <Camera className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Camera Access</span>
                </div>
                <Badge
                  variant={
                    cameraStatus === "granted"
                      ? "default"
                      : cameraStatus === "denied"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {cameraStatus === "granted" && (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Granted
                    </span>
                  )}
                  {cameraStatus === "denied" && "Denied"}
                  {!cameraStatus && "Pending"}
                </Badge>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <Mic className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Microphone Access</span>
                </div>
                <Badge
                  variant={
                    microphoneStatus === "granted"
                      ? "default"
                      : microphoneStatus === "denied"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {microphoneStatus === "granted" && (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Granted
                    </span>
                  )}
                  {microphoneStatus === "denied" && "Denied"}
                  {!microphoneStatus && "Pending"}
                </Badge>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <Monitor className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Browser Support</span>
                </div>
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Supported
                </Badge>
              </div>
            </div>

            {permissionState === "idle" && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 flex gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Camera and microphone permissions required</p>
                  <p className="text-xs mt-1">
                    You'll be prompted to allow access. Please allow these permissions to proceed.
                  </p>
                </div>
              </div>
            )}

            {permissionState === "denied" && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-medium">Permissions were denied</p>
                  <p className="text-xs mt-1">
                    Please enable camera and microphone access in your browser settings and try again.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            <Button
              size="lg"
              onClick={requestPermissions}
              disabled={isRequestingPermission || permissionState === "granted"}
            >
              {isRequestingPermission ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Requesting Access...
                </>
              ) : permissionState === "granted" ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Access Granted
                </>
              ) : (
                "Request Camera & Microphone Access"
              )}
            </Button>

            <Button
              size="lg"
              variant="default"
              onClick={onStartExam}
              disabled={!canStartExam}
            >
              Start Exam
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
