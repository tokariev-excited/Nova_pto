import * as React from "react"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

function SidebarMenuSubItem({
  className,
  isActive = false,
  asChild = false,
  icon,
  children,
  ...props
}: React.ComponentProps<"button"> & {
  isActive?: boolean
  asChild?: boolean
  icon?: React.ReactNode
}) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="sidebar-menu-sub-item"
      data-active={isActive || undefined}
      className={cn(
        "flex items-center gap-2 h-7 w-full p-2 rounded-md outline-none text-sm leading-none text-sidebar-foreground transition-colors [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        "data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium",
        "focus-visible:bg-sidebar focus-visible:shadow-focus focus-visible:overflow-clip",
        className
      )}
      {...props}
    >
      {icon}
      <span className="flex-1 truncate">{children}</span>
    </Comp>
  )
}

export { SidebarMenuSubItem }
