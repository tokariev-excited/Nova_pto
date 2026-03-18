import { useSyncExternalStore, useRef, useState, useEffect } from "react"
import { CheckCircle2, AlertCircle } from "lucide-react"
import { subscribe, getSnapshot, removeToast } from "@/lib/toast"
import type { Toast } from "@/lib/toast"

function ToastItem({ toast }: { toast: Toast }) {
  const [leaving, setLeaving] = useState(false)
  const duration = toast.duration ?? 5000

  useEffect(() => {
    const leaveTimer = setTimeout(() => setLeaving(true), duration - 300)
    return () => clearTimeout(leaveTimer)
  }, [duration])

  return (
    <div
      className={
        "w-[360px] rounded-xl border border-border bg-background shadow-md p-4 flex gap-3 " +
        (leaving
          ? "animate-out fade-out slide-out-to-right-4 duration-200"
          : "animate-in fade-in slide-in-from-right-4 duration-300")
      }
    >
      {toast.variant === "error" ? (
        <AlertCircle className="size-5 shrink-0 mt-0.5 text-error" />
      ) : (
        <CheckCircle2 className="size-5 shrink-0 mt-0.5 text-success" />
      )}
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-semibold text-foreground">{toast.title}</p>
        {toast.description && (
          <p className="text-sm text-muted-foreground">{toast.description}</p>
        )}
      </div>
    </div>
  )
}

export function Toaster() {
  const toasts = useSyncExternalStore(subscribe, getSnapshot)

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  )
}
