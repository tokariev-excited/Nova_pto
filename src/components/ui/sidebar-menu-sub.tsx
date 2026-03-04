import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const sidebarMenuSubVariants = cva(
  "bg-sidebar flex flex-col gap-1 py-0.5",
  {
    variants: {
      type: {
        separator: "ml-4 border-l border-sidebar-border pl-2",
        default: "",
        inset: "px-1.5",
      },
    },
    defaultVariants: {
      type: "separator",
    },
  }
)

function SidebarMenuSub({
  className,
  type = "separator",
  children,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof sidebarMenuSubVariants>) {
  return (
    <div
      data-slot="sidebar-menu-sub"
      className={cn(sidebarMenuSubVariants({ type }), className)}
      {...props}
    >
      {children}
    </div>
  )
}

export { SidebarMenuSub, sidebarMenuSubVariants }
