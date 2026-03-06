import { Outlet } from "react-router-dom"
import { Sidebar } from "@/components/layout/Sidebar"

export function DashboardLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-sidebar-accent p-2">
      <Sidebar />
      <main className="flex-1 overflow-y-auto rounded-xl bg-background shadow-sm">
        <Outlet />
      </main>
    </div>
  )
}
