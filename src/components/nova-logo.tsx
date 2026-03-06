import { cn } from "@/lib/utils"

interface NovaLogoProps {
  className?: string
  size?: 40 | 32 | 24
}

const sizeClasses: Record<NonNullable<NovaLogoProps["size"]>, string> = {
  40: "size-[40px]",
  32: "size-8",
  24: "size-6",
}

export function NovaLogo({ className, size = 40 }: NovaLogoProps) {
  const src = "/assets/Logo.svg"
  const dim = sizeClasses[size]
  return (
    <img
      src={src}
      alt="Nova logo"
      className={cn(dim, "shrink-0", className)}
    />
  )
}