import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface CalendarArrowButtonProps extends React.ComponentProps<"button"> {
  direction?: "left" | "right"
}

function CalendarArrowButton({
  direction = "left",
  className,
  ...props
}: CalendarArrowButtonProps) {
  const Icon = direction === "left" ? ChevronLeft : ChevronRight

  return (
    <button
      data-slot="calendar-arrow-button"
      className={cn(
        // Base — size, layout, default radius (Enabled/Disabled = 10px)
        "inline-flex size-8 shrink-0 items-center justify-center rounded-[calc(var(--radius)-2px)] transition-colors outline-none",
        // Hover — accent bg, tighter radius (8px)
        "hover:bg-accent hover:text-accent-foreground hover:rounded-[calc(var(--radius)-4px)]",
        // Focus — white bg, tighter radius, ring shadow
        "focus-visible:bg-background focus-visible:rounded-[calc(var(--radius)-4px)] focus-visible:shadow-focus",
        // Disabled — 50% opacity, no pointer events
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    >
      <Icon className="size-4" />
    </button>
  )
}

export { CalendarArrowButton }
export type { CalendarArrowButtonProps }
