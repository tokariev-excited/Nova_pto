import { supabase } from "@/lib/supabase"

export async function runFounderFlow(userId: string, email: string) {
  // Check if profile already exists (returning user)
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("*, workspaces(*)")
    .eq("id", userId)
    .single()

  if (existingProfile) {
    return { isNewUser: false }
  }

  // First-time user — create workspace + profile
  const { data: workspace, error: wsError } = await supabase
    .from("workspaces")
    .insert({ name: "My Workspace" })
    .select()
    .single()

  if (wsError || !workspace) {
    throw new Error(wsError?.message ?? "Failed to create workspace")
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      workspace_id: workspace.id,
      role: "admin",
      email,
    })

  if (profileError) {
    throw new Error(profileError.message)
  }

  return { isNewUser: true }
}
