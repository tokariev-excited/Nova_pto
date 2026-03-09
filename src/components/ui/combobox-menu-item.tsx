import * as React from "react"
import { CheckIcon, ChevronRightIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar } from "@/components/ui/avatar"

export interface ComboboxMenuItemProps
  extends React.HTMLAttributes<HTMLDivElement> {
  type?: "simple" | "checkbox" | "icon" | "avatar"
  variant?: "default" | "destructive"
  label?: string
  selected?: boolean
  icon?: React.ReactNode
  avatarSrc?: string
  avatarFallback?: string
  shortcut?: string
  subTrigger?: boolean
}

function ComboboxMenuItem({
  type = "simple",
  variant = "default",
  label,
  selected = false,
  icon,
  avatarSrc,
  avatarFallback,
  shortcut,
  subTrigger = false,
  className,
  children,
  ...props
}: ComboboxMenuItemProps) {
  const isDestructive = variant === "destructive"
  return (
    <div
      data-slot="combobox-menu-item"
      className={cn(
        "flex w-full items-center gap-2 px-2 py-1.5 rounded-[6px]",
        "cursor-pointer select-none",
        "hover:bg-accent",
        className
      )}
      {...props}
    >
      {/* Left-side prefix */}
      {type === "checkbox" && (
        <span className="flex shrink-0 flex-col items-start justify-center">
          <Checkbox checked={selected} className="pointer-events-none" />
        </span>
      )}
      {type === "icon" && icon && (
        <span className={cn("flex shrink-0 flex-col items-start justify-center", isDestructive && "text-destructive")}>
          <span className="size-4 shrink-0 overflow-hidden [&_svg]:size-4">
            {icon}
          </span>
        </span>
      )}
      {type === "avatar" && (
        <span className="flex shrink-0 flex-col items-start justify-center">
          <Avatar
            src={avatarSrc}
            fallback={avatarFallback}
            size="2xs"
            shape="circle"
            className="size-4"
          />
        </span>
      )}

      {/* Label */}
      <p className={cn("flex-1 min-w-px min-h-px text-sm font-normal leading-5 tracking-[-0.28px]", isDestructive ? "text-destructive" : "text-foreground")}>
        {children ?? label}
      </p>

      {/* Right-side: subTrigger → selected check → shortcut */}
      {subTrigger && (
        <span className="flex shrink-0 flex-col items-start justify-center">
          <ChevronRightIcon className="size-4 shrink-0" />
        </span>
      )}
      {selected && type !== "checkbox" && (
        <span className="flex shrink-0 flex-col items-start justify-center">
          <CheckIcon className="size-4 shrink-0" />
        </span>
      )}
      {shortcut && (
        <span className="shrink-0 text-xs font-normal leading-none tracking-[-0.24px] text-muted-foreground whitespace-nowrap">
          {shortcut}
        </span>
      )}
    </div>
  )
}

export { ComboboxMenuItem }
