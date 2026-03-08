import * as React from "react"
import { Tabs } from "radix-ui"

import { cn } from "@/lib/utils"

function TabsRoot({
  className,
  ...props
}: React.ComponentProps<typeof Tabs.Root>) {
  return <Tabs.Root data-slot="tabs" className={className} {...props} />
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof Tabs.List>) {
  return (
    <Tabs.List
      data-slot="tabs-list"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Tabs.Trigger>) {
  return (
    <Tabs.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "group inline-flex items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 min-w-14 text-sm font-medium leading-5 tracking-tight whitespace-nowrap transition-all outline-none",
        "focus-visible:border-focus focus-visible:shadow-focus",
        "cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        "data-[state=inactive]:bg-secondary data-[state=inactive]:text-muted-foreground",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
    </Tabs.Trigger>
  )
}

function TabBadge({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="tabs-badge"
      className={cn(
        "inline-flex items-center justify-center rounded-sm min-w-4 px-1 py-px text-xs font-medium leading-4 tracking-tight shrink-0",
        "group-data-[state=active]:bg-secondary group-data-[state=active]:text-secondary-foreground",
        "group-data-[state=inactive]:bg-input group-data-[state=inactive]:text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof Tabs.Content>) {
  return (
    <Tabs.Content
      data-slot="tabs-content"
      className={cn("mt-2 outline-none", className)}
      {...props}
    />
  )
}

export {
  TabsRoot as Tabs,
  TabsList,
  TabsTrigger,
  TabBadge,
  TabsContent,
}
