import { useState, useRef, type ChangeEvent } from "react"
import { validateImageFile } from "@/lib/utils"

export function useImageUpload(options?: { initialPreview?: string }) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(options?.initialPreview ?? null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null!)

  function handleSelect(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) return

    const validationError = validateImageFile(selected)
    if (validationError) {
      setError(validationError)
      setFile(null)
      if (preview) URL.revokeObjectURL(preview)
      setPreview(null)
      if (inputRef.current) inputRef.current.value = ""
      return
    }

    setError(null)
    setFile(selected)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(URL.createObjectURL(selected))
  }

  function handleRemove() {
    setFile(null)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  return { file, preview, error, inputRef, handleSelect, handleRemove }
}
