# Slack Integration — Calamari-Grade UX Overhaul

## Already Implemented (v2)
- [x] Home Tab with all 6 sections (greeting, balances, out today, pending w/ withdraw, decisions, admin panel)
- [x] buildApprovalMessage with balance context + overlap info
- [x] buildApprovedMessage / buildRejectedMessage for in-place updates
- [x] handleWithdrawRequest (home + DM)
- [x] refreshHomeTab utility
- [x] Auto-refresh after Slack-originated approve/reject/withdraw/submit
- [x] Inline admin approvals from Home Tab
- [x] Employee submission DM with Withdraw button (Slack-originated)
- [x] Employee approval/rejection DMs with balance info (Slack-originated)

## Overhaul Work (completed)
- [x] **BUG FIX**: `formatDate(req.createdAt)` — extract date from timestamp with `.substring(0, 10)`
- [x] **BUG FIX**: `handleApproveRequest` chat.update guard for Home Tab approvals (skip when no messageTs/channelId)
- [x] **FEATURE**: Internal refresh endpoint in slack-events (`internal_refresh_home_tab`, auth via service role key)
- [x] **FEATURE**: slack-notify sends employee DM with Withdraw on web submission (skip_employee_dm flag)
- [x] **FEATURE**: slack-notify triggers Home Tab refresh after all notification actions (submitted/approved/rejected)
- [x] **FEATURE**: Wire `submitTimeOffRequest` to call slack-notify (web → Slack admin notifications)
- [x] **FEATURE**: Pass skip_employee_dm flag from slack-events to avoid duplicate DMs
- [x] Build passes

## Multi-Admin DM Update Fix
- [x] New migration `slack_dm_messages` table — stores per-admin DM refs (channel_id + message_ts)
- [x] slack-notify: store all admin DM refs on send (upsert into slack_dm_messages)
- [x] slack-notify: update all admin DMs on web dashboard approve/reject
- [x] slack-events: add `updateAllAdminDMs` helper with exclude support
- [x] slack-events: wire into `handleApproveRequest` (updates other admins' DMs)
- [x] slack-events: wire into `handleRejectSubmission` (updates other admins' DMs)
- [x] slack-events: wire into `handleWithdrawRequest` (updates all admin DMs)

## Deployment
- [ ] Apply migration: `supabase db push`
- [ ] Deploy slack-events: `supabase functions deploy slack-events`
- [ ] Deploy slack-notify: `supabase functions deploy slack-notify`

---

# Danger Zone + Single Workspace Constraint

## Database
- [x] Migration: partial unique index `profiles_email_active_unique` (one active email globally)
- [x] Migration: RLS DELETE policy on workspaces (owner-only)

## Edge Functions
- [x] New `delete-workspace` Edge Function (owner auth, confirmation, deletes auth users + profiles + workspace)
- [x] Modified `invite-employee`: global email check (409 if active elsewhere)
- [x] Modified `invite-employee`: handle re-invite of existing auth users (reuse ID)

## Service Layer
- [x] `deleteWorkspace()` in settings-service.ts

## UI
- [x] Danger Zone section on Settings page (owner-only visibility)
- [x] AlertDialog confirmation modal (type workspace name to confirm)
- [x] Post-delete: clear cache, unregister guard, sign out, redirect to login

## Deployment
- [ ] Apply migration: `supabase db push`
- [ ] Deploy delete-workspace: `supabase functions deploy delete-workspace`
- [ ] Deploy invite-employee: `supabase functions deploy invite-employee`
