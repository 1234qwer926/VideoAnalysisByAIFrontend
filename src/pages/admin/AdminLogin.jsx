import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Loader2, ShieldCheck, Lock, Mail, Eye, EyeOff, ArrowRight, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { GoogleLogin } from "@react-oauth/google"

import { api } from "@/api/client"
import useAuthStore from "@/store/authStore"

export default function AdminLogin() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)

  const [formData, setFormData] = useState({ email: "", password: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loginMethod, setLoginMethod] = useState("password") // "password" | "google"

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
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
      const token = response?.data?.token || response?.data?.access_token || response?.data?.accessToken
      if (!token) {
        toast.error("Login succeeded but token was not returned")
        return
      }
      login({
        token,
        role: "admin",
        user: response?.data?.user || { email: formData.email, role: "admin" },
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

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setIsSubmitting(true)
      const googleToken = credentialResponse.credential
      const response = await api.post("/api/admin/auth/google-login", { token: googleToken })
      const token = response?.data?.token || response?.data?.access_token || response?.data?.accessToken
      if (!token) {
        toast.error("Login succeeded but token was not returned")
        return
      }
      login({
        token,
        role: "admin",
        user: response?.data?.user || { email: response?.data?.email, role: "admin" },
      })
      toast.success("Google login successful")
      navigate("/admin/dashboard", { replace: true })
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
    <div className="admin-login-page">
      {/* Left Panel - Branding */}
      <div className="admin-login-left">
        <div className="admin-login-left-content">
          <div className="admin-login-logo">
            <div className="admin-login-logo-icon">
              <ShieldCheck size={28} />
            </div>
            <span className="admin-login-logo-text">PulseLMS</span>
          </div>

          <div className="admin-login-hero">
            <h1 className="admin-login-hero-title">
              Admin<br />Control Panel
            </h1>
            <p className="admin-login-hero-subtitle">
              Manage forms, assignments, candidates and review AI-powered evaluation results from a single dashboard.
            </p>
          </div>

          <div className="admin-login-features">
            <div className="admin-login-feature">
              <div className="admin-login-feature-icon"><Sparkles size={20} /></div>
              <div>
                <div className="admin-login-feature-title">AI Evaluations</div>
                <div className="admin-login-feature-desc">Automated grading with detailed feedback</div>
              </div>
            </div>
            <div className="admin-login-feature">
              <div className="admin-login-feature-icon"><ShieldCheck size={20} /></div>
              <div>
                <div className="admin-login-feature-title">Secure Proctoring</div>
                <div className="admin-login-feature-desc">Face detection & tab-switch monitoring</div>
              </div>
            </div>
            <div className="admin-login-feature">
              <div className="admin-login-feature-icon"><Lock size={20} /></div>
              <div>
                <div className="admin-login-feature-title">Role-Based Access</div>
                <div className="admin-login-feature-desc">Separate admin & candidate portals</div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="admin-login-decor-1" />
        <div className="admin-login-decor-2" />
        <div className="admin-login-decor-3" />
      </div>

      {/* Right Panel - Login Form */}
      <div className="admin-login-right">
        <div className="admin-login-card">
          <div className="admin-login-card-header">
            <div className="admin-login-card-badge">
              <Lock size={14} />
              <span>Admin Access</span>
            </div>
            <h2 className="admin-login-card-title">Welcome back</h2>
            <p className="admin-login-card-desc">
              Sign in to manage your LMS platform
            </p>
          </div>

          {/* Method Tabs */}
          <div className="admin-login-tabs">
            <button
              className={`admin-login-tab ${loginMethod === "password" ? "active" : ""}`}
              onClick={() => setLoginMethod("password")}
              type="button"
            >
              <Mail size={15} />
              Email & Password
            </button>
            <button
              className={`admin-login-tab ${loginMethod === "google" ? "active" : ""}`}
              onClick={() => setLoginMethod("google")}
              type="button"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google Sign-In
            </button>
          </div>

          <div className="admin-login-card-body">
            {loginMethod === "password" ? (
              <form onSubmit={handleSubmit} className="admin-login-form">
                <div className="admin-login-field">
                  <label htmlFor="admin-email" className="admin-login-label">Email address</label>
                  <div className="admin-login-input-wrap">
                    <Mail size={16} className="admin-login-input-icon" />
                    <input
                      id="admin-email"
                      name="email"
                      type="email"
                      placeholder="admin@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      autoComplete="email"
                      className="admin-login-input"
                    />
                  </div>
                </div>

                <div className="admin-login-field">
                  <div className="admin-login-label-row">
                    <label htmlFor="admin-password" className="admin-login-label">Password</label>
                    <Link to="/admin/forgot-password" className="admin-login-forgot-link">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="admin-login-input-wrap">
                    <Lock size={16} className="admin-login-input-icon" />
                    <input
                      id="admin-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      autoComplete="current-password"
                      className="admin-login-input"
                    />
                    <button
                      type="button"
                      className="admin-login-eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="admin-login-submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="admin-login-spinner-icon" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="admin-login-google-section">
                {isSubmitting ? (
                  <div className="admin-login-loading">
                    <div className="admin-login-spinner-wrap">
                      <Loader2 size={24} className="admin-login-spinner-icon" />
                    </div>
                    <span>Verifying your account...</span>
                  </div>
                ) : (
                  <>
                    <p className="admin-login-google-hint">
                      Sign in with your Google account linked to your admin email.
                    </p>
                    <div className="admin-login-google-wrapper">
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        shape="rectangular"
                        theme="outline"
                        size="large"
                        text="signin_with"
                        width="320"
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="admin-login-card-footer">
            <span>Are you a candidate?</span>
            <Link to="/candidate/login" className="admin-login-candidate-link">
              Go to Candidate Portal →
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        /* ═══════════════════════════════════════════
           ADMIN LOGIN — Premium Split Layout
           ═══════════════════════════════════════════ */
        .admin-login-page {
          display: flex;
          min-height: 100vh;
          font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
        }

        /* ── Left Branding Panel ── */
        .admin-login-left {
          position: relative;
          display: none;
          flex: 1;
          background: linear-gradient(145deg, #0f172a 0%, #1e3a5f 40%, #1d4ed8 100%);
          color: #fff;
          overflow: hidden;
        }
        @media (min-width: 960px) {
          .admin-login-left {
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }
        .admin-login-left-content {
          position: relative;
          z-index: 2;
          padding: 48px;
          max-width: 480px;
        }
        .admin-login-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 52px;
        }
        .admin-login-logo-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 46px;
          height: 46px;
          background: rgba(255,255,255,0.12);
          border-radius: 13px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .admin-login-logo-text {
          font-size: 23px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }
        .admin-login-hero-title {
          font-size: 40px;
          font-weight: 800;
          line-height: 1.12;
          letter-spacing: -1.5px;
          margin: 0 0 16px;
        }
        .admin-login-hero-subtitle {
          font-size: 15px;
          line-height: 1.65;
          opacity: 0.8;
          margin: 0 0 44px;
        }
        .admin-login-features {
          display: flex;
          flex-direction: column;
          gap: 22px;
        }
        .admin-login-feature {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }
        .admin-login-feature-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          min-width: 40px;
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .admin-login-feature-title {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 2px;
        }
        .admin-login-feature-desc {
          font-size: 12.5px;
          opacity: 0.65;
          line-height: 1.4;
        }

        /* Decorative blobs */
        .admin-login-decor-1 {
          position: absolute;
          width: 340px;
          height: 340px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%);
          top: -100px;
          right: -80px;
        }
        .admin-login-decor-2 {
          position: absolute;
          width: 220px;
          height: 220px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%);
          bottom: -50px;
          left: -50px;
        }
        .admin-login-decor-3 {
          position: absolute;
          width: 160px;
          height: 160px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%);
          top: 50%;
          left: 60%;
        }

        /* ── Right Login Panel ── */
        .admin-login-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 24px;
          background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
        }
        @media (max-width: 959px) {
          .admin-login-right {
            min-height: 100vh;
          }
        }

        .admin-login-card {
          width: 100%;
          max-width: 440px;
          background: #fff;
          border-radius: 20px;
          box-shadow:
            0 1px 2px rgba(0,0,0,0.03),
            0 4px 16px rgba(0,0,0,0.04),
            0 12px 48px rgba(0,0,0,0.06);
          overflow: hidden;
        }

        .admin-login-card-header {
          padding: 32px 32px 0;
        }
        .admin-login-card-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 999px;
          background: #eff6ff;
          color: #2563eb;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 18px;
        }
        .admin-login-card-title {
          font-size: 25px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 6px;
          letter-spacing: -0.6px;
        }
        .admin-login-card-desc {
          font-size: 14px;
          color: #64748b;
          line-height: 1.5;
          margin: 0;
        }

        /* ── Method Tabs ── */
        .admin-login-tabs {
          display: flex;
          gap: 4px;
          margin: 20px 32px 0;
          padding: 4px;
          background: #f1f5f9;
          border-radius: 10px;
        }
        .admin-login-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 10px 12px;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: #64748b;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }
        .admin-login-tab:hover {
          color: #334155;
        }
        .admin-login-tab.active {
          background: #fff;
          color: #0f172a;
          font-weight: 600;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }

        /* ── Card Body ── */
        .admin-login-card-body {
          padding: 24px 32px 28px;
        }

        /* ── Form Fields ── */
        .admin-login-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .admin-login-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .admin-login-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .admin-login-label {
          font-size: 13px;
          font-weight: 600;
          color: #334155;
        }
        .admin-login-forgot-link {
          font-size: 12.5px;
          color: #2563eb;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.15s;
        }
        .admin-login-forgot-link:hover {
          color: #1d4ed8;
          text-decoration: underline;
        }
        .admin-login-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .admin-login-input-icon {
          position: absolute;
          left: 14px;
          color: #94a3b8;
          pointer-events: none;
        }
        .admin-login-input {
          width: 100%;
          padding: 11px 14px 11px 40px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          font-family: inherit;
          color: #0f172a;
          background: #fff;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
        }
        .admin-login-input::placeholder {
          color: #cbd5e1;
        }
        .admin-login-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }
        .admin-login-eye-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          transition: color 0.15s;
        }
        .admin-login-eye-btn:hover {
          color: #64748b;
        }

        /* ── Submit Button ── */
        .admin-login-submit {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 12px 20px;
          background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 14.5px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 4px;
          box-shadow: 0 2px 8px rgba(37,99,235,0.25);
        }
        .admin-login-submit:hover:not(:disabled) {
          background: linear-gradient(135deg, #1e40af 0%, #1d4ed8 50%, #2563eb 100%);
          box-shadow: 0 4px 16px rgba(37,99,235,0.35);
          transform: translateY(-1px);
        }
        .admin-login-submit:active:not(:disabled) {
          transform: translateY(0);
        }
        .admin-login-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* ── Google Section ── */
        .admin-login-google-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          padding: 12px 0;
        }
        .admin-login-google-hint {
          font-size: 13.5px;
          color: #64748b;
          text-align: center;
          line-height: 1.5;
          margin: 0;
        }
        .admin-login-google-wrapper {
          display: flex;
          justify-content: center;
        }
        .admin-login-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 24px 0;
          color: #2563eb;
          font-size: 14px;
          font-weight: 500;
        }
        .admin-login-spinner-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: #eff6ff;
        }

        /* Spinner animation */
        .admin-login-spinner-icon {
          animation: admin-spin 1s linear infinite;
        }
        @keyframes admin-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* ── Card Footer ── */
        .admin-login-card-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 16px 32px;
          border-top: 1px solid #f1f5f9;
          background: #fafbfd;
          font-size: 13px;
          color: #94a3b8;
        }
        .admin-login-candidate-link {
          color: #2563eb;
          font-weight: 600;
          text-decoration: none;
          transition: color 0.15s;
        }
        .admin-login-candidate-link:hover {
          color: #1d4ed8;
          text-decoration: underline;
        }
      `}</style>
    </div>
  )
}
