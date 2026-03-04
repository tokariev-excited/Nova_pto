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
      className={cn("flex flex-col items-start rounded-md", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export { SidebarMenuItem }
