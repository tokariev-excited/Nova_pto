import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const sidebarMenuButtonVariants = cva(
  "flex items-center justify-start rounded-[calc(var(--radius)-2px)] outline-none text-sidebar-foreground transition-colors [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      type: {
        simple: "gap-2 font-medium",
        "large-icon": "gap-2 cursor-default",
      },
      collapsed: {
        false: "w-full",
        true: "",
      },
    },
    compoundVariants: [
      { type: "simple", collapsed: false, className: "h-9 px-3 py-2.5" },
      { type: "simple", collapsed: true, className: "size-8 p-2 justify-center" },
      { type: "large-icon", collapsed: false, className: "p-2" },
      { type: "large-icon", collapsed: true, className: "size-8" },
    ],
    defaultVariants: {
      type: "simple",
      collapsed: false,
    },
  }
)

const stateClasses =
  "hover:bg-input hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar data-[active=true]:border data-[active=true]:border-border data-[active=true]:shadow-xs focus-visible:bg-sidebar focus-visible:shadow-focus"

function SidebarMenuButton({
  className,
  type = "simple",
  collapsed = false,
  isActive = false,
  asChild = false,
  icon,
  rightIcon,
  badge,
  mediaAsset,
  children,
  ...props
}: Omit<React.ComponentProps<"button">, "type"> &
  VariantProps<typeof sidebarMenuButtonVariants> & {
    isActive?: boolean
    asChild?: boolean
    icon?: React.ReactNode
    rightIcon?: React.ReactNode
    badge?: React.ReactNode
    mediaAsset?: React.ReactNode
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="sidebar-menu-button"
      data-active={isActive || undefined}
      className={cn(
        sidebarMenuButtonVariants({ type, collapsed }),
        type === "simple" && stateClasses,
        className
      )}
      {...props}
    >
      {type === "simple" && (
        <>
          {icon}
          {!collapsed && (
            <>
              <span className="flex-1 truncate text-sm leading-none text-left">
                {children}
              </span>
              {rightIcon}
              {badge}
            </>
          )}
        </>
      )}
      {type === "large-icon" && (
        <>
          {mediaAsset}
          {!collapsed && (
            <div className="flex flex-1 flex-col items-start justify-center gap-0.5 min-w-0">
              <span className="w-full truncate text-sm font-semibold leading-none text-left">
                {children}
              </span>
            </div>
          )}
        </>
      )}
    </Comp>
  )
}

export { SidebarMenuButton, sidebarMenuButtonVariants }
