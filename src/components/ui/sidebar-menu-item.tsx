import * as React from "react"

import { cn } from "@/lib/utils"

function SidebarMenuItem({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-menu-item"
      className={cn("flex items-center p-0 rounded-[calc(var(--radius)-2px)] shrink-0 w-full", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export { SidebarMenuItem }
