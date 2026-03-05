import { useState, useRef } from "react"
import { Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { OtpInputField } from "@/components/ui/otp-input-field"

interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  segments?: "One" | "Two" | "Three"
  state?: "Enabled" | "Disabled" | "Destructive"
  alignment?: "left" | "center"
  label?: string
  helpText?: string
  errorText?: string
  autoFocus?: boolean
  className?: string
}

function OtpInput({
  value,
  onChange,
  segments = "One",
  state = "Enabled",
  alignment = "left",
  label,
  helpText,
  errorText,
  autoFocus,
  className,
}: OtpInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const disabled = state === "Disabled"
  const destructive = state === "Destructive"
  const chars = Array.from({ length: 6 }, (_, i) => value[i] ?? "")
  const activeIndex = Math.min(value.length, 5)

  function getCellType(i: number): "Left" | "Center" | "Right" {
    if (segments === "One") {
      return i === 0 ? "Left" : i === 5 ? "Right" : "Center"
    }
    if (segments === "Two") {
      return i % 3 === 0 ? "Left" : i % 3 === 2 ? "Right" : "Center"
    }
    // "Three"
    return i % 2 === 0 ? "Left" : "Right"
  }

  function getCellState(i: number): "Default" | "Focus" | "Focus-Filled" {
    if (!isFocused || disabled) return "Default"
    if (i === activeIndex) return chars[i] ? "Focus-Filled" : "Focus"
    return "Default"
  }

  function renderGroup(start: number, count: number) {
    return (
      <div className="flex items-center">
        {Array.from({ length: count }, (_, j) => (
          <OtpInputField
            key={start + j}
            char={chars[start + j]}
            type={getCellType(start + j)}
            state={getCellState(start + j)}
          />
        ))}
      </div>
    )
  }

  function renderCells() {
    if (segments === "One") {
      return renderGroup(0, 6)
    }
    if (segments === "Two") {
      return (
        <>
          {renderGroup(0, 3)}
          <Minus className="size-6 text-foreground shrink-0" strokeWidth={1.5} />
          {renderGroup(3, 3)}
        </>
      )
    }
    // "Three"
    return (
      <>
        {renderGroup(0, 2)}
        <Minus className="size-6 text-foreground shrink-0" strokeWidth={1.5} />
        {renderGroup(2, 2)}
        <Minus className="size-6 text-foreground shrink-0" strokeWidth={1.5} />
        {renderGroup(4, 2)}
      </>
    )
  }

  const textAlign = alignment === "center" ? "text-center" : ""

  return (
    <div className={cn("flex flex-col gap-1.5", disabled && "opacity-50 pointer-events-none", className)}>
      {label && (
        <span className={cn(
          "text-sm font-medium tracking-tight",
          destructive ? "text-destructive" : "text-foreground",
          textAlign
        )}>
          {label}
        </span>
      )}

      <div
        className={cn("relative flex items-center gap-2", alignment === "center" && "justify-center")}
        onClick={() => inputRef.current?.focus()}
      >
        {renderCells()}
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={value}
          onChange={e => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
          onKeyDown={e => {
            if (e.key === "Backspace" && value.length > 0) onChange(value.slice(0, -1))
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="absolute inset-0 opacity-0 cursor-text"
          disabled={disabled}
          autoFocus={autoFocus}
          maxLength={6}
          aria-label="One-time password"
        />
      </div>

      {helpText && !destructive && (
        <span className={cn("text-sm tracking-tight text-muted-foreground", textAlign)}>
          {helpText}
        </span>
      )}

      {errorText && destructive && (
        <span className={cn("text-sm tracking-tight text-destructive", textAlign)}>
          {errorText}
        </span>
      )}
    </div>
  )
}

export { OtpInput }
export type { OtpInputProps }
