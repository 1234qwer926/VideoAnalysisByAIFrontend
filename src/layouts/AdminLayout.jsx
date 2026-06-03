import { useMemo, useState } from "react"
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"
import {
  BarChart3,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusSquare,
  Users,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const NAV_ITEMS = [
  {
    label: "Dashboard",
    to: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Forms",
    to: "/admin/forms",
    icon: FileText,
  },
  {
    label: "Create Form",
    to: "/admin/forms/create",
    icon: PlusSquare,
  },
  {
    label: "Assignments",
    to: "/admin/assignments",
    icon: ClipboardList,
  },
  {
    label: "Results",
    to: "/admin/results",
    icon: BarChart3,
  },
]

function getPageTitle(pathname) {
  if (pathname.includes("/admin/forms/create")) return "Create Form"
  if (pathname.includes("/admin/forms")) return "Forms"
  if (pathname.includes("/admin/assignments/create")) return "Create Assignment"
  if (pathname.includes("/admin/assignments")) return "Assignments"
  if (pathname.includes("/admin/results/")) return "Result Detail"
  if (pathname.includes("/admin/results")) return "Results"
  if (pathname.includes("/admin/dashboard")) return "Dashboard"
  return "Admin"
}

function SidebarContent({ onNavigate }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem("admin_token")
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user_role")

    toast.success("Logged out successfully")
    navigate("/admin/login", { replace: true })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight">Interview Admin</p>
          <p className="text-xs text-muted-foreground">Management console</p>
        </div>
      </div>

      <Separator />

      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                ].join(" ")
              }
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="p-3">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )
}

export default function AdminLayout() {
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const pageTitle = useMemo(
    () => getPageTitle(location.pathname),
    [location.pathname]
  )

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 border-r bg-background lg:flex">
          <SidebarContent />
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:px-6">
            <div className="flex items-center gap-3">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild className="lg:hidden">
                  <Button variant="outline" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>

                <SheetContent side="left" className="w-72 p-0">
                  <div className="flex items-center justify-between border-b px-4 py-4">
                    <p className="text-sm font-semibold">Navigation</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <SidebarContent onNavigate={() => setOpen(false)} />
                </SheetContent>
              </Sheet>

              <div>
                <h1 className="text-lg font-semibold tracking-tight">
                  {pageTitle}
                </h1>
                <p className="text-xs text-muted-foreground">
                  Admin panel workspace
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
                <Link to="/admin/assignments/create">New Assignment</Link>
              </Button>

              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link to="/admin/forms/create">New Form</Link>
              </Button>
            </div>
          </header>

          <main className="min-w-0 flex-1 p-4 lg:p-6">
            <div className="mx-auto w-full max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}