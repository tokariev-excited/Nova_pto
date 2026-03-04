import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { FolderCode } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar } from "@/components/ui/avatar"

const emptyMediaVariants = cva("relative flex shrink-0 items-center justify-center", {
  variants: {
    type: {
      icon: "bg-muted p-2 rounded-md",
      avatar: "",
      "avatar-group": "",
    },
  },
  defaultVariants: { type: "icon" },
})

interface EmptyMediaAvatarData {
  src?: string
  alt?: string
  fallback?: string
}

interface EmptyMediaProps
  extends Omit<React.ComponentProps<"div">, "children">,
    VariantProps<typeof emptyMediaVariants> {
  icon?: React.ElementType
  avatarSrc?: string
  avatarAlt?: string
  avatarFallback?: string
  avatars?: EmptyMediaAvatarData[]
}

function EmptyMedia({
  type = "icon",
  icon,
  avatarSrc,
  avatarAlt,
  avatarFallback,
  avatars = [],
  className,
  ...props
}: EmptyMediaProps) {
  const Icon = icon ?? FolderCode

  return (
    <div data-slot="empty-media" className={cn(emptyMediaVariants({ type }), className)} {...props}>
      {type === "icon" && <Icon className="size-6" />}

      {type === "avatar" && (
        <Avatar size="lg" shape="circle" src={avatarSrc} alt={avatarAlt} fallback={avatarFallback} />
      )}

      {type === "avatar-group" && (
        <div className="flex items-center pr-3.5">
          {avatars.slice(0, 3).map((av, i) => (
            <Avatar
              key={i}
              size="lg"
              shape="circle"
              src={av.src}
              alt={av.alt}
              fallback={av.fallback}
              className="border-[1.33px] border-background -mr-3.5"
            />
          ))}
        </div>
      )}
    </div>
  )
}

export { EmptyMedia }
export type { EmptyMediaAvatarData, EmptyMediaProps }
