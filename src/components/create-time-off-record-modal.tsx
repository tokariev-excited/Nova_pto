import { useState, useEffect, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { DatePicker } from "@/components/ui/date-picker"
import { Textarea } from "@/components/ui/textarea"
import { EmployeeCombobox } from "@/components/ui/employee-combobox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/hooks/use-auth"
import { useTimeOffCategories } from "@/hooks/use-time-off-categories"
import {
  useActiveEmployees,
  useEmployeeBalance,
  useCreateTimeOffRecordMutation,
} from "@/hooks/use-time-off-requests"
import { addToast } from "@/lib/toast"

interface CreateTimeOffRecordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatDateToString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function CreateTimeOffRecordModal({
  open,
  onOpenChange,
}: CreateTimeOffRecordModalProps) {
  const { workspace } = useAuth()
  const { data: employees = [] } = useActiveEmployees()
  const { data: categories = [] } = useTimeOffCategories()
  const createMutation = useCreateTimeOffRecordMutation()

  const [employeeId, setEmployeeId] = useState<string | undefined>()
  const [categoryId, setCategoryId] = useState<string | undefined>()
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()
  const [comment, setComment] = useState("")

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setEmployeeId(undefined)
      setCategoryId(undefined)
      setStartDate(undefined)
      setEndDate(undefined)
      setComment("")
    }
  }, [open])

  // Fetch balance when both employee and category are selected
  const { data: balance, isLoading: balanceLoading } = useEmployeeBalance(
    employeeId,
    categoryId
  )

  // Filter to active categories only
  const activeCategories = useMemo(
    () => categories.filter((c) => c.is_active),
    [categories]
  )

  // Find the selected category for display
  const selectedCategory = useMemo(
    () => activeCategories.find((c) => c.id === categoryId),
    [activeCategories, categoryId]
  )

  // Calculate total days
  const totalDays = useMemo(() => {
    if (!startDate || !endDate) return null
    if (endDate < startDate) return null
    const diffMs = endDate.getTime() - startDate.getTime()
    return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1
  }, [startDate, endDate])

  // Validation
  const hasRequiredFields = !!employeeId && !!categoryId && !!startDate && !!endDate
  const isUnlimited = selectedCategory?.accrual_method === 'unlimited'
  const insufficientBalance =
    hasRequiredFields && !isUnlimited && totalDays != null && balance != null && totalDays > balance.remaining_days
  const noBalance = hasRequiredFields && !balanceLoading && balance == null && !!employeeId && !!categoryId
  const isValid = hasRequiredFields && totalDays != null && totalDays > 0 && !insufficientBalance && !noBalance && !balanceLoading

  function handleSubmit() {
    if (!isValid || !workspace || !employeeId || !categoryId || !startDate || !endDate) return

    createMutation.mutate(
      {
        workspace_id: workspace.id,
        employee_id: employeeId,
        category_id: categoryId,
        start_date: formatDateToString(startDate),
        end_date: formatDateToString(endDate),
        comment: comment.trim() || null,
      },
      {
        onSuccess: () => {
          addToast({
            title: "Time-off record created",
            description: "The record has been added and the balance updated",
          })
          onOpenChange(false)
        },
        onError: (error) => {
          addToast({
            title: "Failed to create record",
            description: error.message,
            variant: "destructive",
          })
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px] gap-5">
        <DialogHeader>
          <DialogTitle>Create time-off record</DialogTitle>
          <DialogDescription>
            Recording time-off for a user reduces their balance and creates an
            approved request for the selected dates in the system
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Employee */}
          <Field label="Employee">
            <EmployeeCombobox
              employees={employees}
              value={employeeId}
              onChange={setEmployeeId}
            />
          </Field>

          {/* Time-off category */}
          <div className="flex flex-col gap-2">
            <Field label="Time-off category">
              <Select
                value={categoryId}
                onValueChange={setCategoryId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {activeCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.emoji ? `${cat.name} ${cat.emoji}` : cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {/* Balance display */}
            {employeeId && categoryId && (
              <p className="text-sm leading-5 tracking-tight text-muted-foreground">
                {balanceLoading ? (
                  "Loading balance..."
                ) : balance ? (
                  <>
                    {selectedCategory?.name ?? "Category"} balance:{" "}
                    <span className="font-medium text-foreground">
                      {isUnlimited ? "Unlimited" : `${balance.remaining_days} days`}
                    </span>
                  </>
                ) : (
                  <span className="text-destructive">
                    No balance allocated for this category
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Dates row */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-3">
              <Field label="Start date" className="flex-1">
                <DatePicker
                  value={startDate}
                  onChange={setStartDate}
                  placeholder="Pick a date"
                />
              </Field>
              <Field label="End date" className="flex-1">
                <DatePicker
                  value={endDate}
                  onChange={setEndDate}
                  placeholder="Pick a date"
                />
              </Field>
            </div>
            {/* Total days */}
            {totalDays != null && totalDays > 0 && (
              <p className="text-sm leading-5 tracking-tight text-muted-foreground">
                Total:{" "}
                <span className="font-medium text-foreground">
                  {totalDays} {totalDays === 1 ? "day" : "days"}
                </span>
              </p>
            )}
            {/* Insufficient balance warning */}
            {insufficientBalance && (
              <p className="text-sm leading-5 tracking-tight text-destructive">
                Insufficient balance ({balance!.remaining_days} days available)
              </p>
            )}
          </div>

          {/* Comment */}
          <Field label="Comment">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Type any extra information"
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid}
            loading={createMutation.isPending}
          >
            Create record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
