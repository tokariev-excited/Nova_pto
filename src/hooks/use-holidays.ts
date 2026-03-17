import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/contexts/auth-context"
import {
  fetchHolidays,
  deleteHoliday,
  replaceImportedHolidays,
} from "@/lib/holiday-service"
import type { ReplaceHolidayItem } from "@/lib/holiday-service"
import { holidayKeys } from "@/lib/query-keys"

export function useHolidays() {
  const { workspace } = useAuth()

  return useQuery({
    queryKey: holidayKeys.list(workspace?.id ?? ""),
    queryFn: () => fetchHolidays(workspace!.id),
    enabled: !!workspace,
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
