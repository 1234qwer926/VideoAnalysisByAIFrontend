import { useMemo } from "react"
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom"
import {
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Trophy,
  UserCircle2,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

function getPageTitle(pathname) {
  if (pathname.includes("/candidate/exam/")) return "Exam"
  if (pathname.includes("/candidate/result/")) return "Result"
  if (pathname.includes("/candidate/dashboard")) return "Dashboard"
  return "Candidate Portal"
}

export default function CandidateLayout() {
  const location = useLocation()
  const navigate = useNavigate()

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

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <UserCircle2 className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-sm font-semibold tracking-tight">
                Candidate Portal
              </h1>
              <p className="text-xs text-muted-foreground">{pageTitle}</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <Button asChild variant="ghost" size="sm">
              <Link to="/candidate/dashboard">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>

            <Button asChild variant="ghost" size="sm">
              <Link to="/candidate/dashboard">
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Assignments
              </Link>
            </Button>

            <Button asChild variant="ghost" size="sm">
              <Link to="/candidate/dashboard">
                <Trophy className="mr-2 h-4 w-4" />
                Results
              </Link>
            </Button>

            <Separator orientation="vertical" className="mx-1 h-6" />

            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>

          <div className="md:hidden">
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl p-4 lg:p-6">
        <Outlet />
      </main>
    </div>
  )
}