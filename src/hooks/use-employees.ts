import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"
import {
  fetchEmployees,
  fetchEmployeeCounts,
  fetchEmployee,
  updateEmployee,
  updateEmployeeStatus,
  inviteEmployee,
  type UpdateEmployeeData,
  type InviteEmployeeData,
} from "@/lib/employee-service"
import { employeeKeys, departmentKeys } from "@/lib/query-keys"
import type { EmployeeStatus } from "@/types/employee"

export function useEmployeeList(status: EmployeeStatus) {
  const { workspace } = useAuth()

  return useQuery({
    queryKey: employeeKeys.list(workspace?.id ?? "", status),
    queryFn: () => fetchEmployees(workspace!.id, status, 0, 100),
    enabled: !!workspace,
    placeholderData: keepPreviousData,
    select: (result) => result.data,
  })
}

export function useEmployeeCounts() {
  const { workspace } = useAuth()

  return useQuery({
    queryKey: employeeKeys.counts(workspace?.id ?? ""),
    queryFn: () => fetchEmployeeCounts(workspace!.id),
    enabled: !!workspace,
    placeholderData: keepPreviousData,
  })
}

export function useEmployee(id: string | undefined) {
  return useQuery({
    queryKey: employeeKeys.detail(id ?? ""),
    queryFn: () => fetchEmployee(id!),
    enabled: !!id,
  })
}

export function useEmployeeStatusMutation() {
  const queryClient = useQueryClient()
  const { workspace } = useAuth()

  return useMutation({
    mutationFn: ({ employeeId, status }: { employeeId: string; status: EmployeeStatus }) =>
      updateEmployeeStatus(employeeId, status),
    onSuccess: (_data, variables) => {
      if (workspace) {
        // Invalidate counts and all status lists (employee moved between lists)
        queryClient.invalidateQueries({ queryKey: employeeKeys.counts(workspace.id) })
        queryClient.invalidateQueries({ queryKey: employeeKeys.list(workspace.id, variables.status) })
        // Also invalidate the previous list since the employee left it
        queryClient.invalidateQueries({ queryKey: employeeKeys.list(workspace.id, "active") })
        queryClient.invalidateQueries({ queryKey: employeeKeys.list(workspace.id, "inactive") })
      }
    },
  })
}

export function useDeleteEmployeeMutation() {
  const queryClient = useQueryClient()
  const { workspace } = useAuth()

  return useMutation({
    mutationFn: (employeeId: string) => updateEmployeeStatus(employeeId, "deleted"),
    onSuccess: () => {
      if (workspace) {
        queryClient.invalidateQueries({ queryKey: employeeKeys.counts(workspace.id) })
        queryClient.invalidateQueries({ queryKey: employeeKeys.list(workspace.id, "active") })
        queryClient.invalidateQueries({ queryKey: employeeKeys.list(workspace.id, "inactive") })
        queryClient.invalidateQueries({ queryKey: employeeKeys.list(workspace.id, "deleted") })
      }
    },
  })
}

export function useUpdateEmployeeMutation() {
  const queryClient = useQueryClient()
  const { workspace } = useAuth()

  return useMutation({
    mutationFn: ({ employeeId, data }: { employeeId: string; data: UpdateEmployeeData }) =>
      updateEmployee(employeeId, data),
    onSuccess: (_data, variables) => {
      if (workspace) {
        queryClient.invalidateQueries({ queryKey: employeeKeys.all(workspace.id) })
      }
      queryClient.invalidateQueries({ queryKey: employeeKeys.detail(variables.employeeId) })
    },
  })
}

export function useInviteEmployeeMutation() {
  const queryClient = useQueryClient()
  const { workspace } = useAuth()

  return useMutation({
    mutationFn: (data: InviteEmployeeData) => inviteEmployee(data),
    onSuccess: () => {
      if (workspace) {
        queryClient.invalidateQueries({ queryKey: employeeKeys.all(workspace.id) })
        queryClient.invalidateQueries({ queryKey: departmentKeys.all(workspace.id) })
      }
    },
  })
}
