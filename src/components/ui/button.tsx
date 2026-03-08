import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { LoaderCircle } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-medium tracking-tight whitespace-nowrap transition-all outline-none focus-visible:shadow-focus disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:shadow-destructive-focus [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-2xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-2xs hover:bg-destructive/90 focus-visible:shadow-destructive-focus",
        outline:
          "border border-input bg-background text-foreground shadow-2xs hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground",
        link:
          "text-foreground underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 text-sm has-[>svg]:px-3",
        sm: "h-8 px-3 py-2 text-xs has-[>svg]:px-2.5",
        lg: "h-10 px-6 py-2 text-sm has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10 p-2.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  loadingText,
  children,
  disabled,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    loading?: boolean
    loadingText?: string
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(
        buttonVariants({ variant, size, className }),
        loading && "relative opacity-50 pointer-events-none"
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && loadingText ? (
        <>
          <LoaderCircle className="size-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        <>
          {loading && (
            <span className="absolute inset-0 flex items-center justify-center">
              <LoaderCircle className="size-4 animate-spin" />
            </span>
          )}
          <span className={cn("inline-flex items-center gap-2", loading && "invisible")}>
            {children}
          </span>
        </>
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
