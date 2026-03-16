import type { EmployeeStatus } from "@/types/employee"

export const employeeKeys = {
  all: (workspaceId: string) => ["employees", workspaceId] as const,
  list: (workspaceId: string, status: EmployeeStatus) =>
    ["employees", workspaceId, "list", status] as const,
  counts: (workspaceId: string) =>
    ["employees", workspaceId, "counts"] as const,
  detail: (employeeId: string) => ["employees", "detail", employeeId] as const,
}

export const departmentKeys = {
  all: (workspaceId: string) => ["departments", workspaceId] as const,
}

export const timeOffCategoryKeys = {
  all: (workspaceId: string) => ["timeOffCategories", workspaceId] as const,
  list: (workspaceId: string) => ["timeOffCategories", workspaceId, "list"] as const,
  detail: (categoryId: string) => ["timeOffCategories", "detail", categoryId] as const,
}
