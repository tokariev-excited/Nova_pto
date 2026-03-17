import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"
import {
  fetchHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  replaceImportedHolidays,
} from "@/lib/holiday-service"
import type { ReplaceHolidayItem, UpdateHolidayData } from "@/lib/holiday-service"
import type { CreateHolidayData } from "@/types/holiday"
import { holidayKeys } from "@/lib/query-keys"

export function useHolidays() {
  const { workspace } = useAuth()

  return useQuery({
    queryKey: holidayKeys.list(workspace?.id ?? ""),
    queryFn: () => fetchHolidays(workspace!.id),
    enabled: !!workspace,
    placeholderData: keepPreviousData,
  })
}

export function useImportHolidaysMutation() {
  const queryClient = useQueryClient()
  const { workspace } = useAuth()

  return useMutation({
    mutationFn: async ({
      items,
    }: {
      countryCode: string
      year: number
      items: ReplaceHolidayItem[]
    }) => {
      if (!workspace) throw new Error("No workspace")
      await replaceImportedHolidays(workspace.id, items)
    },
    onSuccess: () => {
      if (workspace) {
        queryClient.invalidateQueries({ queryKey: holidayKeys.all(workspace.id) })
      }
    },
  })
}

export function useCreateHolidayMutation() {
  const queryClient = useQueryClient()
  const { workspace } = useAuth()

  return useMutation({
    mutationFn: (data: CreateHolidayData) => createHoliday(data),
    onSuccess: () => {
      if (workspace) {
        queryClient.invalidateQueries({ queryKey: holidayKeys.all(workspace.id) })
      }
    },
  })
}

export function useUpdateHolidayMutation() {
  const queryClient = useQueryClient()
  const { workspace } = useAuth()

  return useMutation({
    mutationFn: ({ holidayId, data }: { holidayId: string; data: UpdateHolidayData }) =>
      updateHoliday(holidayId, data),
    onSuccess: () => {
      if (workspace) {
        queryClient.invalidateQueries({ queryKey: holidayKeys.all(workspace.id) })
      }
    },
  })
}

export function useDeleteHolidayMutation() {
  const queryClient = useQueryClient()
  const { workspace } = useAuth()

  return useMutation({
    mutationFn: (holidayId: string) => deleteHoliday(holidayId),
    onSuccess: () => {
      if (workspace) {
        queryClient.invalidateQueries({ queryKey: holidayKeys.all(workspace.id) })
      }
    },
  })
}
