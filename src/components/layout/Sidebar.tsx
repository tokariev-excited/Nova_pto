import { useCallback } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import {
  ListCheck,
  Users,
  Calendar,
  FileClock,
  Settings,
  LogOut,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getInitials, getDisplayName } from "@/lib/utils"
import { useNavigationGuard } from "@/contexts/navigation-guard-context"
import { NovaLogo } from "@/components/nova-logo"
import { SidebarGroup } from "@/components/ui/sidebar-group"
import { SidebarMenuItem } from "@/components/ui/sidebar-menu-item"
import { SidebarMenuButton } from "@/components/ui/sidebar-menu-button"
import { Avatar } from "@/components/ui/avatar"

const navItems = [
  { label: "Requests", icon: ListCheck, path: "/requests" },
  { label: "Employees", icon: Users, path: "/employees" },
  { label: "Calendar", icon: Calendar, path: "/calendar" },
  { label: "Time-off setup", icon: FileClock, path: "/time-off-setup" },
  { label: "Settings", icon: Settings, path: "/settings" },
]

export function Sidebar() {
  const { user, workspace, profile, signOut } = useAuth()
  const { canNavigate } = useNavigationGuard()
  const navigate = useNavigate()
  const location = useLocation()

  const workspaceName = workspace?.name || "Your workspace"
  const displayName = getDisplayName(profile?.first_name, profile?.last_name) || "You"
  const email = user?.email ?? ""
  const initials = getInitials(profile?.first_name, profile?.last_name) ?? "Y"

  const handleNavigate = useCallback(
    (path: string) => {
      if (location.pathname === path) return
      if (!canNavigate()) return
      navigate(path)
    },
    [location.pathname, canNavigate, navigate]
  )

  const workspaceLogo = workspace?.logo_url ? (
    <Avatar size="sm" shape="square" src={workspace.logo_url} alt={workspaceName} />
  ) : (
    <NovaLogo size={32} />
  )

  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col">
      {/* Header */}
      <SidebarGroup>
        <SidebarMenuItem>
          <SidebarMenuButton type="large-icon" mediaAsset={workspaceLogo}>
            {workspaceName}
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarGroup>

      {/* Navigation */}
      <SidebarGroup className="flex-1">
        {navItems.map((item) => (
          <SidebarMenuItem key={item.path}>
            <SidebarMenuButton
              type="simple"
              icon={<item.icon className="size-4" />}
              isActive={location.pathname.startsWith(item.path)}
              onClick={() => handleNavigate(item.path)}
            >
              {item.label}
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarGroup>

      {/* Footer */}
      <div className="flex items-center gap-2 p-3">
        <Avatar
          size="sm"
          shape="square"
          className="bg-input"
          src={profile?.avatar_url}
          fallback={initials}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-semibold leading-none text-sidebar-foreground">
            {displayName}
          </span>
          <span className="truncate text-xs leading-4 tracking-tight text-sidebar-foreground">
            {email}
          </span>
        </div>
        <button
          onClick={signOut}
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-sidebar-foreground opacity-50 transition-colors hover:bg-sidebar-accent hover:opacity-100"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </aside>
  )
}
