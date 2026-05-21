"use client"

import { Zap, LayoutDashboard, Compass, Brain, FileText, ListChecks, User, LogOut, Settings, Kanban, BarChart2 } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface MainSidebarProps {
  onLogout?: () => void
}

const navItems = [
  { path: "/dashboard",            icon: LayoutDashboard, label: "Dashboard" },
  { path: "/dashboard/discovery",  icon: Compass,         label: "Discovery" },
  { path: "/dashboard/analyzer",   icon: Brain,           label: "Analyzer" },
  { path: "/dashboard/pipeline",   icon: Kanban,          label: "Pipeline" },
  { path: "/dashboard/tracker",    icon: ListChecks,      label: "Tracker" },
  { path: "/dashboard/reports",    icon: BarChart2,       label: "Reports" },
  { path: "/dashboard/cv-manager", icon: FileText,        label: "CV Manager" },
]

export function MainSidebar({ onLogout }: MainSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    if (onLogout) onLogout()
    router.push("/auth")
  }

  const userInitials = user?.first_name && user?.last_name 
    ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    : user?.email?.[0].toUpperCase() || "U"

  const fullName = user?.first_name && user?.last_name
    ? `${user.first_name} ${user.last_name}`
    : user?.email || "User"
  return (
    <div className="fixed left-0 top-0 h-full w-16 bg-sidebar flex flex-col items-center py-6 border-r border-sidebar-border z-50">
      {/* Logo */}
      <div className="mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Zap className="w-5 h-5 text-primary" fill="currentColor" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-2">
        {navItems.map(item => (
          <Link
            key={item.path}
            href={item.path}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all group relative",
              pathname === item.path 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="absolute left-14 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg border border-border">
              {item.label}
            </span>
          </Link>
        ))}
      </nav>

      {/* User Profile Dropdown */}
      <div className="mt-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold hover:bg-primary/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-sidebar">
              {userInitials}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-48 bg-popover border-border">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium truncate">{fullName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/dashboard/profile">
                <User className="w-4 h-4 mr-2" />
                View Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/dashboard/profile">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
