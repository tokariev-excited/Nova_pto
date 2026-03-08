import * as React from "react"
import { Select as SelectPrimitive } from "radix-ui"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface SelectMenuItemProps
  extends Omit<React.ComponentProps<typeof SelectPrimitive.Item>, "children"> {
  label?: string
  icon?: React.ReactNode
  shortcut?: string
}

function SelectMenuItem({
  className,
  label,
  icon,
  shortcut,
  ...props
}: SelectMenuItemProps) {
  return (
    <SelectPrimitive.Item
      data-slot="select-menu-item"
      className={cn(
        "flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 outline-none select-none",
        "text-sm font-normal leading-5 tracking-[-0.28px] text-popover-foreground",
        "focus:bg-accent focus:text-accent-foreground",
        "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      {icon && (
        <span className="shrink-0 size-4 [&_svg]:size-4 [&_svg]:shrink-0">
          {icon}
        </span>
      )}
      <SelectPrimitive.ItemText className="flex-1 min-w-0">
        {label}
      </SelectPrimitive.ItemText>
      {shortcut && (
        <span className="shrink-0 text-xs font-normal leading-4 tracking-[-0.24px] text-muted-foreground">
          {shortcut}
        </span>
      )}
      <SelectPrimitive.ItemIndicator>
        <CheckIcon className="size-4 shrink-0" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

export { SelectMenuItem }
export type { SelectMenuItemProps }
