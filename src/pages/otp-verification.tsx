import { useState } from "react"
import { useNavigate, useLocation, Navigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { getSiteUrl } from "@/lib/site-url"
import { useAuth } from "@/hooks/use-auth"
import { AuthLayout } from "@/components/auth-layout"
import { NovaLogo } from "@/components/nova-logo"
import { Button } from "@/components/ui/button"
import { addToast } from "@/lib/toast"

export function CheckEmailPage() {
  const { user, workspace, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const email = (location.state as { email?: string })?.email
  const [resending, setResending] = useState(false)

  if (authLoading) return null
  if (user && workspace) return <Navigate to="/requests" replace />
  if (!email) return <Navigate to="/login" replace />

  async function handleResend() {
    setResending(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email!,
        options: { emailRedirectTo: `${getSiteUrl()}/auth/callback` },
      })
      if (error) throw error
      addToast({ title: "Email resent", description: `A new login link was sent to ${email}` })
    } catch (err) {
      console.error("Failed to resend OTP:", err)
      addToast({ title: "Failed to resend", description: "Please try again in a moment" })
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthLayout>
      {/* Card Header — logo + text, gap-8 */}
      <div className="flex w-full flex-col items-center gap-8">
        <NovaLogo />
        <div className="flex w-full flex-col items-center gap-2 text-center">
          <h1 className="text-[30px] font-semibold leading-9 tracking-[-0.75px] text-foreground whitespace-nowrap">
            Log in to Nova
          </h1>
        </div>
      </div>

      {/* Body + action */}
      <div className="flex w-full flex-col items-center gap-5">
        <p className="text-sm text-muted-foreground text-center">
          We've sent a magic login link to{" "}
          <span className="font-medium text-foreground">{email}.</span>{" "}
          Open the email and click the link to access your account.
        </p>

        <p className="text-sm text-muted-foreground">
          Didn't get it?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="font-medium text-foreground hover:underline disabled:opacity-50"
          >
            {resending ? "Resending…" : "Resend"}
          </button>
        </p>

        <Button variant="secondary" className="w-full" onClick={() => navigate("/login")}>
          Go back
        </Button>
      </div>
    </AuthLayout>
  )
}