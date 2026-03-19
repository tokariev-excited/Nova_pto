import { useState, useMemo } from "react"
import { CalendarClock, FileSearch, ListCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { DataTableHeaderCell } from "@/components/ui/data-table-header-cell"
import { DataTableCell } from "@/components/ui/data-table-cell"
import { Badge } from "@/components/ui/badge"
import { BreadcrumbItem } from "@/components/ui/breadcrumb-item"
import { SubmitTimeOffRequestModal } from "@/components/submit-time-off-request-modal"
import { useMyTimeOffRequests, useEmployeeBalances } from "@/hooks/use-time-off-requests"
import { useTimeOffCategories } from "@/hooks/use-time-off-categories"
import { useAuth } from "@/hooks/use-auth"
import { formatPeriod, formatDays } from "@/lib/date-utils"
import { getCategoryDisplay } from "@/lib/request-display"

export function EmployeeRequestsPage() {
  const [requestModalOpen, setRequestModalOpen] = useState(false)

  const { profile } = useAuth()
  const { data: myRequests = [], isLoading } = useMyTimeOffRequests()
  const { data: balances = [] } = useEmployeeBalances(profile?.id)
  const { data: categories = [] } = useTimeOffCategories()

  const balanceMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const b of balances) map.set(b.category_id, b.remaining_days)
    return map
  }, [balances])

  const categoryMap = useMemo(() => {
    const map = new Map<string, { name: string; emoji?: string | null }>()
    for (const c of categories) map.set(c.id, { name: c.name, emoji: c.emoji })
    return map
  }, [categories])

  const activeCategories = useMemo(
    () => categories.filter((c) => c.is_active).sort((a, b) => a.sort_order - b.sort_order),
    [categories]
  )

  function getBalanceDisplay(categoryId: string, accrualMethod: string): string {
    if (accrualMethod === "unlimited") return "Unlimited"
    const days = balanceMap.get(categoryId)
    if (days === undefined) return "—"
    return `${days} ${days === 1 ? "day" : "days"}`
  }

  return (
    <div className="flex flex-col size-full">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 h-[60px] shrink-0">
        <button className="flex items-center justify-center size-7 rounded-[10px] shrink-0 text-foreground hover:bg-accent transition-colors">
          <ListCheck className="size-4" />
        </button>
        <div className="flex items-center h-6 pr-2 relative shrink-0">
          <Separator orientation="vertical" />
        </div>
        <BreadcrumbItem text="Requests" className="flex-1 text-foreground font-medium" />
        <Button onClick={() => setRequestModalOpen(true)}>
          <CalendarClock />
          Request time off
        </Button>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-5 p-4">
        {/* Balance Overview */}
        <div className="flex flex-col gap-3">
          <p className="text-lg font-semibold tracking-tight text-primary">Balance overview</p>
          <div className="flex gap-4 overflow-x-auto">
            {activeCategories.map((cat) => (
              <div
                key={cat.id}
                className="bg-card border border-border rounded-xl shadow-xs px-6 py-4 flex flex-col gap-2 flex-1 min-w-[140px]"
              >
                <p className="text-sm font-medium tracking-tight text-foreground">
                  {cat.name}{cat.emoji ? ` ${cat.emoji}` : ""}
                </p>
                <p className="text-2xl font-medium tracking-tight text-foreground whitespace-nowrap">
                  {getBalanceDisplay(cat.id, cat.accrual_method)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Time Off History */}
        <div className="flex flex-col gap-3">
          <p className="text-lg font-semibold tracking-tight text-primary">Time off history</p>
          <div className="rounded-xl border border-border overflow-hidden">
            {/* Header row */}
            <div className="flex bg-secondary">
              <DataTableHeaderCell type="checkbox" className="w-10" />
              <DataTableHeaderCell type="text" label="Request category" className="flex-1" />
              <DataTableHeaderCell type="text" label="Period" className="w-[200px]" />
              <DataTableHeaderCell type="text" label="Comment" className="flex-1" />
              <DataTableHeaderCell type="text" label="Status" className="w-[110px]" />
              <div className="bg-secondary border-b border-border w-14 shrink-0" />
            </div>

            {/* Body */}
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="size-5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
              </div>
            ) : myRequests.length === 0 ? (
              <div className="flex flex-col items-center gap-6 py-12">
                <div className="flex flex-col items-center gap-2 max-w-sm">
                  <div className="flex items-center justify-center bg-muted rounded-[10px] p-2">
                    <FileSearch className="size-6 text-foreground" />
                  </div>
                  <div className="flex flex-col gap-2 text-center">
                    <p className="text-lg font-medium tracking-tight text-foreground">
                      No time off history yet
                    </p>
                    <p className="text-sm text-muted-foreground tracking-tight">
                      You haven't requested any time off yet. Ready for a break? Check your balance above and submit your first request
                    </p>
                  </div>
                </div>
                <Button onClick={() => setRequestModalOpen(true)}>
                  <CalendarClock />
                  Request time off
                </Button>
              </div>
            ) : (
              <div>
                {myRequests.map((req) => (
                  <div key={req.id} className="flex hover:bg-muted/50">
                    <DataTableCell type="checkbox" size="md" className="w-10" />
                    <DataTableCell
                      type="text"
                      size="md"
                      className="flex-1"
                      labelClassName="font-medium"
                      label={getCategoryDisplay(req, categoryMap)}
                    />
                    <DataTableCell
                      type="text-description"
                      size="md"
                      className="w-[200px]"
                      label={formatPeriod(req.start_date, req.end_date)}
                      description={formatDays(req.total_days)}
                    />
                    <DataTableCell
                      type="text"
                      size="md"
                      className="flex-1"
                      label={req.comment ?? "—"}
                    />
                    <DataTableCell
                      type="badge"
                      size="md"
                      className="w-[110px]"
                      badgeNode={
                        <Badge variant={req.status}>
                          {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                        </Badge>
                      }
                    />
                    <div className="relative flex items-center w-14 h-[72px] px-3 py-2">
                      <div className="absolute bottom-0 left-0 right-0 border-b border-border" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <SubmitTimeOffRequestModal
        open={requestModalOpen}
        onOpenChange={setRequestModalOpen}
      />
    </div>
  )
}
