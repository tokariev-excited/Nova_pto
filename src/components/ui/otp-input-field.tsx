import { cn } from "@/lib/utils"

interface OtpInputFieldProps {
  char?: string
  type: "Left" | "Center" | "Right"
  state: "Default" | "Focus" | "Focus-Filled"
  className?: string
}

function OtpInputField({ char, type, state, className }: OtpInputFieldProps) {
  const isFocused = state === "Focus" || state === "Focus-Filled"
  const borderClass = isFocused ? "border-focus shadow-focus" : "border-input shadow-xs"

  const radiusClass =
    type === "Left" ? "rounded-l-md" :
    type === "Right" ? "rounded-r-md" : ""

  return (
    <div className={cn(
      "size-9 border bg-background flex items-center justify-center relative overflow-clip",
      borderClass, radiusClass, className
    )}>
      {state === "Focus" && !char
        ? <div className="w-px h-5 bg-foreground animate-pulse" />
        : <span className="text-sm tracking-tight text-foreground">{char}</span>
      }
    </div>
  )
}

export { OtpInputField }
export type { OtpInputFieldProps }
