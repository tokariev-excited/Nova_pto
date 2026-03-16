import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  FileClock,
  Plus,
  GripVerticalIcon,
  PencilLine,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { TabGroup } from "@/components/ui/tab-group"
import { DataTableHeaderCell } from "@/components/ui/data-table-header-cell"
import { DataTableCell } from "@/components/ui/data-table-cell"
import { Badge } from "@/components/ui/badge"
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
import {
  useTimeOffCategories,
  useToggleCategoryActiveMutation,
  useDeleteCategoryMutation,
} from "@/hooks/use-time-off-categories"
import { getAllowancePolicy } from "@/lib/time-off-category-utils"
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
              <div>
                {categories.map((cat) => {
                  const policy = getAllowancePolicy(cat)
                  return (
                    <div key={cat.id} className="flex hover:bg-muted/50">
                      <DataTableCell
                        type="grip"
                        size="md"
                        className="w-10"
                      />
                      <div onClick={(e) => e.stopPropagation()}>
                        <DataTableCell
                          type="switch"
                          size="md"
                          className="w-[100px]"
                          switchChecked={cat.is_active}
                          onSwitchChange={() => handleToggleActive(cat)}
                        />
                      </div>
                      <DataTableCell
                        type="text"
                        size="md"
                        className="w-[320px]"
                        labelClassName="font-medium"
                        label={`${cat.emoji ?? ""} ${cat.name}`.trim()}
                      />
                      <DataTableCell
                        type="badge"
                        size="md"
                        className="flex-1"
                        badgeNode={
                          <Badge variant="secondary">
                            {cat.leave_type === "paid" ? "Paid" : "Unpaid"}
                          </Badge>
                        }
                      />
                      <DataTableCell
                        type="text-description"
                        size="md"
                        className="flex-1"
                        label={policy.main}
                        description={policy.subtitle}
                        showDescription={!!policy.subtitle}
                      />
                      <div className="relative flex items-center justify-center gap-1 w-24 h-[72px] px-3 py-2">
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() =>
                            navigate(`/dashboard/time-off-setup/${cat.id}/edit`)
                          }
                        >
                          <PencilLine className="size-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() => setDeleteTarget(cat)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                        <div className="absolute bottom-0 left-0 right-0 border-b border-border" />
                      </div>
                    </div>
                  )
                })}
              </div>
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
