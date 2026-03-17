import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "w-full min-w-0 rounded-md border border-input bg-background px-3 py-2.5 text-sm leading-5 tracking-tight shadow-xs transition-[color,border-color,box-shadow] outline-none",
        "selection:bg-primary selection:text-primary-foreground",
        "placeholder:text-muted-foreground",
        "focus-visible:border-focus focus-visible:shadow-focus",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:shadow-destructive-focus",
        "min-h-[80px] resize-none",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
