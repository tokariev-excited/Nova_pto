import { useState, useMemo, useRef } from "react"
import { Check, ChevronDown, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CalendarArrowButton } from "@/components/ui/calendar-arrow-button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface FilterOption {
  id: string
  label: string
  avatarUrl?: string
  initials?: string
}

interface CalendarFiltersProps {
  currentMonth: Date
  onPrevMonth: () => void
  onNextMonth: () => void
  onToday: () => void
  selectedUser: string
  onUserChange: (value: string) => void
  selectedCategory: string
  onCategoryChange: (value: string) => void
  users: FilterOption[]
  categories: FilterOption[]
}

const monthYearFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
})

function CalendarFilters({
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onToday,
  selectedUser,
  onUserChange,
  selectedCategory,
  onCategoryChange,
  users,
  categories,
}: CalendarFiltersProps) {
  const [usersOpen, setUsersOpen] = useState(false)
  const [usersQuery, setUsersQuery] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)

  const selectedUserLabel = useMemo(() => {
    if (selectedUser === "all") return "All"
    return users.find((u) => u.id === selectedUser)?.label ?? "All"
  }, [selectedUser, users])

  const filteredUsers = useMemo(() => {
    const q = usersQuery.toLowerCase().trim()
    if (!q) return users
    return users.filter((u) => u.label.toLowerCase().includes(q))
  }, [users, usersQuery])

  function handleUserSelect(id: string) {
    onUserChange(id)
    setUsersOpen(false)
    setUsersQuery("")
  }

  return (
    <div className="flex items-center justify-between">
      {/* Left: navigation */}
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={onToday}>
          Today
        </Button>
        <CalendarArrowButton direction="left" onClick={onPrevMonth} />
        <CalendarArrowButton direction="right" onClick={onNextMonth} />
        <h2 className="text-base font-semibold leading-6 text-foreground ml-1">
          {monthYearFormatter.format(currentMonth)}
        </h2>
      </div>

      {/* Right: filters */}
      <div className="flex items-center gap-3">
        {/* Users combobox */}
        <Popover
          open={usersOpen}
          onOpenChange={(open) => {
            setUsersOpen(open)
            if (!open) setUsersQuery("")
          }}
        >
          <PopoverTrigger asChild>
            <button
              className={cn(
                "group flex h-9 items-center gap-1 rounded-md border border-input bg-background px-3 py-2",
                "text-sm leading-5 tracking-tight font-medium shadow-xs whitespace-nowrap",
                "transition-[color,border-color,box-shadow] outline-none",
                "focus:border-focus focus:shadow-focus",
                "cursor-pointer",
              )}
            >
              <span className="text-muted-foreground">Users:</span>
              <span>{selectedUserLabel}</span>
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-muted-foreground ml-1 transition-transform",
                  usersOpen && "rotate-180",
                )}
              />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-[220px] p-0"
            onOpenAutoFocus={(e) => {
              e.preventDefault()
              searchInputRef.current?.focus()
            }}
          >
            {/* Search input */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search users..."
                value={usersQuery}
                onChange={(e) => setUsersQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm leading-5 outline-none placeholder:text-muted-foreground"
              />
            </div>

            {/* Options list */}
            <div className="max-h-[200px] overflow-y-auto p-1">
              {/* "All" option — always visible */}
              {!usersQuery.trim() && (
                <button
                  type="button"
                  className={cn(
                    "relative flex w-full items-center gap-2 rounded-sm py-1.5 pr-8 pl-2",
                    "text-sm leading-5 tracking-tight outline-hidden select-none cursor-pointer",
                    "hover:bg-accent hover:text-accent-foreground",
                  )}
                  onClick={() => handleUserSelect("all")}
                >
                  All
                  {selectedUser === "all" && (
                    <Check className="absolute right-2 size-4" />
                  )}
                </button>
              )}

              {/* User options */}
              {filteredUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  className={cn(
                    "relative flex w-full items-center gap-2 rounded-sm py-1.5 pr-8 pl-2",
                    "text-sm leading-5 tracking-tight outline-hidden select-none cursor-pointer",
                    "hover:bg-accent hover:text-accent-foreground",
                  )}
                  onClick={() => handleUserSelect(u.id)}
                >
                  <Avatar
                    size="2xs"
                    shape="square"
                    src={u.avatarUrl}
                    alt={u.label}
                    fallback={u.initials}
                  />
                  {u.label}
                  {selectedUser === u.id && (
                    <Check className="absolute right-2 size-4" />
                  )}
                </button>
              ))}

              {filteredUsers.length === 0 && usersQuery.trim() && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No users found
                </p>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Time-off category select */}
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-auto whitespace-nowrap *:data-[slot=select-value]:flex-none">
            <span className="flex items-center gap-1">
              <span className="text-muted-foreground">Time-off category:</span>
              <SelectValue />
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export { CalendarFilters }
export type { CalendarFiltersProps }
