# Add New Employee Flow

## Implementation checklist

- [x] **Step 1:** Create `src/components/ui/popover.tsx` — Radix Popover wrapper (Root, Trigger, Anchor, Content)
- [x] **Step 2:** Create `src/data/cities.json` — ~500 world cities dataset
- [x] **Step 3:** Create `src/components/ui/date-picker.tsx` — Calendar popover with month navigation
- [x] **Step 4:** Create `src/components/ui/location-combobox.tsx` — Autocomplete input with city search
- [x] **Step 5:** Create `supabase/functions/invite-employee/index.ts` — Edge Function for admin invite
- [x] **Step 6:** Extend `src/lib/employee-service.ts` — Added `inviteEmployee()` function
- [x] **Step 7:** Create `src/pages/add-employee.tsx` — Full form page with all fields
- [x] **Step 8:** Update `src/App.tsx` — Added `/dashboard/employees/new` route
- [x] **Step 9:** Update `src/pages/employees.tsx` — Wired navigation, real Supabase data, table rows
- [x] **Step 10:** Migration + `owner_id` — Added to workspaces, updated founder-flow & auth-context

## Verification

- [x] `npm run build` — passes (zero new errors)
- [x] `npm run lint` — passes (only pre-existing vite.config.js error)
