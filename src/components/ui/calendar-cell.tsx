import * as React from "react"
import { cn } from "@/lib/utils"
import { CalendarDayButton } from "./calendar-day-button"

interface CalendarCellProps extends React.ComponentProps<"div"> {
  dayLabel?: string
  title?: string
  selected?: boolean
  disabled?: boolean
  rightBorder?: boolean
  children?: React.ReactNode
}

function CalendarCell({
  dayLabel = "1",
  title,
  selected = false,
  disabled = false,
  rightBorder = true,
  children,
  className,
  ...props
}: CalendarCellProps) {
  return (
    <div
      data-slot="calendar-cell"
      data-disabled={disabled || undefined}
      className={cn(
        "relative flex min-h-[120px] flex-col border-b border-border transition-colors",
        disabled ? "bg-primary-foreground" : "hover:bg-primary-foreground",
        className
      )}
      {...props}
    >
      {/* Right border separator — matches CalendarHeader pattern */}
      {rightBorder && (
        <div className="absolute right-0 top-0 bottom-0 w-px bg-border" />
      )}

      {/* Header — optional weekday title + day number button */}
      <div className="flex shrink-0 items-center justify-between pl-2 pr-0.5 py-0.5 w-full">
        <div className="flex flex-1 min-w-0 items-center">
          {title && (
            <p className="truncate text-sm font-medium leading-5 text-foreground">
              {title}
            </p>
          )}
        </div>
        <CalendarDayButton
          label={dayLabel}
          selected={selected}
          disabled={disabled}
        />
      </div>

      {/* Content — event slots passed as children */}
      <div className="flex grow flex-col gap-0.5 pb-2 px-2">
        {children}
      </div>
    </div>
  )
}

export { CalendarCell }
export type { CalendarCellProps }
