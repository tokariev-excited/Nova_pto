import * as React from "react"
import { ChevronDownIcon, EllipsisIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export type BreadcrumbItemType = "default" | "dropdown" | "ellipsis"

export interface BreadcrumbItemProps extends React.ComponentProps<"span"> {
  type?: BreadcrumbItemType
  text?: string
}

export function BreadcrumbItem({
  type = "default",
  text,
  className,
  ...props
}: BreadcrumbItemProps) {
  return (
    <span
      data-slot="breadcrumb-item"
      data-type={type}
      className={cn(
        "inline-flex items-center font-sans text-sm font-normal leading-5 tracking-[-0.28px] whitespace-nowrap",
        "text-muted-foreground hover:text-foreground transition-colors cursor-pointer",
        type === "dropdown" && "gap-1.5",
        type === "ellipsis" && "justify-center p-0.5",
        className
      )}
      {...props}
    >
      {type === "ellipsis" ? (
        <>
          <EllipsisIcon className="size-4" />
          <span className="sr-only">More</span>
        </>
      ) : (
        <>
          {text}
          {type === "dropdown" && <ChevronDownIcon className="size-4" />}
        </>
      )}
    </span>
  )
}
