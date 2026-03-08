import * as React from "react"

import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"

interface SwitchGroupProps
  extends Omit<
    React.ComponentProps<typeof Switch>,
    "children" | "className" | "id"
  > {
  label?: string
  description?: string
  variant?: "default" | "card"
  orientation?: "left" | "right"
  className?: string
  id?: string
}

function SwitchGroup({
  className,
  label,
  description,
  variant = "default",
  orientation = "left",
  disabled,
  id: idProp,
  ...props
}: SwitchGroupProps) {
  const autoId = React.useId()
  const id = idProp ?? autoId

  return (
    <div
      data-slot="switch-group"
      className={cn(
        "flex items-start gap-3",
        orientation === "right" && "flex-row-reverse",
        disabled && "opacity-50 cursor-not-allowed",
        variant === "card" && [
          "p-4 rounded-lg border border-border",
          "has-[[data-state=checked]]:bg-primary/5 has-[[data-state=checked]]:border-primary",
        ],
        className
      )}
    >
      <Switch
        id={id}
        disabled={disabled}
        className="disabled:opacity-100"
        {...props}
      />

      {(label || description) && (
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {label && (
            <label
              htmlFor={id}
              className={cn(
                "pt-1 text-sm font-medium leading-none text-foreground",
                disabled ? "cursor-not-allowed" : "cursor-pointer"
              )}
            >
              {label}
            </label>
          )}
          {description && (
            <span className="text-sm font-normal leading-5 tracking-[-0.28px] text-muted-foreground">
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export { SwitchGroup }
export type { SwitchGroupProps }
