import { cn } from "@/lib/utils"

interface NovaLogoProps {
  className?: string
  size?: 40 | 24
}

export function NovaLogo({ className, size = 40 }: NovaLogoProps) {
  const src = "/assets/Logo.svg"
  const dim = size === 24 ? "size-6" : "size-[40px]"
  return (
    <img
      src={src}
      alt="Nova logo"
      className={cn(dim, "shrink-0", className)}
    />
  )
}