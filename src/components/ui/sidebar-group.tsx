import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const sidebarGroupVariants = cva(
  "flex flex-col items-start pl-2 py-2",
  {
    variants: {
      collapsed: {
        false: "w-full gap-1 pr-4",
        true: "gap-0",
      },
    },
    defaultVariants: {
      collapsed: false,
    },
  }
)

function SidebarGroup({
  className,
  collapsed = false,
  children,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof sidebarGroupVariants>) {
  return (
    <div
      data-slot="sidebar-group"
      className={cn(sidebarGroupVariants({ collapsed }), className)}
      {...props}
    >
      {children}
    </div>
  )
}

export { SidebarGroup, sidebarGroupVariants }
