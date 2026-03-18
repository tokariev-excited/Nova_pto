import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/use-auth"

export function AuthCallbackPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading) {
      navigate(user ? "/requests" : "/login", { replace: true })
    }
  }, [user, loading, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
    </div>
  )
}
