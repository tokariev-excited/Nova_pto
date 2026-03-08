import { useState, useMemo } from "react"
import { Users, UserPlus, UserSearch, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { TabGroup } from "@/components/ui/tab-group"
import { DataTableHeaderCell } from "@/components/ui/data-table-header-cell"
import { Empty } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { BreadcrumbItem } from "@/components/ui/breadcrumb-item"
import type { Profile } from "@/contexts/auth-context"
import type { EmployeeStatus } from "@/types/employee"

type TabValue = EmployeeStatus

export function EmployeesPage() {
  const [activeTab, setActiveTab] = useState<TabValue>("active")
  const [searchQuery, setSearchQuery] = useState("")

  // Will be populated by Supabase fetching later
  const employees: Profile[] = []

  const counts = useMemo(() => {
    return {
      active: employees.filter((e) => e.status === "active").length,
      inactive: employees.filter((e) => e.status === "inactive").length,
      deleted: employees.filter((e) => e.status === "deleted").length,
    }
  }, [employees])

  const filteredEmployees = useMemo(() => {
    let result = employees.filter((e) => e.status === activeTab)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (e) =>
          (e.full_name?.toLowerCase().includes(q) ?? false) ||
          e.email.toLowerCase().includes(q)
      )
    }
    return result
  }, [employees, activeTab, searchQuery])

  const tabItems = [
    { value: "active", label: "Active", badge: counts.active || undefined },
    { value: "inactive", label: "Inactive", badge: counts.inactive || undefined },
    { value: "deleted", label: "Deleted", badge: counts.deleted || undefined },
  ]

  function handleAddEmployee() {
    // TODO: open add employee modal
  }

  return (
    <div className="flex flex-col size-full">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 h-[60px] shrink-0">
        <button className="flex items-center justify-center size-7 rounded-[10px] shrink-0 text-foreground hover:bg-accent transition-colors">
          <Users className="size-4" />
        </button>
        <div className="flex items-center h-6 pr-2 relative shrink-0">
          <Separator orientation="vertical" />
        </div>
        <BreadcrumbItem text="Employees" className="flex-1 text-foreground font-medium" />
        <Button onClick={handleAddEmployee}>
          <UserPlus />
          Add employee
        </Button>
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
              placeholder="Search for employees..."
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
            <DataTableHeaderCell type="text" label="Email" className="w-[220px]" />
            <DataTableHeaderCell type="text" label="Department" className="w-[180px]" />
            <DataTableHeaderCell type="text" label="Role" className="w-[100px]" />
            <DataTableHeaderCell type="text" label="Location" className="w-[160px]" />
            <DataTableHeaderCell type="text" label="Hire date" className="w-[120px]" />
            <div className="w-[56px]" />
          </div>

          {/* Body */}
          {filteredEmployees.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Empty
                media={{ type: "icon", icon: UserSearch }}
                title="No employees added yet"
                description="Start building your team to manage their time off, balances, and accrual rules"
                content={{
                  layout: "single",
                  primaryAction: {
                    label: "Add employee",
                    icon: UserPlus,
                    onClick: handleAddEmployee,
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
