import { Suspense } from "react"
import { Outlet } from "react-router-dom"
import { Sidebar } from "@/components/layout/Sidebar"
import { NavigationGuardProvider } from "@/contexts/navigation-guard-context"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/toaster"
import { ErrorBoundary } from "@/components/error-boundary"

export function DashboardLayout() {
  return (
    <NavigationGuardProvider>
      <TooltipProvider delayDuration={300}>
        <div className="flex h-screen overflow-hidden bg-sidebar-accent p-2">
          <Sidebar />
          <main className="flex-1 overflow-y-auto rounded-xl bg-background shadow-sm">
            <ErrorBoundary>
              <Suspense fallback={null}>
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          </main>
        </div>
        <Toaster />
      </TooltipProvider>
    </NavigationGuardProvider>
  )
}
