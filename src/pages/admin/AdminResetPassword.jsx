import { useState } from "react"
import { Link, useSearchParams, useNavigate } from "react-router-dom"
import { Loader2, Lock, Eye, EyeOff, CheckCircle2, ArrowLeft, ShieldCheck, AlertCircle } from "lucide-react"
import { toast } from "sonner"

import { api } from "@/api/client"

export default function AdminResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Password strength
  const getStrength = (pw) => {
    let score = 0
    if (pw.length >= 6) score++
    if (pw.length >= 10) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^A-Za-z0-9]/.test(pw)) score++
    return score
  }
  const strength = getStrength(password)
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong", "Excellent"][strength]
  const strengthColor = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#059669"][strength]

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!token) {
      toast.error("Invalid reset link — no token found")
      return
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    try {
      setIsSubmitting(true)
      await api.post("/api/admin/auth/reset-password", {
        token,
        new_password: password,
      })
      setIsSuccess(true)
      toast.success("Password reset successfully!")
    } catch (error) {
      const message = error?.response?.data?.detail || "Failed to reset password"
      toast.error(typeof message === "string" ? message : "Failed to reset password")
    } finally {
      setIsSubmitting(false)
    }
  }

  // No token — invalid link
  if (!token) {
    return (
      <div className="rp-page">
        <div className="rp-container">
          <div className="rp-card">
            <div className="rp-error-state">
              <div className="rp-error-icon">
                <AlertCircle size={36} />
              </div>
              <h2 className="rp-title">Invalid Reset Link</h2>
              <p className="rp-desc">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
              <Link to="/admin/forgot-password" className="rp-action-link">
                Request New Link
              </Link>
            </div>
            <div className="rp-footer">
              <Link to="/admin/login" className="rp-back-link">
                <ArrowLeft size={15} />
                Back to login
              </Link>
            </div>
          </div>
        </div>
        {renderStyles()}
      </div>
    )
  }

  return (
    <div className="rp-page">
      <div className="rp-container">
        <div className="rp-card">
          {!isSuccess ? (
            <>
              <div className="rp-header">
                <div className="rp-icon-wrap">
                  <ShieldCheck size={28} />
                </div>
                <h2 className="rp-title">Set New Password</h2>
                <p className="rp-desc">
                  Create a strong password for your admin account.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="rp-form">
                <div className="rp-field">
                  <label htmlFor="rp-password" className="rp-label">New Password</label>
                  <div className="rp-input-wrap">
                    <Lock size={16} className="rp-input-icon" />
                    <input
                      id="rp-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="rp-input"
                      autoFocus
                    />
                    <button
                      type="button"
                      className="rp-eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {/* Strength Indicator */}
                  {password.length > 0 && (
                    <div className="rp-strength">
                      <div className="rp-strength-bar">
                        <div
                          className="rp-strength-fill"
                          style={{
                            width: `${(strength / 5) * 100}%`,
                            background: strengthColor,
                          }}
                        />
                      </div>
                      <span className="rp-strength-label" style={{ color: strengthColor }}>
                        {strengthLabel}
                      </span>
                    </div>
                  )}
                </div>

                <div className="rp-field">
                  <label htmlFor="rp-confirm" className="rp-label">Confirm Password</label>
                  <div className="rp-input-wrap">
                    <Lock size={16} className="rp-input-icon" />
                    <input
                      id="rp-confirm"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="rp-input"
                    />
                    <button
                      type="button"
                      className="rp-eye-btn"
                      onClick={() => setShowConfirm(!showConfirm)}
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && password !== confirmPassword && (
                    <span className="rp-mismatch">Passwords do not match</span>
                  )}
                </div>

                <button type="submit" className="rp-submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="rp-spinner" />
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="rp-success">
              <div className="rp-success-icon">
                <CheckCircle2 size={36} />
              </div>
              <h2 className="rp-title">Password Updated!</h2>
              <p className="rp-desc">
                Your admin password has been successfully reset. You can now sign in with your new password.
              </p>
              <button
                className="rp-goto-login"
                onClick={() => navigate("/admin/login", { replace: true })}
              >
                Go to Login
              </button>
            </div>
          )}

          <div className="rp-footer">
            <Link to="/admin/login" className="rp-back-link">
              <ArrowLeft size={15} />
              Back to login
            </Link>
          </div>
        </div>
      </div>
      {renderStyles()}
    </div>
  )
}

