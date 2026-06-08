import { useMemo, useState, useEffect } from "react"
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom"
import {
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Trophy,
  UserCircle2,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sidebar } from "@/components/layout/sidebar"
import { api } from "@/api/client"
import useAuthStore from "@/store/authStore"

const ALL_NAV_ITEMS = [
  { label: "Dashboard", to: "/candidate/dashboard", icon: LayoutDashboard },
  { label: "Assignments", to: "/candidate/assignments", icon: ClipboardCheck },
  { label: "Results", to: "/candidate/results", icon: Trophy },
]

function getPageTitle(pathname) {
  if (pathname.includes("/candidate/exam/")) return "Exam"
  if (pathname.includes("/candidate/result/")) return "Result"
  if (pathname.includes("/candidate/assignments")) return "Assignments"
  if (pathname.includes("/candidate/dashboard")) return "Dashboard"
  return "Candidate Portal"
}

export default function CandidateLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [hasResults, setHasResults] = useState(false)

  // Check if candidate has results
  useEffect(() => {
    const checkResults = async () => {
      try {
        const response = await api.get("/api/candidate/results")
        const results = Array.isArray(response.data) ? response.data : []
        setHasResults(results.length > 0)
      } catch (error) {
        setHasResults(false)
      }
    }
    checkResults()
  }, [])

  // Filter nav items based on results
  const navItems = useMemo(() => {
    return ALL_NAV_ITEMS.filter(item => {
      if (item.label === "Results") return hasResults
      return true
    })
  }, [hasResults])

  const pageTitle = useMemo(
    () => getPageTitle(location.pathname),
    [location.pathname]
  )

  const handleLogout = () => {
    localStorage.removeItem("candidate_token")
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user_role")

    toast.success("Logged out successfully")
    navigate("/candidate/login", { replace: true })
  }

  // Get user info from auth store
  const authUser = useAuthStore((state) => state.user)
  const getUserInfo = () => {
    return {
      email: authUser?.email || "candidate@example.com",
      name: authUser?.name || authUser?.given_name || "",
    }
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="flex min-h-screen">
        <aside className="hidden lg:block">
          <Sidebar
            items={navItems}
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            user={getUserInfo()}
            onLogout={handleLogout}
          />
        </aside>

        <div
          className={cn(
            "flex min-h-screen min-w-0 flex-1 flex-col transition-all duration-300",
            sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
          )}
        >
          {/* Mobile Header */}
          <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 px-4 lg:px-6 lg:hidden shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <UserCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-sm font-semibold tracking-tight">Candidate Portal</h1>
                <p className="text-xs text-muted-foreground">{pageTitle}</p>
              </div>
            </div>
            <ThemeToggle />
          </header>

          <main className="min-w-0 flex-1 p-4 lg:p-6 bg-background">
            <div className="mx-auto w-full max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
