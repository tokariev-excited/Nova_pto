import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const calendarEventSlotVariants = cva(
  "flex w-full bg-muted",
  {
    variants: {
      type: {
        default: "items-start gap-3 p-2 rounded-[calc(var(--radius)-2px)]",
        pto: "items-center px-2 py-1 h-6 rounded-[calc(var(--radius)-4px)]",
      },
    },
    defaultVariants: {
      type: "default",
    },
  }
)

interface CalendarEventSlotProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof calendarEventSlotVariants> {
  eventLabel?: string
  dateTime?: string
}

function CalendarEventSlot({
  eventLabel = "Event label",
  dateTime,
  type = "default",
  className,
  ...props
}: CalendarEventSlotProps) {
  return (
    <div
      data-slot="calendar-event-slot"
      className={cn(calendarEventSlotVariants({ type }), className)}
      {...props}
    >
      {type === "default" && (
        <>
          <div className="w-1 self-stretch shrink-0 rounded-full bg-primary opacity-70" />
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="truncate text-sm font-medium leading-5 tracking-[-0.28px] text-foreground">
              {eventLabel}
            </p>
            {dateTime && (
              <p className="truncate text-xs font-normal leading-none text-muted-foreground">
                {dateTime}
              </p>
            )}
          </div>
        </>
      )}
      {type === "pto" && (
        <p className="truncate text-xs font-medium leading-4 tracking-[-0.24px] text-foreground">
          {eventLabel}
        </p>
      )}
    </div>
  )
}

export { CalendarEventSlot, calendarEventSlotVariants }
export type { CalendarEventSlotProps }
