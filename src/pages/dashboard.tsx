import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"

export function DashboardPage() {
  const { user, workspace, signOut } = useAuth()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-8">
      <h1 className="text-2xl font-semibold text-foreground">
        Welcome to Nova PTO
      </h1>
      <p className="text-muted-foreground">
        Logged in as {user?.email}
      </p>
      {workspace && (
        <p className="text-sm text-muted-foreground">
          Workspace: {workspace.name}
        </p>
      )}
      <Button variant="secondary" onClick={signOut}>
        Sign out
      </Button>
    </div>
  )
}
