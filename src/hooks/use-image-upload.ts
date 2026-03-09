import { useState, useRef, type ChangeEvent } from "react"
import { ALLOWED_TYPES, MAX_SIZE } from "@/lib/settings-service"

export function useImageUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null!)

  function handleSelect(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) return

    if (!ALLOWED_TYPES.includes(selected.type)) {
      setError("Only PNG and JPG files are allowed.")
      setFile(null)
      if (preview) URL.revokeObjectURL(preview)
      setPreview(null)
      if (inputRef.current) inputRef.current.value = ""
      return
    }

    if (selected.size > MAX_SIZE) {
      setError("File is too large. Max size is 2 MB.")
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
