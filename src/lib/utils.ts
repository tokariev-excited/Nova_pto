import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(firstName?: string, lastName?: string): string | undefined {
  const f = firstName?.trim().charAt(0).toUpperCase() ?? ""
  const l = lastName?.trim().charAt(0).toUpperCase() ?? ""
  return (f + l) || undefined
}

export function getDisplayName(firstName?: string, lastName?: string): string {
  return [firstName?.trim(), lastName?.trim()].filter(Boolean).join(" ")
}
