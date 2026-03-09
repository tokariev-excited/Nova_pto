import { useState, useEffect, useMemo, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Users, UserPlus, UserSearch, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { TabGroup } from "@/components/ui/tab-group"
import { DataTableHeaderCell } from "@/components/ui/data-table-header-cell"
import { DataTableCell } from "@/components/ui/data-table-cell"
import { Badge } from "@/components/ui/badge"
import { Empty } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { BreadcrumbItem } from "@/components/ui/breadcrumb-item"
import { useAuth, type Profile } from "@/contexts/auth-context"
import { fetchEmployees, fetchEmployeeCounts } from "@/lib/employee-service"
import { fetchDepartments } from "@/lib/settings-service"
import { getInitials, getDisplayName } from "@/lib/utils"
import type { EmployeeStatus } from "@/types/employee"
import type { Department } from "@/types/department"

type TabValue = EmployeeStatus

function formatDate(dateStr?: string) {
  if (!dateStr) return "—"
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateStr))
}

export function EmployeesPage() {
  const navigate = useNavigate()
  const { workspace } = useAuth()

  const [activeTab, setActiveTab] = useState<TabValue>("active")
  const [searchQuery, setSearchQuery] = useState("")
  const [employees, setEmployees] = useState<Profile[]>([])
  const [counts, setCounts] = useState<Record<EmployeeStatus, number>>({
    active: 0,
    inactive: 0,
    deleted: 0,
  })
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)

  const departmentMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const d of departments) {
      map.set(d.id, d.name)
    }
    return map
  }, [departments])

  const loadEmployees = useCallback(
    async (status: EmployeeStatus) => {
      if (!workspace) return
      setLoading(true)
      try {
        const { data } = await fetchEmployees(workspace.id, status, 0, 100)
        setEmployees(data as Profile[])
      } catch (err) {
        console.error("Failed to fetch employees:", err)
      } finally {
        setLoading(false)
      }
    },
    [workspace]
  )

  const loadCounts = useCallback(async () => {
    if (!workspace) return
    try {
      const c = await fetchEmployeeCounts(workspace.id)
      setCounts(c)
    } catch (err) {
      console.error("Failed to fetch counts:", err)
    }
  }, [workspace])

  // Initial load
  useEffect(() => {
    if (!workspace) return
    loadEmployees(activeTab)
    loadCounts()
    fetchDepartments(workspace.id).then(setDepartments).catch(console.error)
  }, [workspace])

  // Reload on tab change
  useEffect(() => {
    loadEmployees(activeTab)
  }, [activeTab, loadEmployees])

  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees
    const q = searchQuery.toLowerCase()
    return employees.filter(
      (e) =>
        getDisplayName(e.first_name, e.last_name).toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q)
    )
  }, [employees, searchQuery])

  const tabItems = [
    { value: "active", label: "Active", badge: counts.active || undefined },
    {
      value: "inactive",
      label: "Inactive",
      badge: counts.inactive || undefined,
    },
    { value: "deleted", label: "Deleted", badge: counts.deleted || undefined },
  ]

  function handleAddEmployee() {
    navigate("/dashboard/employees/new")
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
        <BreadcrumbItem
          text="Employees"
          className="flex-1 text-foreground font-medium"
        />
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
            <DataTableHeaderCell
              type="text"
              label="Employee"
              className="flex-1"
            />
            <DataTableHeaderCell
              type="text"
              label="Email"
              className="w-[220px]"
            />
            <DataTableHeaderCell
              type="text"
              label="Department"
              className="w-[180px]"
            />
            <DataTableHeaderCell
              type="text"
              label="Role"
              className="w-[100px]"
            />
            <DataTableHeaderCell
              type="text"
              label="Location"
              className="w-[160px]"
            />
            <DataTableHeaderCell
              type="text"
              label="Hire date"
              className="w-[120px]"
            />
            <div className="w-[56px]" />
          </div>

          {/* Body */}
          {loading && employees.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-sm text-muted-foreground">Loading…</p>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Empty
                media={{ type: "icon", icon: UserSearch }}
                title={
                  searchQuery
                    ? "No employees found"
                    : "No employees added yet"
                }
                description={
                  searchQuery
                    ? "Try adjusting your search terms"
                    : "Start building your team to manage their time off, balances, and accrual rules"
                }
                content={
                  searchQuery
                    ? undefined
                    : {
                        layout: "single",
                        primaryAction: {
                          label: "Add employee",
                          icon: UserPlus,
                          onClick: handleAddEmployee,
                        },
                      }
                }
              />
            </div>
          ) : (
            <div>
              {filteredEmployees.map((emp) => (
                <div key={emp.id} className="flex">
                  <DataTableCell
                    type="checkbox"
                    className="w-10"
                  />
                  <DataTableCell
                    type="avatar-description"
                    className="flex-1"
                    avatarSrc={emp.avatar_url ?? undefined}
                    avatarAlt={getDisplayName(emp.first_name, emp.last_name) || emp.email}
                    avatarFallback={getInitials(emp.first_name, emp.last_name)}
                    label={getDisplayName(emp.first_name, emp.last_name) || "—"}
                    description={emp.email}
                  />
                  <DataTableCell
                    type="text"
                    className="w-[220px]"
                    label={emp.email}
                  />
                  <DataTableCell
                    type="text"
                    className="w-[180px]"
                    label={
                      emp.department_id
                        ? departmentMap.get(emp.department_id) ?? "—"
                        : "—"
                    }
                  />
                  <DataTableCell
                    type="badge"
                    className="w-[100px]"
                    badgeNode={
                      <Badge variant="secondary">
                        {emp.role === "admin" ? "Admin" : "User"}
                      </Badge>
                    }
                  />
                  <DataTableCell
                    type="text"
                    className="w-[160px]"
                    label={emp.location ?? "—"}
                  />
                  <DataTableCell
                    type="text"
                    className="w-[120px]"
                    label={formatDate(emp.hire_date)}
                  />
                  <DataTableCell
                    type="ellipsis"
                    className="w-[56px]"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
