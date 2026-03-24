import { useState, useMemo } from "react"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatLocalDate } from "@/lib/date-utils"
import { CalendarDayButton } from "@/components/ui/calendar-day-button"
import { CalendarEventBar } from "./calendar-event-bar"
import type { CalendarWeek, CalendarEvent } from "@/lib/calendar-utils"

interface CalendarWeekRowProps {
  week: CalendarWeek
  onEventClick: (event: CalendarEvent) => void
  onDayClick: (date: string) => void
  isLastWeek?: boolean
  isAdmin?: boolean
}

function CalendarWeekRow({ week, onEventClick, onDayClick, isLastWeek = false, isAdmin }: CalendarWeekRowProps) {
  const [hoveredCol, setHoveredCol] = useState<number | null>(null)
  const laneCount = Math.max(week.laneCount, 0)
  const todayStr = useMemo(() => formatLocalDate(new Date()), [])

  // Compute per-column max lane (0-indexed, -1 means no events)
  const colMaxLane = useMemo(() => {
    const maxLanes = new Array(7).fill(-1)
    for (const seg of week.segments) {
      for (let col = seg.startCol; col <= seg.endCol; col++) {
        maxLanes[col - 1] = Math.max(maxLanes[col - 1], seg.lane)
      }
    }
    return maxLanes
  }, [week.segments])

  // Add 1 extra lane row so the hover pill always has space
  const totalLanes = laneCount + 1
  const gridTemplateRows = `36px repeat(${totalLanes}, 24px) minmax(8px, 1fr)`

  return (
    <div
      data-slot="calendar-week-row"
      className="grid grid-cols-7"
      style={{
        gridTemplateRows,
        minHeight: "120px",
      }}
    >
      {/* Background cells — span all rows, handle borders & hover */}
      {week.days.map((day, col) => {
        const isPast = !isAdmin && day.date < todayStr

        return (
          <div
            key={`bg-${day.date}`}
            className={cn(
              "border-border relative",
              isPast ? "cursor-default" : "cursor-pointer",
              !isLastWeek && "border-b",
              col < 6 && "[border-right:1px_solid_var(--color-border)]",
              day.isWeekend
                ? "bg-primary-foreground"
                : !isPast && "hover:bg-primary-foreground",
            )}
            style={{
              gridColumn: col + 1,
              gridRow: "1 / -1",
            }}
            onClick={isPast ? undefined : () => onDayClick(day.date)}
            onMouseEnter={isPast ? undefined : () => setHoveredCol(col)}
            onMouseLeave={isPast ? undefined : () => setHoveredCol(null)}
          />
        )
      })}

      {/* Day number buttons — row 1 */}
      {week.days.map((day, col) => (
        <div
          key={`num-${day.date}`}
          className="flex items-center justify-end px-0.5 py-0.5 z-10 pointer-events-none"
          style={{
            gridColumn: col + 1,
            gridRow: 1,
          }}
        >
          <CalendarDayButton
            label={String(day.dayOfMonth)}
            selected={day.isToday}
            disabled={!day.isCurrentMonth}
            className={cn(
              day.isWeekend && !day.isToday && "text-[var(--color-error)]",
            )}
          />
        </div>
      ))}

      {/* Event bars — rows 2+ */}
      {week.segments.map((seg) => (
        <div
          key={`${seg.event.id}-${seg.startCol}`}
          className="px-1 z-10 flex items-center pointer-events-auto"
          style={{
            gridColumn: `${seg.startCol} / ${seg.endCol + 1}`,
            gridRow: seg.lane + 2,
          }}
        >
          <CalendarEventBar
            segment={seg}
            onClick={() => onEventClick(seg.event)}
          />
        </div>
      ))}

      {/* Hover affordance pills — one per column, positioned after last event */}
      {week.days.map((day, col) => {
        const isPast = !isAdmin && day.date < todayStr
        if (isPast) return null

        // Place hover pill at the lane after the last event in this column
        // colMaxLane[col] is -1 if no events, 0 if 1 event in lane 0, etc.
        // Grid row: lane 0 = row 2, so hover goes to row (maxLane + 1) + 2 = maxLane + 3
        // If no events: row 2 (first event position)
        const hoverGridRow = colMaxLane[col] + 3
        const isVisible = hoveredCol === col

        return (
          <div
            key={`hover-${day.date}`}
            className={cn(
              "px-1 z-10 flex items-center pointer-events-none",
              "transition-all duration-200 ease-out",
              isVisible
                ? "opacity-100 scale-100"
                : "opacity-0 scale-95",
            )}
            style={{
              gridColumn: col + 1,
              gridRow: hoverGridRow,
            }}
          >
            <div className={cn(
              "flex items-center justify-center w-full",
              "h-[22px] rounded-[calc(var(--radius)-4px)]",
              "border border-dashed border-muted-foreground/30 bg-muted/50",
            )}>
              <Plus className="size-4 text-muted-foreground" />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export { CalendarWeekRow }
export type { CalendarWeekRowProps }
