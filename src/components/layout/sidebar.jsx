import { NavLink, useLocation } from "react-router-dom"
import { LogOut, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function Sidebar({
  items,
  collapsed,
  onToggle,
  user,
  onLogout,
  logo
}) {
  const location = useLocation()

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-all duration-300 ease-in-out flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo Section */}
      <div className={cn(
        "h-16 border-b border-border flex items-center shrink-0 relative",
        collapsed ? "justify-center px-2" : "justify-between px-4"
      )}>
        {!collapsed ? (
          <div className="flex items-center gap-3 overflow-hidden">
            <img src="/pulselogo.jpeg" alt="LMS" className="h-9 w-9 shrink-0" />
            <span className="font-semibold text-lg text-foreground truncate">LMS</span>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <img src="/pulselogo.jpeg" alt="LMS" className="h-9 w-9" />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggle}
          className={cn(
            "shrink-0 rounded-full",
            collapsed 
              ? "absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 bg-card border shadow-sm" 
              : "h-8 w-8"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const isActive = location.pathname === item.to ||
            (item.to !== "/" && location.pathname.startsWith(item.to))

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-200 relative",
                isActive
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              title={collapsed ? item.label : undefined}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
              )}
              <item.icon className={cn("h-5 w-5 shrink-0", collapsed && "mx-auto")} />
              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-3 space-y-2 shrink-0">
        {/* User Info (shown when expanded) */}
        {!collapsed && user && (
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-accent/50">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">
              {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user.name || "User"}
              </p>
              {user.email && (
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              )}
              {user.role && (
                <p className="text-xs text-muted-foreground capitalize">
                  {user.role}
                </p>
              )}
            </div>
          </div>
        )}

        {/* User Avatar (shown when collapsed) */}
        {collapsed && user && (
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "U"}
            </div>
          </div>
        )}

        {/* Logout Button */}
        <Button
          variant="ghost"
          className={cn(
            "w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10",
            collapsed && "px-2"
          )}
          onClick={onLogout}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className={cn("h-4 w-4 shrink-0", collapsed && "mx-auto")} />
          {!collapsed && <span className="ml-2">Logout</span>}
        </Button>
      </div>
    </aside>
  )
}

export default Sidebar