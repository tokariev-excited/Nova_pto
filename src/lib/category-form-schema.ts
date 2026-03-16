import { z } from "zod"

export const categoryFormSchema = z
  .object({
    name: z.string().min(1, "Category name is required"),
    colour: z.enum(["red", "orange", "green", "blue", "gray"]),
    leave_type: z.enum(["paid", "unpaid"]),
    accrual_method: z.enum(["fixed", "periodic", "anniversary", "unlimited"]),
    amount_value: z.number().positive().nullable(),
    granting_frequency: z.enum(["yearly", "hire_anniversary", "monthly", "weekly", "bi_weekly", "quarterly"]).nullable(),
    accrual_day: z.string().nullable(),
    anniversary_years: z.number().positive().nullable(),
    new_hire_rule: z.enum(["immediate", "waiting_period"]),
    waiting_period_value: z.number().positive().nullable(),
    waiting_period_unit: z.enum(["month", "year"]).nullable(),
    carryover_limit_enabled: z.boolean(),
    carryover_max_days: z.number().positive().nullable(),
    carryover_expiration_value: z.number().positive().nullable(),
    carryover_expiration_unit: z.enum(["month", "year"]).nullable(),
  })
  .superRefine((data, ctx) => {
    // Amount required for non-unlimited methods
    if (data.accrual_method !== "unlimited" && data.amount_value == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["amount_value"],
        message: "Amount is required",
      })
    }

    // Fixed: granting_frequency required
    if (data.accrual_method === "fixed" && !data.granting_frequency) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["granting_frequency"],
        message: "Granting frequency is required",
      })
    }

    // Periodic: granting_frequency required
    if (data.accrual_method === "periodic" && !data.granting_frequency) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["granting_frequency"],
        message: "Frequency is required",
      })
    }

    // Periodic: accrual_day required
    if (data.accrual_method === "periodic" && !data.accrual_day) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["accrual_day"],
        message: "Accrual day is required",
      })
    }

    // Anniversary: integer validation for both fields
    if (data.accrual_method === "anniversary") {
      if (data.anniversary_years == null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["anniversary_years"], message: "Years value is required" })
      } else if (!Number.isInteger(data.anniversary_years)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["anniversary_years"], message: "Years must be a whole number" })
      }
      if (data.amount_value != null && !Number.isInteger(data.amount_value)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["amount_value"], message: "Days must be a whole number" })
      }
    }

    // Waiting period fields required when selected
    if (data.new_hire_rule === "waiting_period") {
      if (data.waiting_period_value == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["waiting_period_value"],
          message: "Waiting period is required",
        })
      }
      if (!data.waiting_period_unit) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["waiting_period_unit"],
          message: "Unit is required",
        })
      }
    }

    // Carryover fields required when enabled
    if (data.carryover_limit_enabled && data.accrual_method !== "unlimited" && data.accrual_method !== "anniversary" && data.carryover_max_days == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["carryover_max_days"],
        message: "Max carryover days is required",
      })
    }
  })

export type CategoryFormValues = z.infer<typeof categoryFormSchema>

export const categoryFormDefaults: CategoryFormValues = {
  name: "",
  colour: "red",
  leave_type: "paid",
  accrual_method: "fixed",
  amount_value: null,
  granting_frequency: "yearly",
  accrual_day: null,
  anniversary_years: null,
  new_hire_rule: "immediate",
  waiting_period_value: null,
  waiting_period_unit: "year",
  carryover_limit_enabled: false,
  carryover_max_days: null,
  carryover_expiration_value: null,
  carryover_expiration_unit: "year",
}
