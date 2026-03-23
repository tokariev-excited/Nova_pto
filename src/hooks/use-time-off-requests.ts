import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"
import {
  fetchTimeOffRequests,
  fetchEmployeeBalance,
  fetchEmployeeBalances,
  createTimeOffRecord,
  updateTimeOffRequestStatus,
  approveTimeOffRequest,
  rejectTimeOffRequest,
  fetchActiveEmployeesForCombobox,
  fetchMyTimeOffRequests,
  submitTimeOffRequest,
  withdrawTimeOffRequest,
  type CreateTimeOffRecordParams,
  type SubmitTimeOffRequestParams,
} from "@/lib/time-off-request-service"
import type { TimeOffStatus } from "@/types/time-off-request"
import { timeOffRequestKeys, employeeBalanceKeys, activeEmployeeKeys, myRequestKeys } from "@/lib/query-keys"

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

export function useEmployeeBalances(employeeId: string | undefined) {
  return useQuery({
    queryKey: employeeBalanceKeys.allForEmployee(employeeId ?? ""),
    queryFn: () => fetchEmployeeBalances(employeeId!),
    enabled: !!employeeId,
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
        queryKey: employeeBalanceKeys.allForEmployee(variables.employee_id),
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

export function useRejectRequestMutation() {
  const queryClient = useQueryClient()
  const { workspace } = useAuth()

  return useMutation({
    mutationFn: ({ requestId, reason }: { requestId: string; reason: string }) =>
      rejectTimeOffRequest(requestId, reason),
    onSuccess: () => {
      if (workspace) {
        queryClient.invalidateQueries({ queryKey: timeOffRequestKeys.all(workspace.id) })
      }
    },
  })
}

export function useApproveRequestMutation() {
  const queryClient = useQueryClient()
  const { workspace } = useAuth()

  return useMutation({
    mutationFn: ({ requestId }: { requestId: string; profileId: string }) =>
      approveTimeOffRequest(requestId),
    onSuccess: (_data, variables) => {
      if (workspace) {
        queryClient.invalidateQueries({ queryKey: timeOffRequestKeys.all(workspace.id) })
      }
      queryClient.invalidateQueries({
        queryKey: employeeBalanceKeys.allForEmployee(variables.profileId),
      })
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

export function useMyTimeOffRequests() {
  const { profile, workspace } = useAuth()

  return useQuery({
    queryKey: myRequestKeys.list(profile?.id ?? "", workspace?.id ?? ""),
    queryFn: () => fetchMyTimeOffRequests(profile!.id, workspace!.id),
    enabled: !!profile && !!workspace,
    placeholderData: keepPreviousData,
  })
}

export function useWithdrawRequestMutation() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: (requestId: string) => withdrawTimeOffRequest(requestId),
    onSuccess: () => {
      if (profile) {
        queryClient.invalidateQueries({ queryKey: myRequestKeys.all(profile.id) })
      }
    },
  })
}

export function useSubmitTimeOffRequestMutation() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: (params: SubmitTimeOffRequestParams) => submitTimeOffRequest(params),
    onSuccess: () => {
      if (profile) {
        queryClient.invalidateQueries({ queryKey: myRequestKeys.all(profile.id) })
      }
    },
  })
}
