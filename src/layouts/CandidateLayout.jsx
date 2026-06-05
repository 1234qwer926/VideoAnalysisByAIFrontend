import { useMemo } from "react"
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"
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
      <header className="sticky top-0 z-30 flex h-[64px] items-center border-b border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 lg:px-6 h-full">
          {/* Left: Logo/Brand (24px padding internal concept, here just spacing) */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F3F4F6] text-[#3B82F6]">
              <UserCircle2 className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-sm font-semibold text-[#1F2937] tracking-tight">
                Candidate Portal
              </h1>
              <p className="text-xs text-[#374151]">{pageTitle}</p>
            </div>
          </div>

          {/* Center: Menu Items (16px spacing) */}
          <div className="hidden h-full items-center gap-[16px] md:flex">
            {[
              { label: "Dashboard", to: "/candidate/dashboard", icon: LayoutDashboard },
              { label: "Assignments", to: "/candidate/assignments", icon: ClipboardCheck },
              { label: "Results", to: "/candidate/results", icon: Trophy }
            ].map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "flex h-full items-center gap-2 text-sm font-medium transition-colors",
                    isActive
                      ? "text-[#3B82F6] border-b-2 border-[#3B82F6]"
                      : "text-[#374151] border-b-2 border-transparent hover:text-[#1F2937] hover:border-[#3B82F6]"
                  ].join(" ")
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </div>

          {/* Right: User Profile/Icons (16px padding) */}
          <div className="flex items-center gap-[16px]">
            <Button variant="outline" size="sm" onClick={handleLogout} className="hidden md:flex">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
            
            <Button variant="outline" size="sm" onClick={handleLogout} className="md:hidden">
              <LogOut className="h-4 w-4" />
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