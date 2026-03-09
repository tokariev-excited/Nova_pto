# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite HMR)
npm run build     # Production build
npm run lint      # ESLint
npm run preview   # Preview production build
```

No test runner is configured yet.

## Environment

Requires a `.env` file with:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Architecture

**Stack:** React 19 + TypeScript + Vite + Tailwind CSS v4 + Supabase

**App:** Nova PTO — a leave management SaaS. Auth uses Supabase magic link (OTP via email, no passwords).

### Key flows

- `src/App.tsx` — router root. All routes wrapped in `AuthProvider`. `/dashboard` is behind `ProtectedRoute`. Dashboard uses nested routes via `<Outlet />` in `DashboardLayout`.
- **Auth sequence**: `/login` (enter email) → Supabase sends OTP → `/check-email` (enter 6-digit code) → verify → redirect to `/dashboard`.
- `src/contexts/auth-context.tsx` — central auth state. Exposes `user`, `session`, `workspace`, `profile`, `loading`, `signOut`, `refreshWorkspace`, `refreshProfile`. On first sign-in (`SIGNED_IN` event), runs `runFounderFlow` to auto-provision a workspace and profile for new users.
- `src/contexts/navigation-guard-context.tsx` — provides `registerGuard`/`unregisterGuard` for pages with unsaved changes (e.g. Settings) to block navigation until confirmed.
- `src/lib/founder-flow.ts` — first-time user setup: creates a `workspaces` row and a `profiles` row (role: `admin`) in Supabase. Idempotent — skips if profile already exists.
- `src/lib/supabase.ts` — single shared Supabase client.

### Supabase schema (inferred)

- `workspaces` — `id`, `name`, `logo_url?`, `created_at`
- `profiles` — `id` (= auth user id), `workspace_id`, `role`, `email`, `full_name?`, `avatar_url?`, `status` (`EmployeeStatus`), `department_id?`, `location?`, `hire_date?`, `created_at`
- `departments` — `id`, `workspace_id`, `name`, `created_at`
- `time_off_requests` (inferred from types) — `id`, `profile_id`, `workspace_id`, `employee_name`, `employee_email`, `employee_avatar_url?`, `start_date`, `end_date`, `request_type`, `status`, `comment?`, `created_at`, `updated_at`

### Dashboard routes

Defined in `src/App.tsx`. `/dashboard` redirects to `/dashboard/requests`. Currently implemented pages:
- `requests` — `RequestsPage` (full UI, Supabase fetch pending)
- `employees` — `EmployeesPage` (full UI with tabs/search/table shell, live Supabase data)
- `employees/add` — `AddEmployeePage` (form: avatar upload, name, email, role, department, hire date, location; calls `inviteEmployee` from employee-service)
- `settings` — `SettingsPage` (fully wired: workspace name/logo, profile name/avatar, departments CRUD, dirty-state guard, Supabase reads/writes)
- `calendar`, `time-off-setup` — stub `<div>` placeholders

### Types

- `src/types/time-off-request.ts` — `TimeOffRequest`, `TimeOffStatus` (`"pending" | "approved" | "rejected"`), `TimeOffType` (`"vacation" | "sick_leave" | "personal" | "bereavement" | "other"`)
- `src/types/employee.ts` — `EmployeeStatus` (`"active" | "inactive" | "deleted"`)
- `src/types/department.ts` — `Department` interface

### Services

- `src/lib/settings-service.ts` — Supabase calls for Settings page: `fetchDepartments`, `createDepartment`, `updateDepartment`, `deleteDepartment`, `updateWorkspace`, `updateProfile`, `uploadImage`, `removeImage`
- `src/lib/employee-service.ts` — Supabase calls for Employees page: `fetchEmployees`, `inviteEmployee` (calls the `invite-employee` Edge Function)

### Supabase Edge Functions

- `supabase/functions/invite-employee/` — Deno function that verifies caller JWT, creates a Supabase auth user via admin API, and inserts a `profiles` row. Deploy with `supabase functions deploy invite-employee`.

### Layout structure

`DashboardLayout`: outer `div` with `bg-sidebar-accent p-2 flex h-screen overflow-hidden`, containing a fixed-width `Sidebar` (260px) and a `main` that is `flex-1 overflow-y-auto rounded-xl bg-background`. The sidebar background is visually inset into the app chrome.

### Styling

Tailwind v4 with a custom design system sourced from Figma. Design tokens are defined as CSS variables in `src/index.css` and mapped via `@theme inline`. The font is **Instrument Sans** (Google Fonts). Use `cn()` from `src/lib/utils.ts` (`clsx` + `tailwind-merge`) for conditional class names.

Custom tokens beyond shadcn defaults:
- `shadow-focus`, `shadow-destructive-focus`, `shadow-switch-focus` — used for focus rings on interactive elements
- `color-success-*`, `color-warning-*`, `color-error-*` — semantic status colors
- `shadow-2xs`, `shadow-xs`, `shadow-sm`, `shadow-md`, `shadow-lg` — Figma-matched shadows

### Component conventions

- UI primitives live in `src/components/ui/`. These are custom components (not auto-generated shadcn CLI output) built to match Figma specs exactly.
- Radix primitives come from the unified `radix-ui` package (e.g. `import { Tabs, Slot } from "radix-ui"`), **not** individual `@radix-ui/*` packages.
- Component variants are built with `cva` from `class-variance-authority`.
- All UI primitives use a `data-slot="<name>"` attribute for identification (e.g. `data-slot="button"`, `data-slot="tabs-trigger"`).
- Higher-level composite components (e.g. `TabGroup`) wrap the lower-level primitives and accept a declarative `items` prop instead of requiring manual composition.
- `Button` supports a `loading` prop that shows a spinner and disables interaction.
- Page components export named functions (e.g. `export function LoginPage()`), not default exports.
- Path alias `@/` maps to `src/`.

## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately — don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items (create the `tasks/` directory if it doesn't exist)
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.
