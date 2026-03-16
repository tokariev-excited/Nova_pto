import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/contexts/auth-context"
import {
  fetchTimeOffCategories,
  fetchCategory,
  createCategory,
  updateCategory,
  updateCategoryActive,
  deleteCategory,
  updateCategorySortOrder,
  type CreateCategoryData,
  type UpdateCategoryData,
} from "@/lib/time-off-category-service"
import type { TimeOffCategory } from "@/types/time-off-category"
import { timeOffCategoryKeys } from "@/lib/query-keys"

export function useTimeOffCategories() {
  const { workspace } = useAuth()

  return useQuery({
    queryKey: timeOffCategoryKeys.list(workspace?.id ?? ""),
    queryFn: () => fetchTimeOffCategories(workspace!.id),
    enabled: !!workspace,
  })
}

export function useToggleCategoryActiveMutation() {
  const queryClient = useQueryClient()
  const { workspace } = useAuth()

  return useMutation({
    mutationFn: ({ categoryId, isActive }: { categoryId: string; isActive: boolean }) =>
      updateCategoryActive(categoryId, isActive),
    onSuccess: () => {
      if (workspace) {
        queryClient.invalidateQueries({ queryKey: timeOffCategoryKeys.all(workspace.id) })
      }
    },
  })
}

export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient()
  const { workspace } = useAuth()

  return useMutation({
    mutationFn: (categoryId: string) => deleteCategory(categoryId),
    onSuccess: () => {
      if (workspace) {
        queryClient.invalidateQueries({ queryKey: timeOffCategoryKeys.all(workspace.id) })
      }
    },
  })
}

export function useCategory(id: string | undefined) {
  return useQuery({
    queryKey: timeOffCategoryKeys.detail(id ?? ""),
    queryFn: () => fetchCategory(id!),
    enabled: !!id,
  })
}

export function useCreateCategoryMutation() {
  const queryClient = useQueryClient()
  const { workspace } = useAuth()

  return useMutation({
    mutationFn: (data: CreateCategoryData) => createCategory(data),
    onSuccess: () => {
      if (workspace) {
        queryClient.invalidateQueries({ queryKey: timeOffCategoryKeys.all(workspace.id) })
      }
    },
  })
}

export function useUpdateCategoryMutation() {
  const queryClient = useQueryClient()
  const { workspace } = useAuth()

  return useMutation({
    mutationFn: ({ categoryId, data }: { categoryId: string; data: UpdateCategoryData }) =>
      updateCategory(categoryId, data),
    onSuccess: (_result, variables) => {
      if (workspace) {
        queryClient.invalidateQueries({ queryKey: timeOffCategoryKeys.all(workspace.id) })
      }
      queryClient.invalidateQueries({
        queryKey: timeOffCategoryKeys.detail(variables.categoryId),
      })
    },
  })
}

export function useReorderCategoriesMutation() {
  const queryClient = useQueryClient()
  const { workspace } = useAuth()

  return useMutation({
    mutationFn: (items: { id: string; sort_order: number }[]) =>
      updateCategorySortOrder(items),
    onMutate: async (items) => {
      if (!workspace) return

      const listKey = timeOffCategoryKeys.list(workspace.id)
      await queryClient.cancelQueries({ queryKey: listKey })

      const previous = queryClient.getQueryData<TimeOffCategory[]>(listKey)

      if (previous) {
        const orderMap = new Map(items.map((i) => [i.id, i.sort_order]))
        const updated = previous
          .map((cat) => ({
            ...cat,
            sort_order: orderMap.get(cat.id) ?? cat.sort_order,
          }))
          .sort((a, b) => a.sort_order - b.sort_order)

        queryClient.setQueryData(listKey, updated)
      }

      return { previous }
    },
    onError: (_err, _items, context) => {
      if (context?.previous && workspace) {
        queryClient.setQueryData(
          timeOffCategoryKeys.list(workspace.id),
          context.previous
        )
      }
    },
    onSettled: () => {
      if (workspace) {
        queryClient.invalidateQueries({
          queryKey: timeOffCategoryKeys.all(workspace.id),
        })
      }
    },
  })
}
