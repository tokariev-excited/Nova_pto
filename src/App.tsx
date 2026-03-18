import { lazy, Suspense, useEffect } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { AuthProvider } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { supabase } from "@/lib/supabase"
import { Toaster } from "@/components/ui/toaster"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(2000 * 2 ** attemptIndex, 15_000),
    },
  },
})

function AuthQueryBridge() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        queryClient.clear()
      }
    })
    return () => subscription.unsubscribe()
  }, [queryClient])

  return null
}

const AuthCallbackPage = lazy(() => import("@/pages/auth-callback").then(m => ({ default: m.AuthCallbackPage })))
const LoginPage = lazy(() => import("@/pages/login").then(m => ({ default: m.LoginPage })))
const CheckEmailPage = lazy(() => import("@/pages/otp-verification").then(m => ({ default: m.CheckEmailPage })))
const RequestsPage = lazy(() => import("@/pages/requests").then(m => ({ default: m.RequestsPage })))
const EmployeesPage = lazy(() => import("@/pages/employees").then(m => ({ default: m.EmployeesPage })))
const AccessRestrictedPage = lazy(() => import("@/pages/access-restricted").then(m => ({ default: m.AccessRestrictedPage })))
const SettingsPage = lazy(() => import("@/pages/settings").then(m => ({ default: m.SettingsPage })))
const AddEmployeePage = lazy(() => import("@/pages/add-employee").then(m => ({ default: m.AddEmployeePage })))
const EditEmployeePage = lazy(() => import("@/pages/edit-employee").then(m => ({ default: m.EditEmployeePage })))
const TimeOffSetupPage = lazy(() => import("@/pages/time-off-setup").then(m => ({ default: m.TimeOffSetupPage })))
const AddCategoryPage = lazy(() => import("@/pages/add-category").then(m => ({ default: m.AddCategoryPage })))
const EditCategoryPage = lazy(() => import("@/pages/edit-category").then(m => ({ default: m.EditCategoryPage })))

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthQueryBridge />
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={null}>
          <Routes>
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/check-email" element={<CheckEmailPage />} />
            <Route path="/access-restricted" element={<AccessRestrictedPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="requests" replace />} />
              <Route path="requests" element={<RequestsPage />} />
              <Route path="employees" element={<EmployeesPage />} />
              <Route path="employees/new" element={<AddEmployeePage />} />
              <Route path="employees/:id/edit" element={<EditEmployeePage />} />
              <Route path="calendar" element={<div className="p-8">Calendar</div>} />
              <Route path="time-off-setup" element={<TimeOffSetupPage />} />
              <Route path="time-off-setup/new" element={<AddCategoryPage />} />
              <Route path="time-off-setup/:id/edit" element={<EditCategoryPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/requests" replace />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster />
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
