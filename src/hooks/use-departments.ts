import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/contexts/auth-context"
import { fetchDepartments } from "@/lib/settings-service"
import { departmentKeys } from "@/lib/query-keys"

export function useDepartments() {
  const { workspace } = useAuth()

  return useQuery({
    queryKey: departmentKeys.all(workspace?.id ?? ""),
    queryFn: () => fetchDepartments(workspace!.id),
    enabled: !!workspace,
  })
}
