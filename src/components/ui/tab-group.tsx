import * as React from "react"
import { Tabs, TabsList, TabsTrigger, TabBadge, TabsContent } from "@/components/ui/tabs"

export interface TabGroupItem {
  value: string
  label: string
  badge?: string | number
  content?: React.ReactNode
}

export interface TabGroupProps
  extends Omit<React.ComponentProps<typeof Tabs>, "children"> {
  items: TabGroupItem[]
}

function TabGroup({ items, ...props }: TabGroupProps) {
  return (
    <Tabs defaultValue={items[0]?.value} data-slot="tab-group" {...props}>
      <TabsList className="bg-secondary p-1 rounded-lg">
        {items.map((item) => (
          <TabsTrigger key={item.value} value={item.value}>
            {item.label}
            {item.badge !== undefined && (
              <TabBadge>{item.badge}</TabBadge>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
      {items
        .filter((item) => item.content !== undefined)
        .map((item) => (
          <TabsContent key={item.value} value={item.value}>
            {item.content}
          </TabsContent>
        ))}
    </Tabs>
  )
}

export { TabGroup }
