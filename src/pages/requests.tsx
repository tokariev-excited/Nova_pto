import { useState, useMemo } from "react"
import { CalendarClock, ListCheck, ListX, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { TabGroup } from "@/components/ui/tab-group"
import { DataTableHeaderCell } from "@/components/ui/data-table-header-cell"
import { Empty } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { BreadcrumbItem } from "@/components/ui/breadcrumb-item"
import type { TimeOffRequest, TimeOffStatus } from "@/types/time-off-request"

type TabValue = "all" | TimeOffStatus

export function RequestsPage() {
  const [activeTab, setActiveTab] = useState<TabValue>("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Will be populated by Supabase fetching later
  const requests: TimeOffRequest[] = []

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
          r.employee_email.toLowerCase().includes(q)
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
    // TODO: open create time-off record modal
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
            <div className="w-24" />
          </div>

          {/* Body */}
          {filteredRequests.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Empty
                media={{ type: "icon", icon: ListX }}
                title="No requests yet"
                description="It looks like your team is hard at work. This is where you'll see and manage all time-off requests once they arrive"
                content={{
                  layout: "single",
                  primaryAction: {
                    label: "Create time-off record",
                    icon: CalendarClock,
                    onClick: handleCreateRecord,
                  },
                }}
              />
            </div>
          ) : (
            <div>
              {/* Future: table rows */}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
