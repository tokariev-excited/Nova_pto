import * as React from "react"
import { cn } from "@/lib/utils"

export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string
  description?: string
  display?: "desc-last" | "desc-second" | "horizontal"
  invalid?: boolean
  htmlFor?: string
  children?: React.ReactNode
}

function Field({
  label,
  description,
  display = "desc-last",
  invalid = false,
  htmlFor,
  children,
  className,
  ...props
}: FieldProps) {
  const isHorizontal = display === "horizontal"

  const labelEl = label && (
    <label
      htmlFor={htmlFor}
      className={cn(
        "text-sm font-medium leading-5 tracking-tight shrink-0 w-full",
        invalid ? "text-destructive" : "text-foreground"
      )}
    >
      {label}
    </label>
  )

  const descriptionEl = description && (
    <p className="text-sm font-normal leading-5 tracking-tight text-muted-foreground w-full">
      {description}
    </p>
  )

  return (
    <div
      data-slot="field"
      data-invalid={invalid || undefined}
      className={cn(
        "flex items-start",
        isHorizontal ? "flex-row gap-3" : "flex-col gap-2",
        className
      )}
      {...props}
    >
      {isHorizontal ? (
        <>
          <div className="flex flex-1 min-w-0 flex-col gap-1.5">
            {labelEl}
            {descriptionEl}
          </div>
          <div className="flex flex-1 min-w-0">
            {children}
          </div>
        </>
      ) : display === "desc-second" ? (
        <>
          {labelEl}
          {descriptionEl}
          {children}
        </>
      ) : (
        <>
          {labelEl}
          {children}
          {descriptionEl}
        </>
      )}
    </div>
  )
}

export { Field }
