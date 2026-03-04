import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface EmptyContentAction {
  label: string
  onClick?: () => void
  icon?: React.ElementType
}

interface EmptyContentProps
  extends Omit<React.ComponentProps<"div">, "children">,
    VariantProps<typeof emptyContentVariants> {
  primaryAction: EmptyContentAction
  secondaryAction?: EmptyContentAction
  linkAction?: EmptyContentAction
}

const emptyContentVariants = cva("relative flex", {
  variants: {
    layout: {
      single: "items-start justify-center",
      "two-vertical": "flex-col gap-4 items-start",
      "two-horizontal": "gap-2 items-start",
      three: "flex-col gap-2 items-center",
    },
  },
  defaultVariants: { layout: "single" },
})

function EmptyContent({
  layout = "single",
  primaryAction,
  secondaryAction,
  linkAction,
  className,
  ...props
}: EmptyContentProps) {
  const LinkBtn = linkAction && (
    <Button variant="ghost" className="text-muted-foreground" onClick={linkAction.onClick}>
      {linkAction.label}
      {linkAction.icon && <linkAction.icon />}
    </Button>
  )

  const PrimaryBtn = (extraClass?: string) => (
    <Button className={extraClass} onClick={primaryAction.onClick}>
      {primaryAction.label}
      {primaryAction.icon && <primaryAction.icon />}
    </Button>
  )

  const SecondaryBtn = secondaryAction && (
    <Button variant="outline" onClick={secondaryAction.onClick}>
      {secondaryAction.label}
      {secondaryAction.icon && <secondaryAction.icon />}
    </Button>
  )

  return (
    <div
      data-slot="empty-content"
      className={cn(emptyContentVariants({ layout }), className)}
      {...props}
    >
      {layout === "single" && <>{PrimaryBtn()}</>}
      {layout === "two-vertical" && (
        <>
          {PrimaryBtn("w-full")}
          {LinkBtn}
        </>
      )}
      {layout === "two-horizontal" && (
        <>
          {PrimaryBtn()}
          {SecondaryBtn}
        </>
      )}
      {layout === "three" && (
        <>
          <div className="flex gap-2 items-start justify-center w-full">
            {PrimaryBtn()}
            {SecondaryBtn}
          </div>
          {LinkBtn}
        </>
      )}
    </div>
  )
}

export { EmptyContent }
export type { EmptyContentAction, EmptyContentProps }
