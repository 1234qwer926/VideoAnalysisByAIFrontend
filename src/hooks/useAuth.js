import { useCallback, useMemo } from "react"

const STORAGE_KEYS = {
  authToken: "auth_token",
  adminToken: "admin_token",
  candidateToken: "candidate_token",
  role: "user_role",
  user: "auth_user",
}

function readStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.user)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function readStoredAuth() {
  const authToken =
    localStorage.getItem(STORAGE_KEYS.authToken) ||
    localStorage.getItem(STORAGE_KEYS.adminToken) ||
    localStorage.getItem(STORAGE_KEYS.candidateToken) ||
    ""

  const role =
    localStorage.getItem(STORAGE_KEYS.role) ||
    (localStorage.getItem(STORAGE_KEYS.adminToken) ? "admin" : "") ||
    (localStorage.getItem(STORAGE_KEYS.candidateToken) ? "candidate" : "")

  const user = readStoredUser()

  return {
    token: authToken,
    role,
    user,
  }
}

function clearStoredAuth() {
  localStorage.removeItem(STORAGE_KEYS.authToken)
  localStorage.removeItem(STORAGE_KEYS.adminToken)
  localStorage.removeItem(STORAGE_KEYS.candidateToken)
  localStorage.removeItem(STORAGE_KEYS.role)
  localStorage.removeItem(STORAGE_KEYS.user)
}

export default function useAuth() {
  const authState = useMemo(() => readStoredAuth(), [])

  const login = useCallback(({ token, role, user }) => {
    clearStoredAuth()

    if (token) {
      localStorage.setItem(STORAGE_KEYS.authToken, token)

      if (role === "admin") {
        localStorage.setItem(STORAGE_KEYS.adminToken, token)
      }

      if (role === "candidate") {
        localStorage.setItem(STORAGE_KEYS.candidateToken, token)
      }
    }

    if (role) {
      localStorage.setItem(STORAGE_KEYS.role, role)
    }

    if (user) {
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user))
    }
  }, [])

  const logout = useCallback(() => {
    clearStoredAuth()
  }, [])

  const hasRole = useCallback(
    (requiredRole) => {
      return authState.role === requiredRole
    },
    [authState.role]
  )

  return {
    token: authState.token,
    role: authState.role,
    user: authState.user,
    isAuthenticated: Boolean(authState.token),
    isAdmin: authState.role === "admin",
    isCandidate: authState.role === "candidate",
    login,
    logout,
    hasRole,
  }
}