import axios from "axios"

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8000"

function getStoredToken() {
  return (
    localStorage.getItem("auth_token") ||
    localStorage.getItem("admin_token") ||
    localStorage.getItem("candidate_token") ||
    ""
  )
}

function clearStoredAuth() {
  localStorage.removeItem("auth_token")
  localStorage.removeItem("admin_token")
  localStorage.removeItem("candidate_token")
  localStorage.removeItem("user_role")
  localStorage.removeItem("auth_user")
}

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  withCredentials: true,  // Allow cookies to be sent cross-origin (required for httpOnly cookie auth)
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
})

api.interceptors.request.use(
  (config) => {
    const token = getStoredToken()

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status

    if (status === 401) {
      clearStoredAuth()

      const currentPath = window.location.pathname
      const isCandidatePath = currentPath.startsWith("/candidate")

      window.location.href = isCandidatePath
        ? "/candidate/login"
        : "/admin/login"
    }

    return Promise.reject(error)
  }
)