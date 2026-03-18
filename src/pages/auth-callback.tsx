import { useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { addToast } from "@/lib/toast"

function getAuthErrorMessage(error: string): string {
  const lower = error.toLowerCase()
  if (lower.includes("expired") || lower.includes("otp_expired"))
    return "Your login link has expired. Please request a new one."
  if (lower.includes("invalid") || lower.includes("bad_code_verifier"))
    return "This login link is no longer valid. Please request a new one."
  if (lower.includes("already used") || lower.includes("code already"))
    return "This login link has already been used."
  return "Something went wrong during login. Please try again."
}

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const hasExchanged = useRef(false)

  useEffect(() => {
    // Guard against React StrictMode double-invoke — PKCE codes are one-time use
    if (hasExchanged.current) return
    hasExchanged.current = true

    const params = new URLSearchParams(window.location.search)
    const code = params.get("code")
    const error = params.get("error")
    const errorDescription = params.get("error_description")

    // Strip auth params from URL to prevent race with detectSessionInUrl
    window.history.replaceState({}, "", window.location.pathname)

    async function handleCallback() {
      // Case 1: Supabase returned an error in the redirect URL
      if (error) {
        addToast({
          title: "Login failed",
          description: errorDescription || getAuthErrorMessage(error),
          variant: "error",
        })
        navigate("/login", { replace: true })
        return
      }

      // Case 2: PKCE code present — exchange for session
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError) {
          // Check if auto-detection already handled it (race condition)
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            // Session exists — auto-detection won the race, proceed normally
            navigate("/requests", { replace: true })
            return
          }

          addToast({
            title: "Login failed",
            description: getAuthErrorMessage(exchangeError.message),
            variant: "error",
          })
          navigate("/login", { replace: true })
          return
        }

        // Success — onAuthStateChange will fire SIGNED_IN in auth-context
        navigate("/requests", { replace: true })
        return
      }

      // Case 3: No code, no error — legacy hash flow or direct visit
      // detectSessionInUrl handles hash fragments automatically.
      // Wait for auth context to settle, then check session.
      const { data: { session } } = await supabase.auth.getSession()
      navigate(session ? "/requests" : "/login", { replace: true })
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
    </div>
  )
}
