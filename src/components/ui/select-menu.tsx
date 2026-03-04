import * as React from "react"
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"
import { Select as SelectPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { SelectMenuLabel } from "@/components/ui/select-menu-label"
import { SelectMenuItem, type SelectMenuItemProps } from "@/components/ui/select-menu-item"

export interface SelectMenuItemData
  extends Omit<SelectMenuItemProps, "className"> {
  value: string
}

export interface SelectMenuGroupData {
  label?: string
  items: SelectMenuItemData[]
}

interface SelectMenuProps
  extends React.ComponentProps<typeof SelectPrimitive.Content> {
  groups: SelectMenuGroupData[]
}

function SelectMenu({ className, groups, ...props }: SelectMenuProps) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-menu"
        className={cn(
          "relative z-50 min-w-[136px] max-w-[324px] overflow-hidden",
          "rounded-[calc(var(--radius)-2px)] border border-border bg-popover p-1 text-popover-foreground shadow-md",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}
      >
        <SelectPrimitive.ScrollUpButton className="flex cursor-default items-center justify-center py-1">
          <ChevronUpIcon className="size-4" />
        </SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport>
          {groups.map((group, i) => (
            <div key={i} className="p-1">
              <SelectPrimitive.Group>
                {group.label && <SelectMenuLabel label={group.label} />}
                {group.items.map(({ value, ...item }) => (
                  <SelectMenuItem key={value} value={value} {...item} />
                ))}
              </SelectPrimitive.Group>
            </div>
          ))}
        </SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className="flex cursor-default items-center justify-center py-1">
          <ChevronDownIcon className="size-4" />
        </SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

export { SelectMenu }
export type { SelectMenuProps }
