# Code Review Fixes

## HIGH PRIORITY
- [x] 1. `new_hire_rule` — migration + type + service + page wiring
- [x] 2. Auth context — error handling for founder flow
- [x] 3. Auth context — useMemo/useCallback for value to prevent cascading re-renders
- [x] 4. Error boundary component at dashboard level
- [x] 5. `fetchEmployeeCounts` — parallelize with Promise.all

## MEDIUM PRIORITY
- [x] 7. CategoryForm — reduce watch() subscriptions (useWatch)
- [x] 8. SortableCategoryRow — wrap in React.memo
- [x] 9. select('*') → specific columns (fetchEmployeeCounts: select("id") instead of select("*"))
- [x] 10. Image validation — single utility (validateImageFile in utils.ts)
- [x] 11. updateCategorySortOrder — Promise.all for atomicity
- [x] 13. Employee mutations — targeted invalidation
- [x] 17. Constants file (src/lib/constants.ts)

## LOW PRIORITY
- [x] 15. useCallback for handlers in Sidebar, TimeOffSetup
- [x] 16. Per-route Suspense boundaries in DashboardLayout
- [x] 19. keepPreviousData on employee list queries

## SKIPPED (too risky / too marginal for this PR)
- 6. EmployeeForm → react-hook-form (large migration, separate PR)
- 12. Settings page reduce useState (partially helped by other fixes)
- 14. NavigationGuard scope (architectural decision, separate PR)
- 18. FormPageHeader extraction (marginal benefit for 4 pages)
- 20. Stub pages (informational only)

## Verification
- [x] `npm run build` — passes (zero errors)
- [x] `npm run lint` — passes clean
