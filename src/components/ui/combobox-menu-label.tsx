import * as React from "react"
import { cn } from "@/lib/utils"

export interface ComboboxMenuLabelProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
}

function ComboboxMenuLabel({
  children,
  className,
  ...props
}: ComboboxMenuLabelProps) {
  return (
    <div
      data-slot="combobox-menu-label"
      className={cn("flex items-center px-2 py-1.5", className)}
      {...props}
    >
      <p className="flex-1 min-w-px min-h-px text-xs font-medium leading-4 tracking-[-0.24px] text-muted-foreground">
        {children}
      </p>
    </div>
  )
}

export { ComboboxMenuLabel }
