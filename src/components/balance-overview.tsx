import { useMemo } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useTimeOffCategories } from "@/hooks/use-time-off-categories"
import { useEmployeeBalances } from "@/hooks/use-time-off-requests"

function BalanceCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl shadow-xs px-5 py-4 flex flex-col gap-2">
      <div className="h-5 w-24 bg-muted rounded animate-pulse" />
      <div className="h-7 w-16 bg-muted rounded animate-pulse" />
    </div>
  )
}

export function BalanceOverview() {
  const { profile } = useAuth()
  const { data: categories = [], isLoading: categoriesLoading } = useTimeOffCategories()
  const { data: balances = [], isLoading: balancesLoading } = useEmployeeBalances(profile?.id)

  const balanceMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const b of balances) map.set(b.category_id, b.remaining_days)
    return map
  }, [balances])

  const activeCategories = useMemo(
    () => categories.filter((c) => c.is_active).sort((a, b) => a.sort_order - b.sort_order),
    [categories]
  )

  const isLoading = (categoriesLoading && categories.length === 0) || (balancesLoading && balances.length === 0)

  function getBalanceDisplay(categoryId: string, accrualMethod: string): string {
    if (accrualMethod === "unlimited") return "Unlimited"
    const days = balanceMap.get(categoryId)
    if (days === undefined) return "—"
    return `${days} ${days === 1 ? "day" : "days"}`
  }

  if (!isLoading && activeCategories.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <p className="text-lg font-semibold tracking-tight text-primary">Balance overview</p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
        {isLoading
          ? Array.from({ length: 3 }, (_, i) => <BalanceCardSkeleton key={i} />)
          : activeCategories.map((cat) => (
              <div
                key={cat.id}
                className="bg-card border border-border rounded-xl shadow-xs px-5 py-4 flex flex-col gap-2"
              >
                <p className="text-sm font-medium tracking-[-0.28px] text-foreground">
                  {cat.name}{cat.emoji ? ` ${cat.emoji}` : ""}
                </p>
                <p className="text-xl font-medium tracking-[-0.4px] text-foreground whitespace-nowrap">
                  {getBalanceDisplay(cat.id, cat.accrual_method)}
                </p>
              </div>
            ))}
      </div>
    </div>
  )
}
