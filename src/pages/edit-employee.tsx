import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Users, ChevronRight } from "lucide-react"

import { Separator } from "@/components/ui/separator"
import { BreadcrumbItem } from "@/components/ui/breadcrumb-item"
import { EmployeeForm, type EmployeeFormData } from "@/components/employee-form"
import { uploadImage } from "@/lib/settings-service"
import { fetchEmployee, updateEmployee } from "@/lib/employee-service"
import { addToast } from "@/lib/toast"
import type { Profile } from "@/contexts/auth-context"

export function EditEmployeePage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [employee, setEmployee] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetchEmployee(id)
      .then((data) => setEmployee(data as Profile))
      .catch((err) => {
        console.error("Failed to fetch employee:", err)
        navigate("/dashboard/employees")
      })
      .finally(() => setLoading(false))
  }, [id])

  async function handleSubmit(data: EmployeeFormData) {
    if (!id) return

    let avatarUrl: string | null | undefined = undefined

    if (data.avatarFile) {
      avatarUrl = await uploadImage("avatars", "employees", data.avatarFile)
    } else if (data.avatarRemoved) {
      avatarUrl = null
    }

    await updateEmployee(id, {
      first_name: data.firstName || undefined,
      last_name: data.lastName || undefined,
      role: data.role,
      department_id: data.departmentId || null,
      location: data.location || undefined,
      hire_date: data.startDate
        ? data.startDate.toISOString().split("T")[0]
        : undefined,
      ...(avatarUrl !== undefined && { avatar_url: avatarUrl }),
    })

    addToast({
      title: "Changes saved successfully",
      description: "Employee details have been updated.",
    })
    navigate("/dashboard/employees")
  }

  if (loading) {
    return (
      <div className="flex flex-col size-full">
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
            text="Edit employee details"
            className="text-foreground font-medium"
          />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!employee) return null

  const initialData = {
    email: employee.email,
    firstName: employee.first_name ?? "",
    lastName: employee.last_name ?? "",
    departmentId: employee.department_id ?? "",
    role: employee.role,
    location: employee.location ?? "",
    startDate: employee.hire_date
      ? new Date(employee.hire_date + "T00:00:00")
      : undefined,
    avatarUrl: employee.avatar_url,
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
          text="Edit employee details"
          className="text-foreground font-medium"
        />
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <EmployeeForm
          mode="edit"
          initialData={initialData}
          title="Edit employee details"
          subtitle="Update the personal information and role of your employee"
          submitLabel="Save changes"
          onSubmit={handleSubmit}
          onCancel={() => navigate("/dashboard/employees")}
        />
      </div>
    </div>
  )
}
