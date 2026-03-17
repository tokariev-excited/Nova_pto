import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"
import {
  fetchTimeOffRequests,
  fetchEmployeeBalance,
  createTimeOffRecord,
  updateTimeOffRequestStatus,
  fetchActiveEmployeesForCombobox,
  type CreateTimeOffRecordParams,
} from "@/lib/time-off-request-service"
import type { TimeOffStatus } from "@/types/time-off-request"
import { timeOffRequestKeys, employeeBalanceKeys, activeEmployeeKeys } from "@/lib/query-keys"

export function useTimeOffRequests() {
  const { workspace } = useAuth()

  return useQuery({
    queryKey: timeOffRequestKeys.list(workspace?.id ?? ""),
    queryFn: () => fetchTimeOffRequests(workspace!.id),
    enabled: !!workspace,
    placeholderData: keepPreviousData,
  })
}

export function useEmployeeBalance(
  employeeId: string | undefined,
  categoryId: string | undefined
) {
  return useQuery({
    queryKey: employeeBalanceKeys.single(employeeId ?? "", categoryId ?? ""),
    queryFn: () => fetchEmployeeBalance(employeeId!, categoryId!),
    enabled: !!employeeId && !!categoryId,
  })
}

export function useCreateTimeOffRecordMutation() {
  const queryClient = useQueryClient()
  const { workspace } = useAuth()

  return useMutation({
    mutationFn: (params: CreateTimeOffRecordParams) => createTimeOffRecord(params),
    onSuccess: (_data, variables) => {
      if (workspace) {
        queryClient.invalidateQueries({ queryKey: timeOffRequestKeys.all(workspace.id) })
      }
      queryClient.invalidateQueries({
        queryKey: employeeBalanceKeys.single(variables.employee_id, variables.category_id),
      })
    },
  })
}

export function useUpdateRequestStatusMutation() {
  const queryClient = useQueryClient()
  const { workspace } = useAuth()

  return useMutation({
    mutationFn: ({ requestId, status }: { requestId: string; status: TimeOffStatus }) =>
      updateTimeOffRequestStatus(requestId, status),
    onSuccess: () => {
      if (workspace) {
        queryClient.invalidateQueries({ queryKey: timeOffRequestKeys.all(workspace.id) })
      }
    },
  })
}

export function usePendingRequestCount() {
  const { workspace } = useAuth()

  return useQuery({
    queryKey: timeOffRequestKeys.list(workspace?.id ?? ""),
    queryFn: () => fetchTimeOffRequests(workspace!.id),
    enabled: !!workspace,
    select: (data) => data.filter((r) => r.status === "pending").length,
  })
}

export function useActiveEmployees() {
  const { workspace } = useAuth()

  return useQuery({
    queryKey: activeEmployeeKeys.list(workspace?.id ?? ""),
    queryFn: () => fetchActiveEmployeesForCombobox(workspace!.id),
    enabled: !!workspace,
    placeholderData: keepPreviousData,
  })
}
