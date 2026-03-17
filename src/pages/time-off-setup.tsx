import { useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { FileClock, Plus, CalendarSearch, CalendarArrowDown, Pencil, Trash2, EllipsisIcon } from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import type { DragEndEvent } from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { TabGroup } from "@/components/ui/tab-group"
import { DataTableHeaderCell } from "@/components/ui/data-table-header-cell"
import { DataTableCell } from "@/components/ui/data-table-cell"
import { Badge } from "@/components/ui/badge"
import { Empty } from "@/components/ui/empty"
import { BreadcrumbItem } from "@/components/ui/breadcrumb-item"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
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
import { SortableCategoryRow } from "@/components/sortable-category-row"
import { ImportHolidayModal } from "@/components/import-holiday-modal"
import { HolidayModal } from "@/components/holiday-modal"
import {
  useTimeOffCategories,
  useToggleCategoryActiveMutation,
  useDeleteCategoryMutation,
  useReorderCategoriesMutation,
} from "@/hooks/use-time-off-categories"
import { useHolidays, useDeleteHolidayMutation } from "@/hooks/use-holidays"
import { addToast } from "@/lib/toast"
import type { TimeOffCategory } from "@/types/time-off-category"
import type { Holiday } from "@/types/holiday"

type TabValue = "categories" | "holidays"

export function TimeOffSetupPage() {
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<TabValue>("categories")
  const [deleteTarget, setDeleteTarget] = useState<TimeOffCategory | null>(null)
  const [deleteHolidayTarget, setDeleteHolidayTarget] = useState<Holiday | null>(null)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [holidayModalOpen, setHolidayModalOpen] = useState(false)
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null)
  const [selectedHolidayIds, setSelectedHolidayIds] = useState<Set<string>>(new Set())
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null)

  const { data: categories = [], isLoading, isError: categoriesError, refetch: refetchCategories } = useTimeOffCategories()
  const toggleMutation = useToggleCategoryActiveMutation()
  const deleteMutation = useDeleteCategoryMutation()
  const reorderMutation = useReorderCategoriesMutation()

  const { data: holidays = [], isLoading: holidaysLoading, isError: holidaysError, refetch: refetchHolidays } = useHolidays()
  const deleteHolidayMutation = useDeleteHolidayMutation()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = categories.findIndex((c) => c.id === active.id)
      const newIndex = categories.findIndex((c) => c.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return

      const reordered = arrayMove(categories, oldIndex, newIndex)
      const items = reordered.map((cat, i) => ({ id: cat.id, sort_order: i }))
      reorderMutation.mutate(items)
    },
    [categories, reorderMutation]
  )

  const tabItems = [
    {
      value: "categories",
      label: "Time-off categories",
      badge: categories.length || undefined,
    },
    { value: "holidays", label: "Holidays", badge: holidays.length || undefined },
  ]

  const handleAdd = useCallback(() => {
    navigate("/time-off-setup/new")
  }, [navigate])

  const handleToggleActive = useCallback(
    (category: TimeOffCategory) => {
      toggleMutation.mutate(
        { categoryId: category.id, isActive: !category.is_active },
        {
          onSuccess: () => {
            addToast({
              title: category.is_active ? "Category deactivated" : "Category activated",
              description: `${category.name} has been ${category.is_active ? "deactivated" : "activated"}`,
            })
          },
        }
      )
    },
    [toggleMutation]
  )

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        addToast({
          title: "Category deleted",
          description: `${deleteTarget.name} has been deleted`,
        })
        setDeleteTarget(null)
      },
    })
  }, [deleteTarget, deleteMutation])

  // Holiday helpers
  const formatHolidayDate = (dateStr: string): string => {
    const date = new Date(dateStr + "T00:00:00")
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
  }

  const getDayOfWeek = (dateStr: string): string => {
    const date = new Date(dateStr + "T00:00:00")
    return date.toLocaleDateString("en-US", { weekday: "long" })
  }

  const allSelected = holidays.length > 0 && selectedHolidayIds.size === holidays.length
  const someSelected = selectedHolidayIds.size > 0 && !allSelected

  const handleToggleAll = () => {
    if (allSelected) setSelectedHolidayIds(new Set())
    else setSelectedHolidayIds(new Set(holidays.map((h) => h.id)))
  }

  const handleToggleOne = (id: string) => {
    setSelectedHolidayIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleDeleteHoliday = useCallback(() => {
    if (!deleteHolidayTarget) return
    deleteHolidayMutation.mutate(deleteHolidayTarget.id, {
      onSuccess: () => {
        addToast({ title: "Holiday deleted", description: `${deleteHolidayTarget.name} has been deleted` })
        setDeleteHolidayTarget(null)
        setSelectedHolidayIds((prev) => {
          const next = new Set(prev)
          next.delete(deleteHolidayTarget.id)
          return next
        })
      },
    })
  }, [deleteHolidayTarget, deleteHolidayMutation])

  return (
    <div className="flex flex-col size-full">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 h-[60px] shrink-0">
        <button className="flex items-center justify-center size-7 rounded-[10px] shrink-0 text-foreground hover:bg-accent transition-colors">
          <FileClock className="size-4" />
        </button>
        <div className="flex items-center h-6 pr-2 relative shrink-0">
          <Separator orientation="vertical" />
        </div>
        <BreadcrumbItem
          text="Time-off setup"
          className="flex-1 text-foreground font-medium"
        />
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
          {activeTab === "categories" ? (
            <Button onClick={handleAdd}>
              <Plus />
              Add time-off category
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={() => { setEditingHoliday(null); setHolidayModalOpen(true) }}>Create holiday</Button>
              <Button onClick={() => setImportModalOpen(true)}>
                <CalendarArrowDown />
                Import holiday calendar
              </Button>
            </div>
          )}
        </div>

        {activeTab === "categories" ? (
          /* Categories table */
          <div className="rounded-lg border border-border overflow-hidden">
            {/* Header row */}
            <div className="flex bg-secondary">
              <DataTableHeaderCell type="text" className="w-10" />
              <DataTableHeaderCell type="text" label="Active" className="w-[100px]" />
              <DataTableHeaderCell type="text" label="Category name" className="w-[320px]" />
              <DataTableHeaderCell type="text" label="Type" className="flex-1" />
              <DataTableHeaderCell type="text" label="Allowance policy" className="flex-1" />
              <DataTableHeaderCell type="text" className="w-24" />
            </div>

            {/* Body */}
            {isLoading && categories.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            ) : categoriesError && categories.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <Empty
                  media={{ type: "icon", icon: FileClock }}
                  title="Unable to load categories"
                  description="Something went wrong. Please try again."
                  content={{
                    layout: "single",
                    primaryAction: {
                      label: "Retry",
                      onClick: () => refetchCategories(),
                    },
                  }}
                />
              </div>
            ) : categories.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <Empty
                  media={{ type: "icon", icon: FileClock }}
                  title="No time-off categories yet"
                  description="Define your company's leave policies like Vacation, Sick Leave, or Sabbatical. These categories will be used to track employee balances and accrual rules"
                  content={{
                    layout: "single",
                    primaryAction: {
                      label: "Add time-off category",
                      icon: Plus,
                      onClick: handleAdd,
                    },
                  }}
                />
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={categories.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {categories.map((cat) => (
                    <SortableCategoryRow
                      key={cat.id}
                      category={cat}
                      onToggleActive={handleToggleActive}
                      onEdit={(c) =>
                        navigate(`/time-off-setup/${c.id}/edit`)
                      }
                      onDelete={setDeleteTarget}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>
        ) : (
          /* Holidays table */
          <div className="rounded-xl border border-border overflow-hidden">
            {/* Header row */}
            <div className="flex bg-secondary">
              <DataTableHeaderCell
                type="checkbox"
                className="w-[28px]"
                checked={allSelected ? true : someSelected ? "indeterminate" : false}
                onCheckedChange={handleToggleAll}
              />
              <DataTableHeaderCell type="text" label="Holiday" className="flex-1" />
              <DataTableHeaderCell type="text" label="Date" className="flex-1" />
              <DataTableHeaderCell type="text" label="Type" className="flex-1" />
              <DataTableHeaderCell type="text" className="w-14" />
            </div>

            {/* Body */}
            {holidaysLoading && holidays.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            ) : holidaysError && holidays.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <Empty
                  media={{ type: "icon", icon: CalendarSearch }}
                  title="Unable to load holidays"
                  description="Something went wrong. Please try again."
                  content={{
                    layout: "single",
                    primaryAction: {
                      label: "Retry",
                      onClick: () => refetchHolidays(),
                    },
                  }}
                />
              </div>
            ) : holidays.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Empty
                  media={{ type: "icon", icon: CalendarSearch }}
                  title="No holidays added yet"
                  description="Import official public holidays for your team's locations or create custom non-working days to ensure accurate time-off calculations"
                  content={{
                    layout: "two-horizontal",
                    primaryAction: {
                      label: "Import holiday calendar",
                      icon: CalendarArrowDown,
                      onClick: () => setImportModalOpen(true),
                    },
                    secondaryAction: {
                      label: "Create holiday",
                      onClick: () => { setEditingHoliday(null); setHolidayModalOpen(true) },
                    },
                  }}
                />
              </div>
            ) : (
              holidays.map((holiday) => (
                <div key={holiday.id} className="flex">
                  <DataTableCell
                    type="checkbox"
                    size="md"
                    className="w-[28px]"
                    checked={selectedHolidayIds.has(holiday.id)}
                    onCheckedChange={() => handleToggleOne(holiday.id)}
                  />
                  <DataTableCell
                    type="text"
                    size="md"
                    label={holiday.name}
                    labelClassName="font-medium"
                    className="flex-1"
                  />
                  <DataTableCell
                    type="text-description"
                    size="md"
                    label={formatHolidayDate(holiday.date)}
                    description={getDayOfWeek(holiday.date)}
                    className="flex-1"
                  />
                  <DataTableCell
                    type="badge"
                    size="md"
                    className="flex-1"
                    badgeNode={
                      <Badge variant="secondary">
                        {holiday.is_custom ? "Custom" : "Public"}
                      </Badge>
                    }
                  />
                  <div
                    className="relative flex items-center justify-center w-14 h-[72px] px-3 py-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Popover
                      open={openPopoverId === holiday.id}
                      onOpenChange={(open) =>
                        setOpenPopoverId(open ? holiday.id : null)
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
                            holiday.is_custom
                              ? [
                                  {
                                    items: [
                                      {
                                        type: "icon",
                                        icon: <Pencil className="size-4" />,
                                        label: "Edit holiday",
                                        onClick: () => {
                                          setOpenPopoverId(null)
                                          setEditingHoliday(holiday)
                                          setHolidayModalOpen(true)
                                        },
                                      },
                                    ],
                                  },
                                  {
                                    items: [
                                      {
                                        type: "icon",
                                        variant: "destructive",
                                        icon: <Trash2 className="size-4" />,
                                        label: "Delete",
                                        onClick: () => {
                                          setOpenPopoverId(null)
                                          setDeleteHolidayTarget(holiday)
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
                                        variant: "destructive",
                                        icon: <Trash2 className="size-4" />,
                                        label: "Delete",
                                        onClick: () => {
                                          setOpenPopoverId(null)
                                          setDeleteHolidayTarget(holiday)
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
              ))
            )}
          </div>
        )}
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
            <AlertDialogTitle>Delete category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              {deleteTarget ? deleteTarget.name : ""}? This action cannot be
              undone.
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

      {/* Delete holiday confirmation dialog */}
      <AlertDialog
        open={!!deleteHolidayTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteHolidayTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete holiday</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              {deleteHolidayTarget ? deleteHolidayTarget.name : ""}? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteHoliday}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ImportHolidayModal open={importModalOpen} onOpenChange={setImportModalOpen} />
      <HolidayModal
        open={holidayModalOpen}
        onOpenChange={setHolidayModalOpen}
        holiday={editingHoliday}
      />
    </div>
  )
}
