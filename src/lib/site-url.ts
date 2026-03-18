/**
 * Returns the base URL for auth redirects.
 * Uses VITE_SITE_URL env var (set in Vercel), falls back to current origin for local dev.
 */
export function getSiteUrl(): string {
  return import.meta.env.VITE_SITE_URL || window.location.origin
}
