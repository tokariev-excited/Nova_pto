import { Navigate } from "react-router-dom"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import type { ReactNode } from "react"

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, profile, workspace, loading, authError, retryAuth } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (authError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-lg font-semibold text-foreground">
            Unable to load your account
          </h2>
          <p className="text-sm text-muted-foreground max-w-md">
            {authError}
          </p>
        </div>
        <Button onClick={retryAuth}>Try again</Button>
      </div>
    )
  }

  // Workspace not loaded yet (shouldn't normally happen, but guard against it)
  if (!workspace) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
      </div>
    )
  }

  if (profile?.status === "inactive") {
    return <Navigate to="/access-restricted" replace />
  }

  return children
}
