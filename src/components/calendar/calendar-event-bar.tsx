import { cn } from "@/lib/utils"
import { getCategoryBgClass, type WeekEventSegment } from "@/lib/calendar-utils"

interface CalendarEventBarProps {
  segment: WeekEventSegment
  onClick?: () => void
}

function CalendarEventBar({ segment, onClick }: CalendarEventBarProps) {
  const isPending = segment.event.status === "pending"
  const { bg, border } = getCategoryBgClass(segment.event.color, isPending)

  const isClickable = segment.event.type === "request"

  return (
    <button
      type="button"
      data-slot="calendar-event-bar"
      className={cn(
        "flex items-center h-[22px] w-full px-2 truncate",
        "text-xs font-medium leading-4 tracking-[-0.24px] text-foreground",
        bg,
        border,
        // Rounded corners based on segment position (6px per Figma)
        segment.isStart && segment.isEnd && "rounded-[calc(var(--radius)-4px)]",
        segment.isStart && !segment.isEnd && "rounded-l-[calc(var(--radius)-4px)] rounded-r-none",
        !segment.isStart && segment.isEnd && "rounded-r-[calc(var(--radius)-4px)] rounded-l-none",
        !segment.isStart && !segment.isEnd && "rounded-none",
        // Interaction
        isClickable
          ? "cursor-pointer hover:opacity-80 transition-opacity"
          : "cursor-default",
      )}
      onClick={isClickable ? onClick : undefined}
      tabIndex={isClickable ? 0 : -1}
    >
      <span className="truncate">{segment.event.label}</span>
    </button>
  )
}

export { CalendarEventBar }
export type { CalendarEventBarProps }
