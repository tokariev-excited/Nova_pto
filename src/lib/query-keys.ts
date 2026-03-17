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

export const holidayKeys = {
  all: (workspaceId: string) => ["holidays", workspaceId] as const,
  list: (workspaceId: string) => ["holidays", workspaceId, "list"] as const,
}

export const timeOffRequestKeys = {
  all: (workspaceId: string) => ["timeOffRequests", workspaceId] as const,
  list: (workspaceId: string) => ["timeOffRequests", workspaceId, "list"] as const,
}

export const employeeBalanceKeys = {
  single: (employeeId: string, categoryId: string) =>
    ["employeeBalances", employeeId, categoryId] as const,
}

export const activeEmployeeKeys = {
  list: (workspaceId: string) => ["activeEmployees", workspaceId, "list"] as const,
}
