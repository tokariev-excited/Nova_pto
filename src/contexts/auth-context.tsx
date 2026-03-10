import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { runFounderFlow } from "@/lib/founder-flow"
import type { EmployeeStatus } from "@/types/employee"

interface Workspace {
  id: string
  name: string
  logo_url?: string
  owner_id: string
  created_at: string
}

export interface Profile {
  id: string
  workspace_id: string
  role: string
  email: string
  first_name?: string
  last_name?: string
  avatar_url?: string
  status: EmployeeStatus
  department_id?: string | null
  location?: string
  hire_date?: string
  created_at: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  workspace: Workspace | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshWorkspace: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfileAndWorkspace(userId: string) {
    let { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle()

    if (profileError) {
      console.error("[Auth] Failed to fetch profile:", profileError.message, profileError)
      return
    }

    // Recovery: profile missing (founder flow previously failed due to RLS bug)
    if (!profileData) {
      const currentUser = user ?? (await supabase.auth.getUser()).data.user
      if (currentUser) {
        try {
          await runFounderFlow(currentUser.id, currentUser.email ?? "")
        } catch { /* logged in founder flow */ }
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle()
        profileData = data
      }
    }

    if (!profileData) return

    if (profileData.status === "deleted") {
      await signOut()
      return
    }

    setProfile(profileData)

    const { data: workspaceData, error: wsError } = await supabase
      .from("workspaces")
      .select("*")
      .eq("id", profileData.workspace_id)
      .single()

    if (wsError) {
      console.error("[Auth] Failed to fetch workspace:", wsError.message, wsError)
      return
    }

    if (workspaceData) {
      setWorkspace(workspaceData)
    }
  }

  useEffect(() => {
    let cancelled = false

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (cancelled) return

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          if (event === 'SIGNED_IN') {
            try {
              await runFounderFlow(session.user.id, session.user.email ?? '')
            } catch { /* non-blocking */ }
            if (cancelled) return
          }
          fetchProfileAndWorkspace(session.user.id).finally(() => {
            if (!cancelled) setLoading(false)
          })
        } else {
          setProfile(null)
          setWorkspace(null)
          setLoading(false)
        }
      }
    )

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  async function refreshWorkspace() {
    const currentProfile = profile
    if (!currentProfile) return
    const { data, error } = await supabase
      .from("workspaces")
      .select("*")
      .eq("id", currentProfile.workspace_id)
      .single()
    if (error) {
      console.error("[Auth] Failed to refresh workspace:", error.message, error)
      return
    }
    if (data) setWorkspace(data)
  }

  async function refreshProfile() {
    const currentUser = user
    if (!currentUser) return
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .maybeSingle()
    if (error) {
      console.error("[Auth] Failed to refresh profile:", error.message, error)
      return
    }
    if (data) setProfile(data)
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
    setWorkspace(null)
  }

  return (
    <AuthContext.Provider value={{ user, session, workspace, profile, loading, signOut, refreshWorkspace, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
