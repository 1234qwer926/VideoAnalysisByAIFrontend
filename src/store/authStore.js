import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

const STORAGE_KEYS = {
  authToken: "auth_token",
  adminToken: "admin_token",
  candidateToken: "candidate_token",
  role: "user_role",
  user: "auth_user",
}

function syncLegacyStorage({ token, role, user }) {
  if (typeof window === "undefined") return

  localStorage.removeItem(STORAGE_KEYS.authToken)
  localStorage.removeItem(STORAGE_KEYS.adminToken)
  localStorage.removeItem(STORAGE_KEYS.candidateToken)
  localStorage.removeItem(STORAGE_KEYS.role)
  localStorage.removeItem(STORAGE_KEYS.user)

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
}

function clearLegacyStorage() {
  if (typeof window === "undefined") return

  localStorage.removeItem(STORAGE_KEYS.authToken)
  localStorage.removeItem(STORAGE_KEYS.adminToken)
  localStorage.removeItem(STORAGE_KEYS.candidateToken)
  localStorage.removeItem(STORAGE_KEYS.role)
  localStorage.removeItem(STORAGE_KEYS.user)
}

const useAuthStore = create(
  persist(
    (set, get) => ({
      token: "",
      role: "",
      user: null,
      isAuthenticated: false,

      login: ({ token, role, user = null }) => {
        set({
          token: token || "",
          role: role || "",
          user,
          isAuthenticated: Boolean(token),
        })

        syncLegacyStorage({ token, role, user })
      },

      logout: () => {
        set({
          token: "",
          role: "",
          user: null,
          isAuthenticated: false,
        })

        clearLegacyStorage()
      },

      setUser: (user) => {
        const current = get()
        set({ user })
        syncLegacyStorage({
          token: current.token,
          role: current.role,
          user,
        })
      },

      hydrateFromStorage: () => {
        const token =
          localStorage.getItem(STORAGE_KEYS.authToken) ||
          localStorage.getItem(STORAGE_KEYS.adminToken) ||
          localStorage.getItem(STORAGE_KEYS.candidateToken) ||
          ""

        const role =
          localStorage.getItem(STORAGE_KEYS.role) ||
          (localStorage.getItem(STORAGE_KEYS.adminToken) ? "admin" : "") ||
          (localStorage.getItem(STORAGE_KEYS.candidateToken) ? "candidate" : "")

        let user = null

        try {
          const raw = localStorage.getItem(STORAGE_KEYS.user)
          user = raw ? JSON.parse(raw) : null
        } catch {
          user = null
        }

        set({
          token,
          role,
          user,
          isAuthenticated: Boolean(token),
        })
      },
    }),
    {
      name: "auth-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        role: state.role,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

export default useAuthStore