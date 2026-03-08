import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { Settings, Plus, Trash2, CloudUpload } from "lucide-react"

import { useAuth } from "@/contexts/auth-context"
import { useNavigationGuard } from "@/contexts/navigation-guard-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Avatar } from "@/components/ui/avatar"
import { BreadcrumbItem } from "@/components/ui/breadcrumb-item"
import {
  fetchDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  updateWorkspace,
  updateProfile,
  uploadImage,
  removeImage,
} from "@/lib/settings-service"
import type { Department } from "@/types/department"

interface DepartmentRow {
  id: string
  name: string
  isNew: boolean
}

interface InitialValues {
  workspaceName: string
  fullName: string
  logoUrl: string | null
  avatarUrl: string | null
  departments: DepartmentRow[]
}

export function SettingsPage() {
  const { workspace, profile, user, refreshWorkspace, refreshProfile } = useAuth()
  const { registerGuard, unregisterGuard } = useNavigationGuard()

  const [workspaceName, setWorkspaceName] = useState("")
  const [fullName, setFullName] = useState("")
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [logoRemoved, setLogoRemoved] = useState(false)
  const [avatarRemoved, setAvatarRemoved] = useState(false)
  const [departments, setDepartments] = useState<DepartmentRow[]>([])
  const [deletedDepartmentIds, setDeletedDepartmentIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [initialValues, setInitialValues] = useState<InitialValues | null>(null)

  const logoInputRef = useRef<HTMLInputElement>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Load initial data
  useEffect(() => {
    if (!workspace || !profile) return

    const wName = workspace.name || ""
    const fName = profile.full_name || ""
    const lUrl = workspace.logo_url || null
    const aUrl = profile.avatar_url || null

    setWorkspaceName(wName)
    setFullName(fName)
    setLogoUrl(lUrl)
    setAvatarUrl(aUrl)

    let cancelled = false

    async function load() {
      let rows: DepartmentRow[] = []
      try {
        const deps = await fetchDepartments(workspace.id)
        rows = deps.map((d: Department) => ({ id: d.id, name: d.name, isNew: false }))
      } catch (err) {
        console.error("Failed to fetch departments:", err)
      }
      if (cancelled) return
      setDepartments(rows)
      setInitialValues({
        workspaceName: wName,
        fullName: fName,
        logoUrl: lUrl,
        avatarUrl: aUrl,
        departments: rows,
      })
      console.log("[Settings] initialValues set:", { wName, fName, lUrl, aUrl, departments: rows })
    }

    load()
    return () => { cancelled = true }
  }, [workspace?.id, profile?.id])

  // Dirty detection
  const isDirty = useMemo(() => {
    if (!initialValues) {
      console.log("[Settings] isDirty: false (no initialValues)")
      return false
    }
    if (workspaceName !== initialValues.workspaceName) return true
    if (fullName !== initialValues.fullName) return true
    // Image dirty: new file staged, OR removing an existing image
    if (logoFile !== null || (logoRemoved && initialValues.logoUrl !== null)) return true
    if (avatarFile !== null || (avatarRemoved && initialValues.avatarUrl !== null)) return true
    if (deletedDepartmentIds.length > 0) return true
    if (departments.some((d) => d.isNew)) return true
    // Check renamed departments
    for (const dept of departments) {
      if (dept.isNew) continue
      const original = initialValues.departments.find((od) => od.id === dept.id)
      if (original && original.name !== dept.name) return true
    }
    console.log("[Settings] isDirty: false (no changes detected)")
    return false
  }, [workspaceName, fullName, logoFile, avatarFile, logoRemoved, avatarRemoved, departments, deletedDepartmentIds, initialValues])

  // Navigation guard
  useEffect(() => {
    registerGuard(() => {
      if (!isDirty) return true
      return window.confirm("You have unsaved changes. Are you sure you want to leave?")
    })
    return () => unregisterGuard()
  }, [isDirty, registerGuard, unregisterGuard])

  // beforeunload
  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [isDirty])

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview)
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    }
  }, [])

  const handleLogoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      alert("Only PNG and JPG files are allowed")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("File must be under 2 MB")
      return
    }
    setLogoFile(file)
    setLogoRemoved(false)
    setLogoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
    e.target.value = ""
  }, [])

  const handleAvatarSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      alert("Only PNG and JPG files are allowed")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("File must be under 2 MB")
      return
    }
    setAvatarFile(file)
    setAvatarRemoved(false)
    setAvatarPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
    e.target.value = ""
  }, [])

  function handleRemoveLogo() {
    setLogoFile(null)
    setLogoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setLogoRemoved(true)
  }

  function handleRemoveAvatar() {
    setAvatarFile(null)
    setAvatarPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setAvatarRemoved(true)
  }

  function handleAddDepartment() {
    setDepartments((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", isNew: true },
    ])
  }

  function handleDepartmentNameChange(id: string, name: string) {
    setDepartments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, name } : d))
    )
  }

  function handleDeleteDepartment(id: string, isNew: boolean) {
    setDepartments((prev) => prev.filter((d) => d.id !== id))
    if (!isNew) {
      setDeletedDepartmentIds((prev) => [...prev, id])
    }
  }

  function handleCancel() {
    if (!initialValues) return
    setWorkspaceName(initialValues.workspaceName)
    setFullName(initialValues.fullName)
    setLogoUrl(initialValues.logoUrl)
    setAvatarUrl(initialValues.avatarUrl)
    setLogoFile(null)
    setAvatarFile(null)
    setLogoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setAvatarPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setLogoRemoved(false)
    setAvatarRemoved(false)
    setDepartments(initialValues.departments)
    setDeletedDepartmentIds([])
  }

  async function handleSave() {
    if (!workspace || !profile || !user) return
    setSaving(true)

    try {
      // 1. Handle workspace logo
      let newLogoUrl = logoUrl
      if (logoFile) {
        if (logoUrl) {
          try { await removeImage("logos", logoUrl) } catch { /* ignore */ }
        }
        newLogoUrl = await uploadImage("logos", workspace.id, logoFile)
      } else if (logoRemoved && logoUrl) {
        try { await removeImage("logos", logoUrl) } catch { /* ignore */ }
        newLogoUrl = null
      }

      // 2. Update workspace
      await updateWorkspace(workspace.id, {
        name: workspaceName,
        logo_url: newLogoUrl,
      })

      // 3. Handle avatar
      let newAvatarUrl = avatarUrl
      if (avatarFile) {
        if (avatarUrl) {
          try { await removeImage("avatars", avatarUrl) } catch { /* ignore */ }
        }
        newAvatarUrl = await uploadImage("avatars", user.id, avatarFile)
      } else if (avatarRemoved && avatarUrl) {
        try { await removeImage("avatars", avatarUrl) } catch { /* ignore */ }
        newAvatarUrl = null
      }

      // 4. Update profile
      await updateProfile(profile.id, {
        full_name: fullName,
        avatar_url: newAvatarUrl,
      })

      // 5. Handle departments
      for (const id of deletedDepartmentIds) {
        await deleteDepartment(id)
      }
      for (const dept of departments) {
        if (dept.isNew) {
          if (dept.name.trim()) {
            await createDepartment(workspace.id, dept.name.trim())
          }
        } else {
          const original = initialValues?.departments.find((od) => od.id === dept.id)
          if (original && original.name !== dept.name && dept.name.trim()) {
            await updateDepartment(dept.id, dept.name.trim())
          }
        }
      }

      // 6. Refresh auth context (updates sidebar)
      await Promise.all([refreshWorkspace(), refreshProfile()])

      // 7. Re-fetch departments and reset state
      const freshDeps = await fetchDepartments(workspace.id)
      const rows = freshDeps.map((d: Department) => ({ id: d.id, name: d.name, isNew: false }))
      setDepartments(rows)
      setLogoUrl(newLogoUrl)
      setAvatarUrl(newAvatarUrl)
      setLogoFile(null)
      setAvatarFile(null)
      setLogoPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
      setAvatarPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
      setLogoRemoved(false)
      setAvatarRemoved(false)
      setDeletedDepartmentIds([])
      setInitialValues({
        workspaceName,
        fullName,
        logoUrl: newLogoUrl,
        avatarUrl: newAvatarUrl,
        departments: rows,
      })
    } catch (err) {
      console.error("Failed to save settings:", err)
      alert("Failed to save settings. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  // Resolve displayed images
  const displayedLogo = logoPreview ?? (logoRemoved ? null : logoUrl)
  const displayedAvatar = avatarPreview ?? (avatarRemoved ? null : avatarUrl)
  const hasLogo = !!displayedLogo
  const hasAvatar = !!displayedAvatar
  const nameInitial = fullName ? fullName.charAt(0).toUpperCase() : "Y"

  return (
    <div className="flex flex-col size-full">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <button className="flex items-center justify-center size-7 rounded-[10px] shrink-0 text-foreground hover:bg-accent transition-colors">
          <Settings className="size-4" />
        </button>
        <div className="flex items-center h-6 pr-2 relative shrink-0">
          <Separator orientation="vertical" />
        </div>
        <BreadcrumbItem text="Settings" className="flex-1 text-foreground font-medium" />
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[600px] py-8 px-4 flex flex-col gap-8">
          {/* Title */}
          <div className="flex flex-col gap-1">
            <h1 className="text-lg font-semibold leading-7 text-foreground">Settings</h1>
            <p className="text-sm leading-5 text-muted-foreground">
              Personalize how Nova looks for your entire team
            </p>
          </div>

          {/* General section */}
          <section className="flex flex-col gap-5">
            <h2 className="text-base font-semibold leading-6 text-foreground">General</h2>

            {/* Workspace name */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium leading-5 text-foreground">
                Workspace name
              </label>
              <Input
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="Your workspace"
              />
            </div>

            {/* Workspace logo */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium leading-5 text-foreground">
                Workspace logo
              </label>
              <div className="flex items-center gap-4">
                <Avatar
                  size="xl"
                  shape="square"
                  src={displayedLogo ?? undefined}
                  fallback={workspaceName ? workspaceName.charAt(0).toUpperCase() : "W"}
                />
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      <CloudUpload className="size-4" />
                      Upload logo
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={!hasLogo}
                      onClick={handleRemoveLogo}
                    >
                      Remove
                    </Button>
                  </div>
                  <p className="text-xs leading-4 text-muted-foreground">
                    PNG or JPG, up to 2 MB
                  </p>
                </div>
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={handleLogoSelect}
              />
            </div>
          </section>

          <Separator />

          {/* Personal details section */}
          <section className="flex flex-col gap-5">
            <h2 className="text-base font-semibold leading-6 text-foreground">Personal details</h2>

            {/* Your name */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium leading-5 text-foreground">
                Your name
              </label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Type your full name"
              />
            </div>

            {/* Your photo */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium leading-5 text-foreground">
                Your photo
              </label>
              <div className="flex items-center gap-4">
                <Avatar
                  size="xl"
                  shape="square"
                  src={displayedAvatar ?? undefined}
                  fallback={nameInitial}
                />
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      <CloudUpload className="size-4" />
                      Upload photo
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={!hasAvatar}
                      onClick={handleRemoveAvatar}
                    >
                      Remove
                    </Button>
                  </div>
                  <p className="text-xs leading-4 text-muted-foreground">
                    PNG or JPG, up to 2 MB
                  </p>
                </div>
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={handleAvatarSelect}
              />
            </div>
          </section>

          <Separator />

          {/* Departments section */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold leading-6 text-foreground">Departments</h2>
              <Button variant="outline" size="sm" onClick={handleAddDepartment}>
                <Plus className="size-4" />
                Add department
              </Button>
            </div>

            {departments.length > 0 && (
              <div className="flex flex-col gap-2">
                {departments.map((dept) => (
                  <div key={dept.id} className="flex items-center gap-2">
                    <Input
                      className="flex-1"
                      value={dept.name}
                      onChange={(e) => handleDepartmentNameChange(dept.id, e.target.value)}
                      placeholder="Department name"
                    />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDeleteDepartment(dept.id, dept.isNew)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>


          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button variant="secondary" onClick={handleCancel} disabled={!isDirty}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving} disabled={!isDirty} loadingText="Saving changes">
              Save changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
