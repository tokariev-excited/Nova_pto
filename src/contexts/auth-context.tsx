import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { runFounderFlow } from "@/lib/founder-flow"

interface Workspace {
  id: string
  name: string
  created_at: string
}

interface Profile {
  id: string
  workspace_id: string
  role: string
  email: string
  created_at: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  workspace: Workspace | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfileAndWorkspace(userId: string) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (profileData) {
      setProfile(profileData)
      const { data: workspaceData } = await supabase
        .from("workspaces")
        .select("*")
        .eq("id", profileData.workspace_id)
        .single()

      if (workspaceData) {
        setWorkspace(workspaceData)
      }
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfileAndWorkspace(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          if (event === 'SIGNED_IN') {
            try {
              await runFounderFlow(session.user.id, session.user.email ?? '')
            } catch { /* non-blocking */ }
          }
          fetchProfileAndWorkspace(session.user.id)
        } else {
          setProfile(null)
          setWorkspace(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
    setWorkspace(null)
  }

  return (
    <AuthContext.Provider value={{ user, session, workspace, profile, loading, signOut }}>
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
