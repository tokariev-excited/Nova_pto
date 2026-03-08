import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const calendarDayButtonVariants = cva(
  "group relative flex flex-col items-center justify-center overflow-hidden rounded-[calc(var(--radius)-2px)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        default: "size-8",
        large: "size-12",
        custom: "size-[52px] gap-1",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

interface CalendarDayButtonProps
  extends Omit<React.ComponentProps<"button">, "children">,
    VariantProps<typeof calendarDayButtonVariants> {
  label?: string
  subLabel?: string
  selected?: boolean
}

function CalendarDayButton({
  label = "1",
  subLabel,
  selected = false,
  size = "default",
  className,
  ...props
}: CalendarDayButtonProps) {
  return (
    <button
      data-slot="calendar-day-button"
      data-selected={selected || undefined}
      className={cn(
        calendarDayButtonVariants({ size }),
        selected
          ? "bg-primary text-primary-foreground"
          : "text-foreground hover:bg-accent hover:text-accent-foreground disabled:text-muted-foreground",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "w-full truncate text-center text-sm leading-5 tracking-[-0.28px]",
          selected ? "font-medium" : "font-normal"
        )}
      >
        {label}
      </span>
      {size === "custom" && subLabel && (
        <span
          className={cn(
            "w-full truncate text-center text-xs leading-none",
            selected
              ? "opacity-70"
              : "text-muted-foreground group-hover:opacity-50"
          )}
        >
          {subLabel}
        </span>
      )}
    </button>
  )
}

export { CalendarDayButton, calendarDayButtonVariants }
export type { CalendarDayButtonProps }
