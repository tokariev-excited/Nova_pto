import type { ReactNode } from "react"

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid grid-cols-[1fr_1fr] h-screen w-screen overflow-hidden bg-background">

      {/* ── Left column ── */}
      <div className="flex flex-col h-full items-start justify-center p-8">
        {/* Body: pushed down from top by pt-40 (matches Figma) */}
        <div className="flex flex-1 w-full items-start justify-center pt-40">
          {/* Card: 320px wide, sections separated by 40px */}
          <div className="flex w-[320px] flex-col items-center gap-10">
            {children}
          </div>
        </div>
      </div>

      {/* ── Right column (hidden on mobile) ── */}
      <div className="relative hidden md:flex h-full items-center overflow-hidden pl-24 pt-8">

        {/* Full-bleed background: flat #f4f4f5 + Figma gradient overlay */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[#f4f4f5]" />
          <img
            alt=""
            className="absolute inset-0 size-full object-cover"
            src="/assets/auth-right-bg.png"
          />
        </div>

        {/* App mockup — fills padded column width, maintains 624:741 aspect ratio */}
        <div className="relative w-full max-h-full shrink-0 overflow-hidden aspect-[624/741]">
          <img
            alt="Nova PTO app preview"
            className="absolute inset-0 size-full object-cover object-left-top"
            src="/assets/app-preview.png"
          />
        </div>

      </div>

    </div>
  )
}