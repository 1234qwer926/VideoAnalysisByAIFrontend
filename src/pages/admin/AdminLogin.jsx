import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Loader2, LockKeyhole } from "lucide-react"
import { toast } from "sonner"

import { api } from "@/api/client"
import useAuthStore from "@/store/authStore"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function AdminLogin() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.email || !formData.password) {
      toast.error("Email and password are required")
      return
    }

    try {
      setIsSubmitting(true)

      const response = await api.post("/api/admin/auth/login", {
        email: formData.email,
        password: formData.password,
      })

      const token =
        response?.data?.token ||
        response?.data?.access_token ||
        response?.data?.accessToken

      if (!token) {
        toast.error("Login succeeded but token was not returned")
        return
      }

      login({
        token,
        role: "admin",
        user: response?.data?.user || {
          email: formData.email,
          role: "admin",
        },
      })

      toast.success("Admin login successful")
      navigate("/admin/dashboard", { replace: true })
    } catch (error) {
      const message = error?.response?.data?.detail || "Login failed"
      toast.error(typeof message === "string" ? message : "Login failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F3F4F6] px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-[#F3F4F6] text-[#3B82F6]">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-2xl">Admin Login</CardTitle>
            <CardDescription className="mt-1">
              Sign in to manage forms, assignments, and results.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@example.com"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Candidate login?{" "}
              <Link
                to="/candidate/login"
                className="font-medium text-[#3B82F6] hover:underline"
              >
                Go to candidate portal
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
