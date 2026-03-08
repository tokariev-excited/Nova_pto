import { supabase } from "@/lib/supabase"

export async function runFounderFlow(userId: string, email: string) {
  // Check if profile already exists (returning user)
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle()

  if (existingProfile) {
    return { isNewUser: false }
  }

  // First-time user — create workspace + profile
  // Generate UUID client-side to avoid needing SELECT after INSERT
  // (SELECT RLS depends on profile existing, which is a chicken-and-egg problem)
  const workspaceId = crypto.randomUUID()
  const { error: wsError } = await supabase
    .from("workspaces")
    .insert({ id: workspaceId, name: "My Workspace" })

  if (wsError) {
    throw new Error(wsError.message)
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      workspace_id: workspaceId,
      role: "admin",
      email,
      status: "active",
    })

  if (profileError) {
    throw new Error(profileError.message)
  }

  // Seed default departments (non-blocking)
  try {
    const defaultDepartments = ["Design", "HR", "Engineering", "Product", "Marketing"]
    await supabase.from("departments").insert(
      defaultDepartments.map((name) => ({ workspace_id: workspaceId, name }))
    )
  } catch {
    console.warn("Failed to seed default departments")
  }

  return { isNewUser: true }
}
