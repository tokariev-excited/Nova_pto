export type TimeOffStatus = "pending" | "approved" | "rejected"
export type TimeOffType = "vacation" | "sick_leave" | "personal" | "bereavement" | "other"

export interface TimeOffRequest {
  id: string
  profile_id: string
  workspace_id: string
  category_id?: string | null
  employee_name: string
  employee_email: string
  employee_avatar_url?: string
  start_date: string
  end_date: string
  request_type: TimeOffType
  status: TimeOffStatus
  comment?: string
  created_at: string
  updated_at: string
}
