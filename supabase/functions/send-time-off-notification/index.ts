import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface NotificationPayload {
  request_id: string
  action: "approved" | "rejected"
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(y, m - 1, d))
}

function formatDays(days: number): string {
  const formatted = Number.isInteger(days) ? String(days) : days.toFixed(1)
  return `${formatted} ${days === 1 ? "day" : "days"}`
}

function formatPeriodLabel(period: string): string {
  const map: Record<string, string> = {
    morning: "Morning",
    midday: "Midday",
    end_of_day: "End of day",
  }
  return map[period] ?? period
}

function buildEmail(params: {
  action: "approved" | "rejected"
  employeeName: string
  categoryLabel: string
  startDate: string
  endDate: string
  startPeriod: string
  endPeriod: string
  totalDays: string
  rejectionReason?: string
  workspaceName: string
}): { subject: string; html: string } {
  const isApproved = params.action === "approved"
  const accentColor = isApproved ? "#16a34a" : "#dc2626"
  const statusLabel = isApproved ? "Approved" : "Rejected"
  const subject = isApproved
    ? "Your time-off request has been approved"
    : "Your time-off request has been rejected"

  const rejectionBlock =
    !isApproved && params.rejectionReason
      ? `
        <tr>
          <td style="padding: 16px 24px 0;">
            <p style="margin: 0 0 6px; color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Rejection reason</p>
            <p style="margin: 0; color: #111827; font-size: 14px; line-height: 1.5; padding: 12px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px;">${params.rejectionReason}</p>
          </td>
        </tr>`
      : ""

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f3f4f6; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td style="background: ${accentColor}; padding: 24px;">
              <p style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.025em;">
                Time-Off Request ${statusLabel}
              </p>
              <p style="margin: 4px 0 0; color: #ffffff; opacity: 0.8; font-size: 13px;">
                ${params.workspaceName}
              </p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 28px 24px 0;">
              <p style="margin: 0; color: #111827; font-size: 15px; font-weight: 500;">Hi ${params.employeeName},</p>
              <p style="margin: 8px 0 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
                ${isApproved
                  ? "Great news — your time-off request has been <strong>approved</strong>. Here are the details:"
                  : "Your time-off request has been <strong>rejected</strong>. Here are the details:"}
              </p>
            </td>
          </tr>

          <!-- Details card -->
          <tr>
            <td style="padding: 16px 24px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 5px 0; color: #6b7280; font-size: 13px; font-weight: 500; width: 40%;">Request type</td>
                        <td style="padding: 5px 0; color: #111827; font-size: 13px; font-weight: 600;">${params.categoryLabel}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding: 0; border-bottom: 1px solid #e5e7eb;"></td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; color: #6b7280; font-size: 13px; font-weight: 500;">From</td>
                        <td style="padding: 5px 0; color: #111827; font-size: 13px;">${params.startDate} &middot; ${params.startPeriod}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; color: #6b7280; font-size: 13px; font-weight: 500;">To</td>
                        <td style="padding: 5px 0; color: #111827; font-size: 13px;">${params.endDate} &middot; ${params.endPeriod}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding: 0; border-bottom: 1px solid #e5e7eb;"></td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; color: #6b7280; font-size: 13px; font-weight: 500;">Total</td>
                        <td style="padding: 5px 0; color: #111827; font-size: 13px; font-weight: 600;">${params.totalDays}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${rejectionBlock}

          <!-- Footer -->
          <tr>
            <td style="padding: 24px; border-top: 1px solid #f3f4f6; margin-top: 20px;">
              <p style="margin: 16px 0 0; color: #9ca3af; font-size: 12px;">
                This is an automated notification from Nova PTO. Please do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return { subject, html }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!
    const resendApiKey = Deno.env.get("RESEND_API_KEY")

    // Verify caller JWT
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
    }

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user: caller },
      error: authError,
    } = await callerClient.auth.getUser()

    if (authError || !caller) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
    }

    // Verify caller is admin
    const { data: callerProfile, error: profileError } = await callerClient
      .from("profiles")
      .select("role, workspace_id")
      .eq("id", caller.id)
      .single()

    if (profileError || !callerProfile || callerProfile.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Only admins can send notifications" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
    }

    const { request_id, action }: NotificationPayload = await req.json()

    if (!request_id || !action) {
      return new Response(
        JSON.stringify({ error: "request_id and action are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch full request details
    const { data: request, error: requestError } = await adminClient
      .from("time_off_requests")
      .select(
        "employee_name, employee_email, start_date, end_date, start_period, end_period, total_days, request_type, category_id, rejection_reason, workspace_id",
      )
      .eq("id", request_id)
      .single()

    if (requestError || !request) {
      return new Response(
        JSON.stringify({ error: "Request not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
    }

    // Guard: request must belong to the caller's workspace
    if (request.workspace_id !== callerProfile.workspace_id) {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
    }

    // Fetch workspace name for email branding
    const { data: workspace } = await adminClient
      .from("workspaces")
      .select("name")
      .eq("id", request.workspace_id)
      .single()

    // Resolve category label
    let categoryLabel = "Time Off"
    if (request.category_id) {
      const { data: category } = await adminClient
        .from("time_off_categories")
        .select("name, emoji")
        .eq("id", request.category_id)
        .single()
      if (category) {
        categoryLabel = category.emoji ? `${category.name} ${category.emoji}` : category.name
      }
    } else {
      const legacyLabels: Record<string, string> = {
        vacation: "Vacation",
        sick_leave: "Sick Leave",
        personal: "Personal",
        bereavement: "Bereavement",
        other: "Other",
      }
      categoryLabel = legacyLabels[request.request_type] ?? "Other"
    }

    const { subject, html } = buildEmail({
      action,
      employeeName: request.employee_name,
      categoryLabel,
      startDate: formatDate(request.start_date),
      endDate: formatDate(request.end_date),
      startPeriod: formatPeriodLabel(request.start_period),
      endPeriod: formatPeriodLabel(request.end_period),
      totalDays: formatDays(request.total_days),
      rejectionReason: request.rejection_reason ?? undefined,
      workspaceName: workspace?.name ?? "Nova PTO",
    })

    // Graceful no-op if API key not configured (useful in local dev)
    if (!resendApiKey) {
      console.log(
        `[send-time-off-notification] RESEND_API_KEY not set. Would send "${subject}" to ${request.employee_email}`,
      )
      return new Response(
        JSON.stringify({ sent: false, reason: "no_api_key" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Nova PTO <onboarding@resend.dev>",
        to: [request.employee_email],
        subject,
        html,
      }),
    })

    if (!emailResponse.ok) {
      const detail = await emailResponse.text()
      console.error(
        `[send-time-off-notification] Resend error ${emailResponse.status}: ${detail}`,
      )
      // Return 200 so the fire-and-forget caller is never broken by email failure
      return new Response(
        JSON.stringify({ sent: false, reason: "resend_error", detail }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
    }

    return new Response(
      JSON.stringify({ sent: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (err) {
    console.error("[send-time-off-notification] Unexpected error:", err)
    return new Response(
      JSON.stringify({ sent: false, reason: "unexpected_error" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }
})
