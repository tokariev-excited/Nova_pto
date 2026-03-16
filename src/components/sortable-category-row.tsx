import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVerticalIcon, PencilLine, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DataTableCell } from "@/components/ui/data-table-cell"
import { Badge } from "@/components/ui/badge"
import { getAllowancePolicy } from "@/lib/time-off-category-utils"
import type { TimeOffCategory } from "@/types/time-off-category"

interface SortableCategoryRowProps {
  category: TimeOffCategory
  onToggleActive: (category: TimeOffCategory) => void
  onEdit: (category: TimeOffCategory) => void
  onDelete: (category: TimeOffCategory) => void
}

export function SortableCategoryRow({
  category,
  onToggleActive,
  onEdit,
  onDelete,
}: SortableCategoryRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const policy = getAllowancePolicy(category)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex hover:bg-muted/50 ${isDragging ? "opacity-50 shadow-md bg-background relative z-10" : ""}`}
      {...attributes}
    >
      <div
        className="relative flex items-center justify-center w-10 h-[72px] cursor-grab active:cursor-grabbing"
        {...listeners}
      >
        <GripVerticalIcon className="size-4 text-muted-foreground" />
        <div className="absolute bottom-0 left-0 right-0 border-b border-border" />
      </div>
      <div onClick={(e) => e.stopPropagation()}>
        <DataTableCell
          type="switch"
          size="md"
          className="w-[100px]"
          switchChecked={category.is_active}
          onSwitchChange={() => onToggleActive(category)}
        />
      </div>
      <DataTableCell
        type="text"
        size="md"
        className="w-[320px]"
        labelClassName="font-medium"
        label={`${category.emoji ?? ""} ${category.name}`.trim()}
      />
      <DataTableCell
        type="badge"
        size="md"
        className="flex-1"
        badgeNode={
          <Badge variant="secondary">
            {category.leave_type === "paid" ? "Paid" : "Unpaid"}
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
          onClick={() => onEdit(category)}
        >
          <PencilLine className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onDelete(category)}
        >
          <Trash2 className="size-4" />
        </Button>
        <div className="absolute bottom-0 left-0 right-0 border-b border-border" />
      </div>
    </div>
  )
}
