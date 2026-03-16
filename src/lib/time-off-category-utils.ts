import type { TimeOffCategory } from "@/types/time-off-category"

export function getAllowancePolicy(category: TimeOffCategory): {
  main: string
  subtitle?: string
} {
  switch (category.accrual_method) {
    case "unlimited":
      return { main: "Unlimited" }

    case "fixed": {
      const days = category.amount_value ?? 0
      if (category.waiting_period_value && category.waiting_period_unit) {
        const unit =
          category.waiting_period_value === 1
            ? category.waiting_period_unit
            : `${category.waiting_period_unit}s`
        return {
          main: `${days} days after ${category.waiting_period_value} ${unit}`,
          subtitle: "Fixed amount",
        }
      }
      return {
        main: `${days} days per year`,
        subtitle: "Fixed amount",
      }
    }

    case "anniversary": {
      const days = category.amount_value ?? 0
      const years = category.anniversary_years ?? 1
      return {
        main: `${days} ${days === 1 ? "day" : "days"} for every ${years} ${years === 1 ? "year" : "years"}`,
        subtitle: "On anniversary",
      }
    }

    case "periodic": {
      const days = category.amount_value ?? 0
      const freq = category.granting_frequency ?? "monthly"
      const freqLabels: Record<string, string> = {
        weekly: "week",
        bi_weekly: "two weeks",
        monthly: "month",
        quarterly: "quarter",
        yearly: "year",
      }
      const freqLabel = freqLabels[freq] ?? freq
      return {
        main: `${days} days per ${freqLabel}`,
        subtitle: "Periodic",
      }
    }

    default:
      return { main: "—" }
  }
}
