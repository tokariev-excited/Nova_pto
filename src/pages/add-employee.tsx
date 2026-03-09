import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Users, ChevronRight, CloudUpload, User } from "lucide-react"

import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field } from "@/components/ui/field"
import { Separator } from "@/components/ui/separator"
import { BreadcrumbItem } from "@/components/ui/breadcrumb-item"
import { Avatar } from "@/components/ui/avatar"
import { RadioGroup } from "@/components/ui/radio-group"
import { RadioGroupOption } from "@/components/ui/radio-group-option"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { LocationCombobox } from "@/components/ui/location-combobox"
import { fetchDepartments, uploadImage } from "@/lib/settings-service"
import { inviteEmployee } from "@/lib/employee-service"
import { useImageUpload } from "@/hooks/use-image-upload"
import { getInitials, getDisplayName } from "@/lib/utils"
import type { Department } from "@/types/department"

export function AddEmployeePage() {
  const navigate = useNavigate()
  const { workspace } = useAuth()

  // Form state
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [departmentId, setDepartmentId] = useState("")
  const [role, setRole] = useState("user")
  const [location, setLocation] = useState("")
  const [startDate, setStartDate] = useState<Date | undefined>()
  // File upload
  const {
    file: avatarFile,
    preview: avatarPreview,
    error: fileError,
    inputRef: fileInputRef,
    handleSelect: handleFileSelect,
    handleRemove: handleRemovePhoto,
  } = useImageUpload()

  // UI state
  const [departments, setDepartments] = useState<Department[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [emailError, setEmailError] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!workspace) return
    fetchDepartments(workspace.id).then(setDepartments).catch(console.error)
  }, [workspace])

  const displayName = getDisplayName(firstName, lastName)

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  const isValid =
    isValidEmail &&
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    departmentId.length > 0 &&
    role.length > 0 &&
    location.trim().length > 0 &&
    startDate !== undefined

  function handleEmailBlur() {
    const trimmed = email.trim()
    if (trimmed.length === 0) {
      setEmailError(false)
      return
    }
    setEmailError(!isValidEmail)
  }

  const initials = getInitials(firstName, lastName)

  const avatarFallback = useMemo(() => {
    if (initials) return initials
    return <User className="size-6 text-muted-foreground" />
  }, [initials])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid || submitting) return

    setSubmitting(true)
    setError(null)

    try {
      let avatarUrl: string | null = null

      if (avatarFile) {
        avatarUrl = await uploadImage("avatars", "employees", avatarFile)
      }

      await inviteEmployee({
        email: email.trim(),
        first_name: firstName.trim() || undefined,
        last_name: lastName.trim() || undefined,
        role,
        department_id: departmentId || null,
        location: location || undefined,
        hire_date: startDate
          ? startDate.toISOString().split("T")[0]
          : undefined,
        avatar_url: avatarUrl,
      })

      navigate("/dashboard/employees")
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col size-full">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 h-[60px] shrink-0">
        <button
          className="flex items-center justify-center size-7 rounded-[10px] shrink-0 text-foreground hover:bg-accent transition-colors"
          onClick={() => navigate("/dashboard/employees")}
        >
          <Users className="size-4" />
        </button>
        <div className="flex items-center h-6 pr-2 relative shrink-0">
          <Separator orientation="vertical" />
        </div>
        <BreadcrumbItem
          text="Employees"
          onClick={() => navigate("/dashboard/employees")}
        />
        <ChevronRight className="size-4 text-muted-foreground shrink-0" />
        <BreadcrumbItem
          text="Add new employee"
          className="text-foreground font-medium"
        />
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-6 items-center pt-6 pb-8 px-4"
        >
          {/* Title section */}
          <div className="w-[600px] flex flex-col gap-1.5">
            <h2 className="text-xl font-semibold leading-8 tracking-[-0.4px]">
              Add new employee
            </h2>
            <p className="text-sm font-normal leading-5 tracking-[-0.28px] text-muted-foreground">
              Define the rules and accrual limits for this leave type
            </p>
          </div>

          {/* Form fields */}
          <div className="w-[600px] flex flex-col gap-4">
            {/* Work email */}
            <Field label="Work email" invalid={emailError}>
              <Input
                type="email"
                placeholder="example@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={handleEmailBlur}
                aria-invalid={emailError}
              />
              {emailError && (
                <p className="text-sm text-destructive">
                  Please enter a valid email (e.g., name@company.com)
                </p>
              )}
            </Field>

            {/* First name / Last name */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="First name">
                <Input
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </Field>
              <Field label="Last name">
                <Input
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </Field>
            </div>

            {/* Department */}
            <Field label="Department">
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* Photo */}
            <Field label="Photo">
              <div className="flex items-center gap-4">
                <Avatar
                  src={avatarPreview ?? undefined}
                  alt={displayName}
                  fallback={avatarFallback}
                  size="xl"
                  shape="square"
                />
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <CloudUpload className="size-4" />
                      {avatarPreview ? "Replace photo" : "Upload photo"}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={!avatarPreview}
                      onClick={handleRemovePhoto}
                    >
                      Remove
                    </Button>
                  </div>
                  {fileError ? (
                    <p className="text-xs text-destructive">{fileError}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      PNG or JPG, up to 2 MB
                    </p>
                  )}
                </div>
              </div>
            </Field>

            {/* Role */}
            <Field label="Role">
              <RadioGroup
                value={role}
                onValueChange={setRole}
                className="w-full grid grid-cols-2 gap-3"
              >
                <RadioGroupOption
                  value="user"
                  label="User"
                  description="Request and track personal time off"
                  variant="card"
                />
                <RadioGroupOption
                  value="admin"
                  label="Admin"
                  description="Manage team and workspace settings"
                  variant="card"
                />
              </RadioGroup>
            </Field>

            {/* Start date / Location */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start date">
                <DatePicker
                  value={startDate}
                  onChange={setStartDate}
                  placeholder="Pick a date"
                />
              </Field>
              <Field label="Location">
                <LocationCombobox
                  value={location}
                  onChange={setLocation}
                  placeholder="Type location"
                />
              </Field>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <p className="w-[600px] text-sm text-destructive">{error}</p>
          )}

          {/* Actions */}
          <div className="w-[600px] flex items-center justify-between pt-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/dashboard/employees")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValid || !!fileError}
              loading={submitting}
            >
              Add employee
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
