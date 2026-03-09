import * as React from "react"

import { RadioGroup as RadioGroupPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

interface RadioGroupOptionProps
  extends Omit<
    React.ComponentProps<typeof RadioGroupPrimitive.Item>,
    "children"
  > {
  label?: string
  description?: string
  variant?: "default" | "card"
  orientation?: "left" | "right"
  error?: boolean
}

function RadioGroupOption({
  className,
  label,
  description,
  variant = "card",
  orientation = "left",
  error = false,
  ...props
}: RadioGroupOptionProps) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-option"
      className={cn(
        "group flex items-start cursor-pointer outline-none",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variant === "card" && [
          "gap-2 px-4 py-3 rounded-[calc(var(--radius)-2px)] border border-border",
          "bg-secondary data-[state=checked]:bg-background data-[state=checked]:shadow-xs",
        ],
        variant === "default" &&
          (orientation === "left" ? "gap-3" : "gap-2"),
        orientation === "right" && "flex-row-reverse",
        className
      )}
      {...props}
    >
      {/* Radio indicator */}
      <span
        className={cn(
          "flex items-center justify-center size-4 shrink-0 rounded-full border border-border bg-background shadow-xs",
          "transition-[background-color,border-color,box-shadow]",
          "group-data-[state=checked]:border-0",
          error
            ? "group-data-[state=checked]:bg-destructive"
            : "group-data-[state=checked]:bg-success",
          "group-focus-visible:border-focus group-focus-visible:shadow-focus"
        )}
      >
        <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
          <span className="size-1.5 rounded-full bg-background" />
        </RadioGroupPrimitive.Indicator>
      </span>

      {/* Content */}
      {(label || description) && (
        <div className="flex min-w-0 flex-1 flex-col items-start text-left gap-1.5 pt-px">
          {label && (
            <span
              className={cn(
                "text-sm font-medium leading-none",
                error ? "text-destructive" : "text-foreground"
              )}
            >
              {label}
            </span>
          )}
          {description && (
            <span
              className={cn(
                "font-normal text-muted-foreground",
                variant === "card"
                  ? "text-xs leading-4 tracking-[-0.24px]"
                  : "text-sm leading-5 tracking-[-0.28px]"
              )}
            >
              {description}
            </span>
          )}
        </div>
      )}
    </RadioGroupPrimitive.Item>
  )
}

export { RadioGroupOption }
export type { RadioGroupOptionProps }
