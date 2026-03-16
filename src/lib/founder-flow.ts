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
    .insert({ id: workspaceId, name: "My Workspace", owner_id: userId })

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

  // Seed default time-off categories (non-blocking)
  try {
    await supabase.from("time_off_categories").insert([
      {
        workspace_id: workspaceId,
        name: "Sick leave",
        emoji: "🤒",
        leave_type: "paid",
        accrual_method: "fixed",
        amount_value: 10,
        granting_frequency: "yearly",
        sort_order: 0,
      },
      {
        workspace_id: workspaceId,
        name: "Vacation",
        emoji: "🏖️",
        leave_type: "paid",
        accrual_method: "fixed",
        amount_value: 20,
        granting_frequency: "yearly",
        sort_order: 1,
      },
      {
        workspace_id: workspaceId,
        name: "Business trip",
        emoji: "💼",
        leave_type: "paid",
        accrual_method: "unlimited",
        sort_order: 2,
      },
      {
        workspace_id: workspaceId,
        name: "Loyalty vacation",
        emoji: "👑",
        leave_type: "paid",
        accrual_method: "anniversary",
        amount_value: 1,
        anniversary_years: 1,
        sort_order: 3,
      },
      {
        workspace_id: workspaceId,
        name: "Unpaid leave",
        emoji: "💸",
        leave_type: "unpaid",
        accrual_method: "unlimited",
        sort_order: 4,
      },
      {
        workspace_id: workspaceId,
        name: "Sabbatical",
        emoji: "📚",
        leave_type: "unpaid",
        accrual_method: "fixed",
        amount_value: 90,
        waiting_period_value: 3,
        waiting_period_unit: "year",
        sort_order: 5,
      },
    ])
  } catch {
    console.warn("Failed to seed default time-off categories")
  }

  return { isNewUser: true }
}
