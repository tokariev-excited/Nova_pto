import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { CircleCheck, CircleDashed, CircleX } from "lucide-react"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center overflow-hidden rounded-sm text-xs font-medium leading-4 tracking-[-0.24px] whitespace-nowrap",
  {
    variants: {
      variant: {
        pending: "bg-warning-light text-warning-foreground",
        approved: "bg-success-light text-success-foreground",
        rejected: "bg-error-light text-error-foreground",
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-foreground",
        outline: "border border-border text-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        active: "bg-primary text-primary-foreground",
      },
      size: {
        default: "gap-1 px-1.5 py-0.5",
        number: "min-w-4 gap-0 px-1 py-px",
      },
    },
    compoundVariants: [
      { variant: "secondary", size: "number", className: "bg-input text-muted-foreground" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const statusIconMap: Partial<
  Record<string, React.ComponentType<{ className?: string }>>
> = {
  pending: CircleDashed,
  approved: CircleCheck,
  rejected: CircleX,
}

function Badge({
  className,
  variant = "default",
  size = "default",
  leftIcon,
  rightIcon,
  children,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
  }) {
  const StatusIcon = statusIconMap[variant!]
  const isNumber = size === "number"

  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    >
      {!isNumber && (leftIcon || (StatusIcon && <StatusIcon className="size-3 shrink-0" />))}
      {children}
      {!isNumber && rightIcon}
    </span>
  )
}

export { Badge, badgeVariants }
