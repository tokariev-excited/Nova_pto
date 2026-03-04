import * as React from "react"
import { SearchIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ComboboxSearchFieldProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>
}

function ComboboxSearchField({
  value,
  onValueChange,
  placeholder = "Search…",
  inputProps,
  className,
  ...props
}: ComboboxSearchFieldProps) {
  return (
    <div
      data-slot="combobox-search-field"
      className={cn(
        "flex items-center px-3 py-2.5 border-b border-border bg-popover",
        className
      )}
      {...props}
    >
      <SearchIcon className="size-4 shrink-0 mr-2 text-muted-foreground" />
      <input
        type="text"
        role="searchbox"
        placeholder={placeholder}
        value={value}
        onChange={e => onValueChange?.(e.target.value)}
        autoComplete="off"
        className={cn(
          "flex-1 bg-transparent outline-none border-none",
          "text-sm font-normal leading-5 tracking-tight text-foreground",
          "placeholder:text-muted-foreground",
          inputProps?.className
        )}
        {...inputProps}
      />
    </div>
  )
}

export { ComboboxSearchField }