function renderStyles() {
  return (
    <style>{`
      .rp-page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
        font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
        padding: 24px;
      }
      .rp-container {
        width: 100%;
        max-width: 440px;
      }
      .rp-card {
        background: #fff;
        border-radius: 20px;
        box-shadow:
          0 1px 2px rgba(0,0,0,0.03),
          0 4px 16px rgba(0,0,0,0.04),
          0 12px 48px rgba(0,0,0,0.06);
        overflow: hidden;
      }
      .rp-header {
        padding: 36px 32px 0;
        text-align: center;
      }
      .rp-icon-wrap {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 60px;
        height: 60px;
        border-radius: 16px;
        background: linear-gradient(135deg, #eff6ff, #dbeafe);
        color: #2563eb;
        margin-bottom: 20px;
      }
      .rp-title {
        font-size: 22px;
        font-weight: 700;
        color: #0f172a;
        margin: 0 0 8px;
        letter-spacing: -0.5px;
      }
      .rp-desc {
        font-size: 13.5px;
        color: #64748b;
        line-height: 1.55;
        margin: 0;
      }
      .rp-form {
        display: flex;
        flex-direction: column;
        gap: 18px;
        padding: 28px 32px;
      }
      .rp-field {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .rp-label {
        font-size: 13px;
        font-weight: 600;
        color: #334155;
      }
      .rp-input-wrap {
        position: relative;
        display: flex;
        align-items: center;
      }
      .rp-input-icon {
        position: absolute;
        left: 14px;
        color: #94a3b8;
        pointer-events: none;
      }
      .rp-input {
        width: 100%;
        padding: 11px 42px 11px 40px;
        border: 1.5px solid #e2e8f0;
        border-radius: 10px;
        font-size: 14px;
        font-family: inherit;
        color: #0f172a;
        background: #fff;
        transition: border-color 0.2s, box-shadow 0.2s;
        outline: none;
      }
      .rp-input::placeholder { color: #cbd5e1; }
      .rp-input:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
      }
      .rp-eye-btn {
        position: absolute;
        right: 12px;
        background: none;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        padding: 4px;
        display: flex;
        transition: color 0.15s;
      }
      .rp-eye-btn:hover { color: #64748b; }

      /* Strength bar */
      .rp-strength {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 4px;
      }
      .rp-strength-bar {
        flex: 1;
        height: 4px;
        background: #e2e8f0;
        border-radius: 4px;
        overflow: hidden;
      }
      .rp-strength-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.3s, background 0.3s;
      }
      .rp-strength-label {
        font-size: 11px;
        font-weight: 600;
        min-width: 56px;
        text-align: right;
      }

      .rp-mismatch {
        font-size: 12px;
        color: #ef4444;
        font-weight: 500;
      }

      .rp-submit {
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
        transition: all 0.2s;
        box-shadow: 0 2px 8px rgba(37,99,235,0.25);
        margin-top: 4px;
      }
      .rp-submit:hover:not(:disabled) {
        background: linear-gradient(135deg, #1e40af 0%, #1d4ed8 50%, #2563eb 100%);
        box-shadow: 0 4px 16px rgba(37,99,235,0.35);
        transform: translateY(-1px);
      }
      .rp-submit:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      /* Success */
      .rp-success {
        text-align: center;
        padding: 40px 32px 28px;
      }
      .rp-success-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 68px;
        height: 68px;
        border-radius: 50%;
        background: linear-gradient(135deg, #ecfdf5, #d1fae5);
        color: #059669;
        margin-bottom: 20px;
      }
      .rp-goto-login {
        margin-top: 20px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 11px 28px;
        background: linear-gradient(135deg, #1d4ed8, #2563eb);
        color: #fff;
        border: none;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 600;
        font-family: inherit;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 2px 8px rgba(37,99,235,0.25);
      }
      .rp-goto-login:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 16px rgba(37,99,235,0.35);
      }

      /* Error state */
      .rp-error-state {
        text-align: center;
        padding: 40px 32px 28px;
      }
      .rp-error-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 68px;
        height: 68px;
        border-radius: 50%;
        background: linear-gradient(135deg, #fef2f2, #fee2e2);
        color: #dc2626;
        margin-bottom: 20px;
      }
      .rp-action-link {
        display: inline-block;
        margin-top: 20px;
        padding: 10px 24px;
        background: linear-gradient(135deg, #1d4ed8, #2563eb);
        color: #fff;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 600;
        text-decoration: none;
        transition: all 0.2s;
        box-shadow: 0 2px 8px rgba(37,99,235,0.25);
      }
      .rp-action-link:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 16px rgba(37,99,235,0.35);
      }

      /* Footer */
      .rp-footer {
        display: flex;
        justify-content: center;
        padding: 16px 32px;
        border-top: 1px solid #f1f5f9;
        background: #fafbfd;
      }
      .rp-back-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: #64748b;
        font-size: 13px;
        font-weight: 500;
        text-decoration: none;
        transition: color 0.15s;
      }
      .rp-back-link:hover { color: #2563eb; }

      .rp-spinner {
        animation: rp-spin 1s linear infinite;
      }
      @keyframes rp-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `}</style>
  )
}
