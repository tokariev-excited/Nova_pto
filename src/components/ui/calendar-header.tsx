import * as React from "react"
import { ArrowDownNarrowWide, ArrowDownWideNarrow } from "lucide-react"
import { cn } from "@/lib/utils"

interface CalendarHeaderProps extends Omit<React.ComponentProps<"div">, "children"> {
  label?: string
  rightBorder?: boolean
  rightIcon?: boolean
}

function CalendarHeader({
  label = "Mon",
  rightBorder = true,
  rightIcon = false,
  className,
  ...props
}: CalendarHeaderProps) {
  return (
    <div
      data-slot="calendar-header"
      className={cn(
        "group relative flex w-36 h-10 items-center justify-center",
        "bg-secondary hover:bg-secondary/50",
        "border-y border-border p-3",
        className
      )}
      {...props}
    >
      <div className="flex flex-1 gap-2 items-center min-w-0">
        <p className="flex-1 min-w-0 truncate text-sm font-medium leading-5 tracking-[-0.28px] text-foreground">
          {label}
        </p>
        {rightIcon && (
          <>
            <ArrowDownWideNarrow className="size-4 shrink-0 group-hover:hidden" />
            <ArrowDownNarrowWide className="size-4 shrink-0 hidden group-hover:block" />
          </>
        )}
      </div>
      {rightBorder && (
        <div className="absolute right-0 top-0 bottom-0 w-px bg-border" />
      )}
    </div>
  )
}

export { CalendarHeader }
export type { CalendarHeaderProps }
