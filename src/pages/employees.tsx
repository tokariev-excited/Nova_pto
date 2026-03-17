import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
  Users,
  UserPlus,
  UserSearch,
  Search,
  PencilLine,
  UserMinus,
  UserCheck,
  Trash2,
  EllipsisIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { TabGroup } from "@/components/ui/tab-group"
import { DataTableHeaderCell } from "@/components/ui/data-table-header-cell"
import { DataTableCell } from "@/components/ui/data-table-cell"
import { Badge } from "@/components/ui/badge"
import { Empty } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { BreadcrumbItem } from "@/components/ui/breadcrumb-item"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import { ComboboxMenu } from "@/components/ui/combobox-menu"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { useAuth, type Profile } from "@/contexts/auth-context"
import {
  useEmployeeList,
  useEmployeeCounts,
  useEmployeeStatusMutation,
  useDeleteEmployeeMutation,
} from "@/hooks/use-employees"
import { useDepartments } from "@/hooks/use-departments"
import { getInitials, getDisplayName } from "@/lib/utils"
import { addToast } from "@/lib/toast"
import type { EmployeeStatus } from "@/types/employee"

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
  const { profile: currentProfile } = useAuth()

  const [activeTab, setActiveTab] = useState<TabValue>("active")
  const [searchQuery, setSearchQuery] = useState("")

  // Dropdown state
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null)

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null)

  // Query hooks
  const { data: employees = [], isLoading: loading } = useEmployeeList(activeTab)
  const { data: counts = { active: 0, inactive: 0, deleted: 0 } } = useEmployeeCounts()
  const { data: departments = [] } = useDepartments()
  const statusMutation = useEmployeeStatusMutation()
  const deleteMutation = useDeleteEmployeeMutation()

  const departmentMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const d of departments) {
      map.set(d.id, d.name)
    }
    return map
  }, [departments])

  // Filter out workspace owner and apply search
  const filteredEmployees = useMemo(() => {
    let list = employees as Profile[]
    if (currentProfile) {
      list = list.filter((e) => e.id !== currentProfile.id)
    }
    if (!searchQuery.trim()) return list
    const q = searchQuery.toLowerCase()
    return list.filter(
      (e) =>
        getDisplayName(e.first_name, e.last_name).toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q)
    )
  }, [employees, searchQuery, currentProfile])

  // Adjust counts to exclude workspace owner
  const adjustedCounts = useMemo(() => {
    if (!currentProfile) return counts
    const adjusted = { ...counts }
    if (adjusted[currentProfile.status] > 0) {
      adjusted[currentProfile.status] -= 1
    }
    return adjusted
  }, [counts, currentProfile])

  const tabItems = [
    { value: "active", label: "Active", badge: adjustedCounts.active || undefined },
    {
      value: "inactive",
      label: "Inactive",
      badge: adjustedCounts.inactive || undefined,
    },
    { value: "deleted", label: "Deleted", badge: adjustedCounts.deleted || undefined },
  ]

  function handleAddEmployee() {
    navigate("/employees/new")
  }

  function handleDeactivate(emp: Profile) {
    statusMutation.mutate(
      { employeeId: emp.id, status: "inactive" },
      {
        onSuccess: () => {
          addToast({
            title: "Employee deactivated",
            description: `${getDisplayName(emp.first_name, emp.last_name) || emp.email} has been deactivated`,
          })
        },
      }
    )
  }

  function handleActivate(emp: Profile) {
    statusMutation.mutate(
      { employeeId: emp.id, status: "active" },
      {
        onSuccess: () => {
          addToast({
            title: "Employee activated",
            description: `${getDisplayName(emp.first_name, emp.last_name) || emp.email} is now back in the Active list`,
          })
        },
      }
    )
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        addToast({
          title: "Employee deleted",
          description: `${getDisplayName(deleteTarget.first_name, deleteTarget.last_name) || deleteTarget.email} has been deleted`,
        })
        setDeleteTarget(null)
      },
    })
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
              className="w-[260px]"
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
            <DataTableHeaderCell type="text" className="w-[56px]" />
          </div>

          {/* Body */}
          {loading && filteredEmployees.length === 0 ? (
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
                <div
                  key={emp.id}
                  className={`flex hover:bg-muted/50${emp.status === "active" ? " cursor-pointer" : ""}`}
                  onClick={() => {
                    if (emp.status === "active") {
                      navigate(`/employees/${emp.id}/edit`)
                    }
                  }}
                >
                  <div onClick={(e) => e.stopPropagation()}>
                    <DataTableCell
                      type="checkbox"
                      size="md"
                      className="w-10"
                    />
                  </div>
                  <DataTableCell
                    type="avatar"
                    size="md"
                    className="flex-1"
                    avatarSrc={emp.avatar_url ?? undefined}
                    avatarAlt={
                      getDisplayName(emp.first_name, emp.last_name) ||
                      emp.email
                    }
                    avatarFallback={getInitials(
                      emp.first_name,
                      emp.last_name
                    )}
                    label={
                      getDisplayName(emp.first_name, emp.last_name) || "—"
                    }
                  />
                  <DataTableCell
                    type="text"
                    size="md"
                    className="w-[260px]"
                    label={emp.email}
                  />
                  <DataTableCell
                    type="text"
                    size="md"
                    className="w-[180px]"
                    labelClassName="font-medium"
                    label={
                      emp.department_id
                        ? departmentMap.get(emp.department_id) ?? "—"
                        : "—"
                    }
                  />
                  <DataTableCell
                    type="badge"
                    size="md"
                    className="w-[100px]"
                    badgeNode={
                      <Badge variant="secondary">
                        {emp.role === "admin" ? "Admin" : "User"}
                      </Badge>
                    }
                  />
                  <DataTableCell
                    type="text"
                    size="md"
                    className="w-[160px]"
                    label={emp.location ?? "—"}
                  />
                  <DataTableCell
                    type="text"
                    size="md"
                    className="w-[120px]"
                    label={formatDate(emp.hire_date)}
                  />
                  <div
                    className="relative flex items-center justify-center w-[56px] h-[72px] px-3 py-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Popover
                      open={openPopoverId === emp.id}
                      onOpenChange={(open) =>
                        setOpenPopoverId(open ? emp.id : null)
                      }
                    >
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <EllipsisIcon className="size-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        align="end"
                        className="p-0 border-0 shadow-none"
                      >
                        <ComboboxMenu
                          groups={
                            emp.status === "active"
                              ? [
                                  {
                                    items: [
                                      {
                                        type: "icon",
                                        icon: (
                                          <PencilLine className="size-4" />
                                        ),
                                        label: "Edit details",
                                        onClick: () => {
                                          setOpenPopoverId(null)
                                          navigate(
                                            `/employees/${emp.id}/edit`
                                          )
                                        },
                                      },
                                      {
                                        type: "icon",
                                        icon: (
                                          <UserMinus className="size-4" />
                                        ),
                                        label: "Deactivate",
                                        onClick: () => {
                                          setOpenPopoverId(null)
                                          handleDeactivate(emp)
                                        },
                                      },
                                    ],
                                  },
                                  {
                                    items: [
                                      {
                                        type: "icon",
                                        variant: "destructive",
                                        icon: (
                                          <Trash2 className="size-4" />
                                        ),
                                        label: "Delete employee",
                                        onClick: () => {
                                          setOpenPopoverId(null)
                                          setDeleteTarget(emp)
                                        },
                                      },
                                    ],
                                  },
                                ]
                              : [
                                  {
                                    items: [
                                      {
                                        type: "icon",
                                        icon: (
                                          <UserCheck className="size-4" />
                                        ),
                                        label: "Activate",
                                        onClick: () => {
                                          setOpenPopoverId(null)
                                          handleActivate(emp)
                                        },
                                      },
                                    ],
                                  },
                                  {
                                    items: [
                                      {
                                        type: "icon",
                                        variant: "destructive",
                                        icon: (
                                          <Trash2 className="size-4" />
                                        ),
                                        label: "Delete employee",
                                        onClick: () => {
                                          setOpenPopoverId(null)
                                          setDeleteTarget(emp)
                                        },
                                      },
                                    ],
                                  },
                                ]
                          }
                        />
                      </PopoverContent>
                    </Popover>
                    <div className="absolute bottom-0 left-0 right-0 border-b border-border" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              {deleteTarget
                ? getDisplayName(
                    deleteTarget.first_name,
                    deleteTarget.last_name
                  ) || deleteTarget.email
                : ""}
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
