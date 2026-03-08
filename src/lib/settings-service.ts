import { supabase } from "@/lib/supabase"
import type { Department } from "@/types/department"

const ALLOWED_TYPES = ["image/png", "image/jpeg"]
const MAX_SIZE = 2 * 1024 * 1024 // 2 MB

export async function updateWorkspace(
  workspaceId: string,
  data: { name?: string; logo_url?: string | null }
) {
  const { error } = await supabase
    .from("workspaces")
    .update(data)
    .eq("id", workspaceId)
  if (error) throw error
}

export async function updateProfile(
  profileId: string,
  data: { full_name?: string; avatar_url?: string | null }
) {
  const { error } = await supabase
    .from("profiles")
    .update(data)
    .eq("id", profileId)
  if (error) throw error
}

export async function fetchDepartments(workspaceId: string): Promise<Department[]> {
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createDepartment(
  workspaceId: string,
  name: string
): Promise<Department> {
  const { data, error } = await supabase
    .from("departments")
    .insert({ workspace_id: workspaceId, name })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateDepartment(departmentId: string, name: string) {
  const { error } = await supabase
    .from("departments")
    .update({ name })
    .eq("id", departmentId)
  if (error) throw error
}

export async function deleteDepartment(departmentId: string) {
  const { error } = await supabase
    .from("departments")
    .delete()
    .eq("id", departmentId)
  if (error) throw error
}

function validateImage(file: File) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Only PNG and JPG files are allowed")
  }
  if (file.size > MAX_SIZE) {
    throw new Error("File must be under 2 MB")
  }
}

export async function uploadImage(
  bucket: string,
  folder: string,
  file: File
): Promise<string> {
  validateImage(file)

  const ext = file.name.split(".").pop() ?? "png"
  const path = `${folder}/${Date.now()}.${ext}`

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  })
  if (error) throw error

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export async function removeImage(bucket: string, publicUrl: string) {
  const marker = `/storage/v1/object/public/${bucket}/`
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return

  const path = publicUrl.slice(idx + marker.length)
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) throw error
}
