import { CalendarHeader } from "@/components/ui/calendar-header"
import { CalendarWeekRow } from "./calendar-week-row"
import type { CalendarWeek, CalendarEvent } from "@/lib/calendar-utils"

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

interface CalendarMonthGridProps {
  weeks: CalendarWeek[]
  onEventClick: (event: CalendarEvent) => void
  onDayClick: (date: string) => void
}

function CalendarMonthGrid({ weeks, onEventClick, onDayClick }: CalendarMonthGridProps) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* Weekday header row */}
      <div className="grid grid-cols-7">
        {WEEKDAY_LABELS.map((label, i) => (
          <CalendarHeader
            key={label}
            label={label}
            rightBorder={i < 6}
            className="w-auto border-t-0"
          />
        ))}
      </div>

      {/* Week rows */}
      {weeks.map((week, i) => (
        <CalendarWeekRow
          key={week.days[0].date}
          week={week}
          onEventClick={onEventClick}
          onDayClick={onDayClick}
          isLastWeek={i === weeks.length - 1}
        />
      ))}
    </div>
  )
}

export { CalendarMonthGrid }
export type { CalendarMonthGridProps }
