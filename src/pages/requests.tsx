import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { CalendarClock, ListX, Search } from "lucide-react"

import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { TabGroup } from "@/components/ui/tab-group"
import { DataTableHeaderCell } from "@/components/ui/data-table-header-cell"
import { Empty } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import type { TimeOffRequest, TimeOffStatus } from "@/types/time-off-request"

type TabValue = "all" | TimeOffStatus

export function RequestsPage() {
  const navigate = useNavigate()
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
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <Breadcrumb
          items={[
            { text: "Home", onClick: () => navigate("/dashboard") },
            { text: "Requests", current: true },
          ]}
        />
        <div className="flex items-center gap-2">
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
