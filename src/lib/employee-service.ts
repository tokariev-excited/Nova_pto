import { supabase } from "@/lib/supabase"
import type { EmployeeStatus } from "@/types/employee"

export async function updateEmployeeStatus(
  employeeId: string,
  status: EmployeeStatus
) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ status })
    .eq("id", employeeId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function fetchEmployees(
  workspaceId: string,
  status: EmployeeStatus,
  page: number = 0,
  limit: number = 10
) {
  const from = page * limit
  const to = from + limit - 1

  const { data, error, count } = await supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .eq("workspace_id", workspaceId)
    .eq("status", status)
    .order("created_at", { ascending: false })
    .range(from, to)

  if (error) throw error
  return { data: data ?? [], count: count ?? 0 }
}

export async function fetchEmployeeCounts(workspaceId: string) {
  const statuses: EmployeeStatus[] = ["active", "inactive", "deleted"]
  const counts: Record<EmployeeStatus, number> = { active: 0, inactive: 0, deleted: 0 }

  for (const status of statuses) {
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("status", status)

    counts[status] = count ?? 0
  }

  return counts
}
