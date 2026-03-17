import { useState, useMemo } from "react"
import { CalendarClock, CircleCheck, CircleX, ListCheck, ListX, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { TabGroup } from "@/components/ui/tab-group"
import { DataTableHeaderCell } from "@/components/ui/data-table-header-cell"
import { DataTableCell } from "@/components/ui/data-table-cell"
import { Badge } from "@/components/ui/badge"
import { Empty } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { BreadcrumbItem } from "@/components/ui/breadcrumb-item"
import { CreateTimeOffRecordModal } from "@/components/create-time-off-record-modal"
import { useTimeOffRequests, useUpdateRequestStatusMutation } from "@/hooks/use-time-off-requests"
import { useTimeOffCategories } from "@/hooks/use-time-off-categories"
import { getInitials } from "@/lib/utils"
import { addToast } from "@/lib/toast"
import type { TimeOffRequest, TimeOffStatus } from "@/types/time-off-request"

type TabValue = "all" | TimeOffStatus

const legacyTypeLabels: Record<string, string> = {
  vacation: "Vacation",
  sick_leave: "Sick Leave",
  personal: "Personal",
  bereavement: "Bereavement",
  other: "Other",
}

function formatPeriod(startDate: string, endDate: string) {
  const start = new Date(startDate)
  const end = new Date(endDate)

  const endFmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(end)

  if (startDate === endDate) return endFmt

  const sameYear = start.getFullYear() === end.getFullYear()
  const startFmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" as const }),
  }).format(start)

  return `${startFmt} - ${endFmt}`
}

function calculateDays(startDate: string, endDate: string) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
}

export function RequestsPage() {
  const [activeTab, setActiveTab] = useState<TabValue>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const { data: requests = [], isLoading, isError, refetch } = useTimeOffRequests()
  const { data: categories = [] } = useTimeOffCategories()
  const statusMutation = useUpdateRequestStatusMutation()

  const categoryMap = useMemo(() => {
    const map = new Map<string, { name: string; emoji?: string | null }>()
    for (const c of categories) map.set(c.id, { name: c.name, emoji: c.emoji })
    return map
  }, [categories])

  const counts = useMemo(() => {
    return {
      all: requests.length,
      pending: requests.filter((r) => r.status === "pending").length,
      approved: requests.filter((r) => r.status === "approved").length,
      rejected: requests.filter((r) => r.status === "rejected").length,
    }
  }, [requests])

  const filteredRequests = useMemo(() => {
    let result = requests
    if (activeTab !== "all") {
      result = result.filter((r) => r.status === activeTab)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (r) =>
          r.employee_name.toLowerCase().includes(q) ||
          r.employee_email.toLowerCase().includes(q) ||
          (r.comment?.toLowerCase().includes(q) ?? false)
      )
    }
    return result
  }, [requests, activeTab, searchQuery])

  const tabItems = [
    { value: "all", label: "All requests", badge: counts.all || undefined },
    { value: "pending", label: "Pending", badge: counts.pending || undefined },
    { value: "approved", label: "Approved", badge: counts.approved || undefined },
    { value: "rejected", label: "Rejected", badge: counts.rejected || undefined },
  ]

  function handleCreateRecord() {
    setCreateModalOpen(true)
  }

  function getCategoryDisplay(req: TimeOffRequest) {
    if (req.category_id) {
      const cat = categoryMap.get(req.category_id)
      if (cat) return `${cat.name}${cat.emoji ? ` ${cat.emoji}` : ""}`
    }
    return legacyTypeLabels[req.request_type] ?? "Other"
  }

  function handleApprove(req: TimeOffRequest) {
    statusMutation.mutate(
      { requestId: req.id, status: "approved" },
      {
        onSuccess: () => {
          addToast({
            title: "Request approved",
            description: `${req.employee_name}'s time-off request has been approved`,
          })
        },
      }
    )
  }

  function handleReject(req: TimeOffRequest) {
    statusMutation.mutate(
      { requestId: req.id, status: "rejected" },
      {
        onSuccess: () => {
          addToast({
            title: "Request rejected",
            description: `${req.employee_name}'s time-off request has been rejected`,
          })
        },
      }
    )
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
        <div className="flex items-center gap-3">
          <Button variant="secondary">Download report</Button>
          <Button onClick={handleCreateRecord}>
            <CalendarClock />
            Create time-off record
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-5 p-4">
        {/* Controls */}
        <div className="flex items-center justify-between">
          <TabGroup
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as TabValue)}
            items={tabItems}
          />
          <div className="relative w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search for requests..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border overflow-hidden">
          {/* Header row */}
          <div className="flex bg-secondary">
            <DataTableHeaderCell type="checkbox" className="w-10" />
            <DataTableHeaderCell type="text" label="Employee" className="flex-1" />
            <DataTableHeaderCell type="text" label="Period" className="w-[200px]" />
            <DataTableHeaderCell type="text" label="Request type" className="w-[150px]" />
            <DataTableHeaderCell type="text" label="Comment" className="flex-1" />
            <DataTableHeaderCell type="text" label="Status" className="w-[110px]" />
            <DataTableHeaderCell type="text" className="w-24" />
          </div>

          {/* Body */}
          {isLoading && requests.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          ) : isError && requests.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Empty
                media={{ type: "icon", icon: ListX }}
                title="Unable to load requests"
                description="Something went wrong. Please try again."
                content={{
                  layout: "single",
                  primaryAction: {
                    label: "Retry",
                    onClick: () => refetch(),
                  },
                }}
              />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Empty
                media={{ type: "icon", icon: ListX }}
                title={searchQuery ? "No requests found" : "No requests yet"}
                description={
                  searchQuery
                    ? "Try adjusting your search terms"
                    : "It looks like your team is hard at work. This is where you'll see and manage all time-off requests once they arrive"
                }
                content={
                  searchQuery
                    ? undefined
                    : {
                        layout: "single",
                        primaryAction: {
                          label: "Create time-off record",
                          icon: CalendarClock,
                          onClick: handleCreateRecord,
                        },
                      }
                }
              />
            </div>
          ) : (
            <div>
              {filteredRequests.map((req) => {
                const days = calculateDays(req.start_date, req.end_date)
                const nameParts = req.employee_name.split(" ")
                const initials = getInitials(nameParts[0], nameParts.slice(1).join(" "))

                return (
                  <div key={req.id} className="flex hover:bg-muted/50">
                    <DataTableCell
                      type="checkbox"
                      size="md"
                      className="w-10"
                    />
                    <DataTableCell
                      type="avatar"
                      size="md"
                      className="flex-1"
                      avatarSrc={req.employee_avatar_url}
                      avatarAlt={req.employee_name}
                      avatarFallback={initials}
                      label={req.employee_name}
                    />
                    <DataTableCell
                      type="text-description"
                      size="md"
                      className="w-[200px]"
                      label={formatPeriod(req.start_date, req.end_date)}
                      description={`${days} ${days === 1 ? "day" : "days"}`}
                    />
                    <DataTableCell
                      type="text"
                      size="md"
                      className="w-[150px]"
                      labelClassName="font-medium"
                      label={getCategoryDisplay(req)}
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
                    <div className="relative flex items-center justify-end gap-2 w-24 h-[72px] px-3 py-2">
                      {req.status === "pending" && (
                        <>
                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => handleApprove(req)}
                            disabled={statusMutation.isPending}
                          >
                            <CircleCheck className="size-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => handleReject(req)}
                            disabled={statusMutation.isPending}
                          >
                            <CircleX className="size-4" />
                          </Button>
                        </>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 border-b border-border" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <CreateTimeOffRecordModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />
    </div>
  )
}
