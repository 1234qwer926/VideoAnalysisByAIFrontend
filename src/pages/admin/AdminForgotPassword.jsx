import { useState } from "react"
import { Link } from "react-router-dom"
import { Loader2, Mail, ShieldCheck, ArrowLeft, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

import { api } from "@/api/client"

export default function AdminForgotPassword() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) {
      toast.error("Please enter your email address")
      return
    }
    try {
      setIsSubmitting(true)
      await api.post("/api/admin/auth/forgot-password", { email })
      setIsSent(true)
      toast.success("Reset link sent! Check your inbox.")
    } catch (error) {
      // API returns success regardless for security — show success anyway
      setIsSent(true)
      toast.success("If the email exists, a reset link has been sent.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fp-page">
      <div className="fp-container">
        <div className="fp-card">
          {!isSent ? (
            <>
              <div className="fp-header">
                <div className="fp-icon-wrap">
                  <Mail size={28} />
                </div>
                <h2 className="fp-title">Forgot Password?</h2>
                <p className="fp-desc">
                  Enter the email address associated with your admin account and we'll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="fp-form">
                <div className="fp-field">
                  <label htmlFor="fp-email" className="fp-label">Email address</label>
                  <div className="fp-input-wrap">
                    <Mail size={16} className="fp-input-icon" />
                    <input
                      id="fp-email"
                      type="email"
                      placeholder="admin@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      className="fp-input"
                      autoFocus
                    />
                  </div>
                </div>

                <button type="submit" className="fp-submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="fp-spinner" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="fp-success">
              <div className="fp-success-icon">
                <CheckCircle2 size={36} />
              </div>
              <h2 className="fp-title">Check your email</h2>
              <p className="fp-desc">
                We've sent a password reset link to <strong>{email}</strong>. The link will expire in 30 minutes.
              </p>
              <button
                className="fp-resend"
                onClick={() => { setIsSent(false); setEmail(""); }}
              >
                Didn't receive it? Try again
              </button>
            </div>
          )}

          <div className="fp-footer">
            <Link to="/admin/login" className="fp-back-link">
              <ArrowLeft size={15} />
              Back to login
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        .fp-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
          font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
          padding: 24px;
        }
        .fp-container {
          width: 100%;
          max-width: 440px;
        }
        .fp-card {
          background: #fff;
          border-radius: 20px;
          box-shadow:
            0 1px 2px rgba(0,0,0,0.03),
            0 4px 16px rgba(0,0,0,0.04),
            0 12px 48px rgba(0,0,0,0.06);
          overflow: hidden;
        }
        .fp-header {
          padding: 36px 32px 0;
          text-align: center;
        }
        .fp-icon-wrap {
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
        .fp-title {
          font-size: 22px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 8px;
          letter-spacing: -0.5px;
        }
        .fp-desc {
          font-size: 13.5px;
          color: #64748b;
          line-height: 1.55;
          margin: 0;
        }
        .fp-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
          padding: 28px 32px;
        }
        .fp-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .fp-label {
          font-size: 13px;
          font-weight: 600;
          color: #334155;
        }
        .fp-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .fp-input-icon {
          position: absolute;
          left: 14px;
          color: #94a3b8;
          pointer-events: none;
        }
        .fp-input {
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
        .fp-input::placeholder { color: #cbd5e1; }
        .fp-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }
        .fp-submit {
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
        }
        .fp-submit:hover:not(:disabled) {
          background: linear-gradient(135deg, #1e40af 0%, #1d4ed8 50%, #2563eb 100%);
          box-shadow: 0 4px 16px rgba(37,99,235,0.35);
          transform: translateY(-1px);
        }
        .fp-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* Success State */
        .fp-success {
          text-align: center;
          padding: 40px 32px 28px;
        }
        .fp-success-icon {
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
        .fp-resend {
          margin-top: 20px;
          background: none;
          border: none;
          color: #2563eb;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          font-family: inherit;
          text-decoration: underline;
          transition: color 0.15s;
        }
        .fp-resend:hover { color: #1d4ed8; }

        /* Footer */
        .fp-footer {
          display: flex;
          justify-content: center;
          padding: 16px 32px;
          border-top: 1px solid #f1f5f9;
          background: #fafbfd;
        }
        .fp-back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #64748b;
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
          transition: color 0.15s;
        }
        .fp-back-link:hover {
          color: #2563eb;
        }

        /* Spinner */
        .fp-spinner {
          animation: fp-spin 1s linear infinite;
        }
        @keyframes fp-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
