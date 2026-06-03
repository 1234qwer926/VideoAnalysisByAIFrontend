import { Navigate, useLocation } from "react-router-dom"

function getStoredAuth() {
  const authToken =
    localStorage.getItem("auth_token") ||
    localStorage.getItem("admin_token") ||
    localStorage.getItem("candidate_token")

  const role =
    localStorage.getItem("user_role") ||
    (localStorage.getItem("admin_token") ? "admin" : null) ||
    (localStorage.getItem("candidate_token") ? "candidate" : null)

  return {
    token: authToken,
    role,
  }
}

export default function ProtectedRoute({ children, allowedRole }) {
  const location = useLocation()
  const { token, role } = getStoredAuth()

  if (!token) {
    const loginPath =
      allowedRole === "candidate" ? "/candidate/login" : "/admin/login"

    return <Navigate to={loginPath} replace state={{ from: location }} />
  }

  if (allowedRole && role !== allowedRole) {
    const redirectPath = role === "candidate" ? "/candidate/dashboard" : "/admin/dashboard"
    return <Navigate to={redirectPath} replace />
  }

  return children
}