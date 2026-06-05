import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Loader2, ShieldCheck, CheckCircle2, Video, Brain, Award } from "lucide-react"
import { toast } from "sonner"
import { GoogleLogin } from "@react-oauth/google"

import { api } from "@/api/client"
import useAuthStore from "@/store/authStore"

const features = [
  {
    icon: Video,
    title: "Video Assessments",
    desc: "Record and submit video responses with ease",
  },
  {
    icon: Brain,
    title: "AI-Powered Evaluation",
    desc: "Get instant, unbiased AI analysis of your answers",
  },
  {
    icon: Award,
    title: "Detailed Results",
    desc: "View comprehensive feedback and scoring breakdowns",
  },
]

export default function CandidateLogin() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setIsSubmitting(true)
      const googleToken = credentialResponse.credential

      const response = await api.post("/api/candidate/auth/google-login", {
        token: googleToken,
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
        role: "candidate",
        user: response?.data?.user || {
          email: response?.data?.email,
          role: "candidate",
        },
      })

      toast.success("Google login successful")
      navigate("/candidate/dashboard", { replace: true })
    } catch (error) {
      const message = error?.response?.data?.detail || "Google login failed"
      toast.error(typeof message === "string" ? message : "Google login failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleError = () => {
    toast.error("Google Login failed to initialize")
  }

  return (
    <div className="candidate-login-page">
      {/* Left Panel - Branding */}
      <div className="candidate-login-left">
        <div className="candidate-login-left-content">
          <div className="candidate-login-logo">
            <div className="candidate-login-logo-icon">
              <ShieldCheck size={28} />
            </div>
            <span className="candidate-login-logo-text">PulseLMS</span>
          </div>

          <div className="candidate-login-hero">
            <h1 className="candidate-login-hero-title">
              Your Assessment<br />Portal
            </h1>
            <p className="candidate-login-hero-subtitle">
              Access your assignments, record video responses, and track your results — all in one place.
            </p>
          </div>

          <div className="candidate-login-features">
            {features.map((f, i) => (
              <div key={i} className="candidate-login-feature">
                <div className="candidate-login-feature-icon">
                  <f.icon size={20} />
                </div>
                <div>
                  <div className="candidate-login-feature-title">{f.title}</div>
                  <div className="candidate-login-feature-desc">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="candidate-login-decor-1" />
        <div className="candidate-login-decor-2" />
      </div>

      {/* Right Panel - Login */}
      <div className="candidate-login-right">
        <div className="candidate-login-card">
          <div className="candidate-login-card-header">
            <div className="candidate-login-card-badge">
              <CheckCircle2 size={16} />
              <span>Secure Sign-In</span>
            </div>
            <h2 className="candidate-login-card-title">Welcome, Candidate</h2>
            <p className="candidate-login-card-desc">
              Sign in with your Google account to access your assigned exams and view results.
            </p>
          </div>

          <div className="candidate-login-card-body">
            {isSubmitting ? (
              <div className="candidate-login-loading">
                <div className="candidate-login-spinner">
                  <Loader2 className="animate-spin" size={24} />
                </div>
                <span>Verifying your account...</span>
              </div>
            ) : (
              <div className="candidate-login-google-wrapper">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  shape="rectangular"
                  theme="outline"
                  size="large"
                  text="signin_with"
                />
              </div>
            )}

            <div className="candidate-login-divider">
              <span>Only registered candidates can sign in</span>
            </div>

            <div className="candidate-login-info-box">
              <ShieldCheck size={16} />
              <p>
                Your sign-in is verified against the assignment email list.
                If you're not registered, contact your administrator.
              </p>
            </div>
          </div>

          <div className="candidate-login-card-footer">
            <span>Are you an administrator?</span>
            <Link to="/admin/login" className="candidate-login-admin-link">
              Go to Admin Portal →
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        .candidate-login-page {
          display: flex;
          min-height: 100vh;
          font-family: 'Inter', 'Segoe UI', sans-serif;
        }

        /* ── Left Panel ── */
        .candidate-login-left {
          position: relative;
          display: none;
          flex: 1;
          background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #3b82f6 100%);
          color: #fff;
          overflow: hidden;
        }

        @media (min-width: 900px) {
          .candidate-login-left {
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }

        .candidate-login-left-content {
          position: relative;
          z-index: 2;
          padding: 48px;
          max-width: 500px;
        }

        .candidate-login-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 48px;
        }

        .candidate-login-logo-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          background: rgba(255,255,255,0.15);
          border-radius: 12px;
          backdrop-filter: blur(8px);
        }

        .candidate-login-logo-text {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .candidate-login-hero-title {
          font-size: 38px;
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -1px;
          margin: 0 0 16px;
        }

        .candidate-login-hero-subtitle {
          font-size: 16px;
          line-height: 1.6;
          opacity: 0.85;
          margin: 0 0 40px;
        }

        .candidate-login-features {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .candidate-login-feature {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }

        .candidate-login-feature-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          min-width: 40px;
          background: rgba(255,255,255,0.12);
          border-radius: 10px;
          backdrop-filter: blur(8px);
        }

        .candidate-login-feature-title {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 2px;
        }

        .candidate-login-feature-desc {
          font-size: 13px;
          opacity: 0.75;
          line-height: 1.4;
        }

        /* Decorative Blobs */
        .candidate-login-decor-1 {
          position: absolute;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
          top: -80px;
          right: -60px;
        }

        .candidate-login-decor-2 {
          position: absolute;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: rgba(255,255,255,0.04);
          bottom: -40px;
          left: -40px;
        }

        /* ── Right Panel ── */
        .candidate-login-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 24px;
          background: #f8f9fb;
        }

        .candidate-login-card {
          width: 100%;
          max-width: 420px;
          background: #fff;
          border-radius: 16px;
          box-shadow:
            0 1px 3px rgba(0,0,0,0.04),
            0 8px 32px rgba(0,0,0,0.06);
          overflow: hidden;
        }

        .candidate-login-card-header {
          padding: 32px 32px 0;
        }

        .candidate-login-card-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 999px;
          background: #ecfdf5;
          color: #059669;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 20px;
        }

        .candidate-login-card-title {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 8px;
          letter-spacing: -0.5px;
        }

        .candidate-login-card-desc {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.5;
          margin: 0;
        }

        .candidate-login-card-body {
          padding: 28px 32px;
        }

        .candidate-login-google-wrapper {
          display: flex;
          justify-content: center;
          padding: 8px 0;
        }

        .candidate-login-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 16px 0;
          color: #3b82f6;
          font-size: 14px;
          font-weight: 500;
        }

        .candidate-login-spinner {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #eff6ff;
        }

        .candidate-login-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 24px 0;
        }

        .candidate-login-divider::before,
        .candidate-login-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e5e7eb;
        }

        .candidate-login-divider span {
          font-size: 11px;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 500;
          white-space: nowrap;
        }

        .candidate-login-info-box {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 14px 16px;
          background: #f0f5ff;
          border-radius: 10px;
          border: 1px solid #dbeafe;
        }

        .candidate-login-info-box svg {
          color: #3b82f6;
          min-width: 16px;
          margin-top: 1px;
        }

        .candidate-login-info-box p {
          font-size: 12.5px;
          color: #4b5563;
          line-height: 1.5;
          margin: 0;
        }

        .candidate-login-card-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 16px 32px;
          border-top: 1px solid #f3f4f6;
          background: #fafbfc;
          font-size: 13px;
          color: #9ca3af;
        }

        .candidate-login-admin-link {
          color: #3b82f6;
          font-weight: 600;
          text-decoration: none;
          transition: color 0.15s;
        }

        .candidate-login-admin-link:hover {
          color: #2563eb;
          text-decoration: underline;
        }

        /* Mobile tweaks */
        @media (max-width: 899px) {
          .candidate-login-right {
            min-height: 100vh;
          }
        }
      `}</style>
    </div>
  )
}
