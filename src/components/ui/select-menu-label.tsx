import * as React from "react"
import { Select as SelectPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

interface SelectMenuLabelProps
  extends React.ComponentProps<typeof SelectPrimitive.Label> {
  label?: string
}

function SelectMenuLabel({
  className,
  label,
  ...props
}: SelectMenuLabelProps) {
  return (
    <SelectPrimitive.Label
      data-slot="select-menu-label"
      className={cn(
        "px-2 py-1.5 text-xs font-normal leading-4 tracking-[-0.24px] text-muted-foreground",
        className
      )}
      {...props}
    >
      {label}
    </SelectPrimitive.Label>
  )
}

export { SelectMenuLabel }
export type { SelectMenuLabelProps }
