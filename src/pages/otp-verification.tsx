import { useNavigate, useLocation, Navigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { AuthLayout } from "@/components/auth-layout"
import { NovaLogo } from "@/components/nova-logo"
import { Button } from "@/components/ui/button"

export function CheckEmailPage() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const email = (location.state as { email?: string })?.email

  if (authLoading) return null
  if (user) return <Navigate to="/dashboard" replace />
  if (!email) return <Navigate to="/login" replace />

  async function handleResend() {
    await supabase.auth.signInWithOtp({ email: email! })
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
            className="font-medium text-foreground hover:underline"
          >
            Resend
          </button>
        </p>

        <Button variant="secondary" className="w-full" onClick={() => navigate("/login")}>
          Go back
        </Button>
      </div>
    </AuthLayout>
  )
}