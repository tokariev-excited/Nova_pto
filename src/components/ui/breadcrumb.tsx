import * as React from "react"
import { ChevronRightIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { BreadcrumbItem, type BreadcrumbItemType } from "@/components/ui/breadcrumb-item"

export interface BreadcrumbEntry {
  type?: BreadcrumbItemType
  text?: string
  href?: string
  onClick?: React.MouseEventHandler<HTMLSpanElement>
  current?: boolean
}

export interface BreadcrumbProps extends React.ComponentProps<"nav"> {
  items: BreadcrumbEntry[]
}

export function Breadcrumb({ items, className, ...props }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      data-slot="breadcrumb"
      className={cn(className)}
      {...props}
    >
      <ol className="inline-flex items-center gap-2.5">
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <li aria-hidden="true" className="flex items-center">
                <ChevronRightIcon className="size-4 text-muted-foreground shrink-0" />
              </li>
            )}
            <li className="flex items-center">
              {item.href && !item.current ? (
                <a href={item.href} className="inline-flex">
                  <BreadcrumbItem type={item.type} text={item.text} />
                </a>
              ) : (
                <BreadcrumbItem
                  type={item.type}
                  text={item.text}
                  onClick={!item.current ? item.onClick : undefined}
                  aria-current={item.current ? "page" : undefined}
                  className={item.current ? "text-foreground cursor-default" : undefined}
                />
              )}
            </li>
          </React.Fragment>
        ))}
      </ol>
    </nav>
  )
}
