import { useState, useMemo } from "react"
import { BalanceOverview } from "@/components/balance-overview"
import { CalendarClock, EllipsisIcon, Eye, FileSearch, ListCheck, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { DataTableHeaderCell } from "@/components/ui/data-table-header-cell"
import { DataTableCell } from "@/components/ui/data-table-cell"
import { Badge } from "@/components/ui/badge"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { BreadcrumbItem } from "@/components/ui/breadcrumb-item"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { ComboboxMenu } from "@/components/ui/combobox-menu"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { SubmitTimeOffRequestModal } from "@/components/submit-time-off-request-modal"
import { RequestDetailsModal } from "@/components/request-details-modal"
import { useMyTimeOffRequests, useWithdrawRequestMutation } from "@/hooks/use-time-off-requests"
import { useTimeOffCategories } from "@/hooks/use-time-off-categories"
import { formatPeriod, formatDays } from "@/lib/date-utils"
import { getCategoryDisplay } from "@/lib/request-display"
import { addToast } from "@/lib/toast"
import type { TimeOffRequest } from "@/types/time-off-request"

export function EmployeeRequestsPage() {
  const [requestModalOpen, setRequestModalOpen] = useState(false)
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null)
  const [withdrawTarget, setWithdrawTarget] = useState<TimeOffRequest | null>(null)
  const [detailsRequest, setDetailsRequest] = useState<TimeOffRequest | null>(null)
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const { data: myRequests = [], isLoading } = useMyTimeOffRequests()
  const { data: categories = [] } = useTimeOffCategories()
  const withdrawMutation = useWithdrawRequestMutation()

  const categoryMap = useMemo(() => {
    const map = new Map<string, { name: string; emoji?: string | null }>()
    for (const c of categories) map.set(c.id, { name: c.name, emoji: c.emoji })
    return map
  }, [categories])

  const totalPages = Math.max(1, Math.ceil(myRequests.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedRequests = useMemo(
    () => myRequests.slice((safePage - 1) * pageSize, safePage * pageSize),
    [myRequests, safePage, pageSize]
  )

  function handleWithdrawConfirm() {
    if (!withdrawTarget) return
    withdrawMutation.mutate(withdrawTarget.id, {
      onSuccess: () => {
        addToast({ variant: "success", title: "Request withdrawn", description: "Your time off request has been withdrawn." })
        setWithdrawTarget(null)
      },
      onError: () => {
        addToast({ variant: "error", title: "Failed to withdraw", description: "Something went wrong. Please try again." })
      },
    })
  }

  return (
    <div className="flex flex-col size-full">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 h-[60px] shrink-0">
        <button className="flex items-center justify-center size-7 rounded-[10px] shrink-0 text-foreground hover:bg-accent transition-colors">
          <ListCheck className="size-4" />
        </button>
        <div className="flex items-center h-6 pr-2 relative shrink-0">
          <Separator orientation="vertical" />
        </div>
        <BreadcrumbItem text="Requests" className="flex-1 text-foreground font-medium" />
        <Button onClick={() => setRequestModalOpen(true)}>
          <CalendarClock />
          Request time off
        </Button>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-5 p-4">
        <BalanceOverview />

        {/* Time Off History */}
        <div className="flex flex-col gap-3">
          <p className="text-lg font-semibold tracking-tight text-primary">Time off history</p>
          <div className="rounded-xl border border-border overflow-hidden">
            {/* Header row */}
            <div className="flex bg-secondary">
              <DataTableHeaderCell type="text" label="Request category" className="w-[260px] pl-4" />
              <DataTableHeaderCell type="text" label="Period" className="w-[240px]" />
              <DataTableHeaderCell type="text" label="Comment" className="flex-1" />
              <DataTableHeaderCell type="text" label="Status" className="w-[240px]" />
              <div className="bg-secondary border-b border-border w-14 shrink-0" />
            </div>

            {/* Body */}
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="size-5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
              </div>
            ) : myRequests.length === 0 ? (
              <div className="flex flex-col items-center gap-6 py-12">
                <div className="flex flex-col items-center gap-2 max-w-sm">
                  <div className="flex items-center justify-center bg-muted rounded-[10px] p-2">
                    <FileSearch className="size-6 text-foreground" />
                  </div>
                  <div className="flex flex-col gap-2 text-center">
                    <p className="text-lg font-medium tracking-tight text-foreground">
                      No time off history yet
                    </p>
                    <p className="text-sm text-muted-foreground tracking-tight">
                      You haven't requested any time off yet. Ready for a break? Check your balance above and submit your first request
                    </p>
                  </div>
                </div>
                <Button onClick={() => setRequestModalOpen(true)}>
                  <CalendarClock />
                  Request time off
                </Button>
              </div>
            ) : (
              <div>
                {paginatedRequests.map((req, index) => {
                  const isLast = index === paginatedRequests.length - 1
                  const isPending = req.status === "pending"
                  return (
                    <div key={req.id} className="flex hover:bg-muted/50 cursor-pointer" onClick={() => setDetailsRequest(req)}>
                      <DataTableCell
                        type="text"
                        size="md"
                        className="w-[260px] pl-4"
                        labelClassName="font-medium"
                        label={getCategoryDisplay(req, categoryMap)}
                        border={!isLast}
                      />
                      <DataTableCell
                        type="text-description"
                        size="md"
                        className="w-[240px]"
                        label={formatPeriod(req.start_date, req.end_date)}
                        description={formatDays(req.total_days)}
                        border={!isLast}
                      />
                      <DataTableCell
                        type="text"
                        size="md"
                        className="flex-1"
                        label={req.comment ?? "—"}
                        border={!isLast}
                      />
                      <DataTableCell
                        type="badge"
                        size="md"
                        className="w-[240px]"
                        badgeNode={
                          <Badge variant={req.status}>
                            {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                          </Badge>
                        }
                        border={!isLast}
                      />
                      <div
                        className="relative flex items-center justify-center w-14 h-[72px] px-3 py-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Popover
                          open={openPopoverId === req.id}
                          onOpenChange={(open) =>
                            setOpenPopoverId(open ? req.id : null)
                          }
                        >
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <EllipsisIcon className="size-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            align="end"
                            className="p-0 border-0 shadow-none"
                          >
                            <ComboboxMenu
                              groups={
                                isPending
                                  ? [
                                      {
                                        items: [
                                          {
                                            type: "icon",
                                            icon: <Eye className="size-4" />,
                                            label: "View details",
                                            onClick: () => {
                                              setOpenPopoverId(null)
                                              setDetailsRequest(req)
                                            },
                                          },
                                        ],
                                      },
                                      {
                                        items: [
                                          {
                                            type: "icon",
                                            variant: "destructive",
                                            icon: <RotateCcw className="size-4" />,
                                            label: "Withdraw request",
                                            onClick: () => {
                                              setOpenPopoverId(null)
                                              setWithdrawTarget(req)
                                            },
                                          },
                                        ],
                                      },
                                    ]
                                  : [
                                      {
                                        items: [
                                          {
                                            type: "icon",
                                            icon: <Eye className="size-4" />,
                                            label: "View details",
                                            onClick: () => {
                                              setOpenPopoverId(null)
                                              setDetailsRequest(req)
                                            },
                                          },
                                        ],
                                      },
                                    ]
                              }
                            />
                          </PopoverContent>
                        </Popover>
                        {!isLast && <div className="absolute bottom-0 left-0 right-0 border-b border-border" />}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {myRequests.length > 10 && (
            <DataTablePagination
              type="detailed"
              totalRows={myRequests.length}
              rowsPerPage={String(pageSize)}
              onRowsPerPageChange={(v) => { setPageSize(Number(v)); setCurrentPage(1) }}
              rowsPerPageOptions={["10", "20", "30", "50"]}
              currentPage={safePage}
              totalPages={totalPages}
              canPrevious={safePage > 1}
              canNext={safePage < totalPages}
              onFirstPage={() => setCurrentPage(1)}
              onPrevious={() => setCurrentPage((p) => Math.max(1, p - 1))}
              onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              onLastPage={() => setCurrentPage(totalPages)}
            />
          )}
        </div>
      </div>

      <SubmitTimeOffRequestModal
        open={requestModalOpen}
        onOpenChange={setRequestModalOpen}
      />

      <RequestDetailsModal
        open={!!detailsRequest}
        onOpenChange={(open) => { if (!open) setDetailsRequest(null) }}
        request={detailsRequest}
        categoryMap={categoryMap}
      />

      <AlertDialog
        open={!!withdrawTarget}
        onOpenChange={(open) => {
          if (!open) setWithdrawTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw this request?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your time-off request? You can always submit a new one later if your plans change.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, keep it</AlertDialogCancel>
            <AlertDialogAction onClick={handleWithdrawConfirm}>
              Yes, withdraw
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
