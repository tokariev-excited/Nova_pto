import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { FileClock, Plus } from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
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
import { Empty } from "@/components/ui/empty"
import { BreadcrumbItem } from "@/components/ui/breadcrumb-item"
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
import {
  useTimeOffCategories,
  useToggleCategoryActiveMutation,
  useDeleteCategoryMutation,
  useReorderCategoriesMutation,
} from "@/hooks/use-time-off-categories"
import { addToast } from "@/lib/toast"
import type { TimeOffCategory } from "@/types/time-off-category"

type TabValue = "categories" | "holidays"

export function TimeOffSetupPage() {
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<TabValue>("categories")
  const [deleteTarget, setDeleteTarget] = useState<TimeOffCategory | null>(null)

  const { data: categories = [], isLoading } = useTimeOffCategories()
  const toggleMutation = useToggleCategoryActiveMutation()
  const deleteMutation = useDeleteCategoryMutation()
  const reorderMutation = useReorderCategoriesMutation()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = categories.findIndex((c) => c.id === active.id)
    const newIndex = categories.findIndex((c) => c.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(categories, oldIndex, newIndex)
    const items = reordered.map((cat, i) => ({ id: cat.id, sort_order: i }))
    reorderMutation.mutate(items)
  }

  const tabItems = [
    {
      value: "categories",
      label: "Time-off categories",
      badge: categories.length || undefined,
    },
    { value: "holidays", label: "Holidays" },
  ]

  function handleAdd() {
    navigate("/dashboard/time-off-setup/new")
  }

  function handleToggleActive(category: TimeOffCategory) {
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
  }

  function handleDeleteConfirm() {
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
  }

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
        <Button onClick={handleAdd}>
          <Plus />
          Add time-off category
        </Button>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-5 p-4">
        {/* Controls */}
        <div className="flex items-center">
          <TabGroup
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as TabValue)}
            items={tabItems}
          />
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
                  <div>
                    {categories.map((cat) => (
                      <SortableCategoryRow
                        key={cat.id}
                        category={cat}
                        onToggleActive={handleToggleActive}
                        onEdit={(c) =>
                          navigate(`/dashboard/time-off-setup/${c.id}/edit`)
                        }
                        onDelete={setDeleteTarget}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        ) : (
          /* Holidays placeholder */
          <div className="flex items-center justify-center py-16 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">
              Holidays management coming soon
            </p>
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
    </div>
  )
}
