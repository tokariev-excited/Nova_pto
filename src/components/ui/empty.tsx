import * as React from "react"
import { cn } from "@/lib/utils"
import { EmptyMedia, type EmptyMediaProps } from "@/components/ui/empty-media"
import { EmptyContent, type EmptyContentProps } from "@/components/ui/empty-content"

interface EmptyProps extends Omit<React.ComponentProps<"div">, "children" | "content"> {
  title?: string
  description?: string
  media?: EmptyMediaProps
  content?: EmptyContentProps
}

function Empty({ title, description, media, content, className, ...props }: EmptyProps) {
  return (
    <div
      data-slot="empty"
      className={cn("flex flex-col gap-6 items-center", className)}
      {...props}
    >
      {(media || title || description) && (
        <div className="flex flex-col gap-2 items-center w-full max-w-sm">
          {media && <EmptyMedia {...media} />}
          {(title || description) && (
            <div className="flex flex-col gap-2 items-start text-center w-full">
              {title && (
                <p className="text-lg font-medium leading-8 tracking-[-0.36px] text-foreground w-full">
                  {title}
                </p>
              )}
              {description && (
                <p className="text-sm font-normal leading-5 tracking-[-0.28px] text-muted-foreground w-full">
                  {description}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {content && (
        <div className="w-full max-w-sm flex items-center justify-center">
          <EmptyContent {...content} />
        </div>
      )}
    </div>
  )
}

export { Empty }
export type { EmptyProps }
