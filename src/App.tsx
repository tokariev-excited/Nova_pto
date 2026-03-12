import { lazy, Suspense } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { AuthProvider } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/layout/DashboardLayout"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 300_000,
      refetchOnWindowFocus: false,
    },
  },
})

const LoginPage = lazy(() => import("@/pages/login").then(m => ({ default: m.LoginPage })))
const CheckEmailPage = lazy(() => import("@/pages/otp-verification").then(m => ({ default: m.CheckEmailPage })))
const RequestsPage = lazy(() => import("@/pages/requests").then(m => ({ default: m.RequestsPage })))
const EmployeesPage = lazy(() => import("@/pages/employees").then(m => ({ default: m.EmployeesPage })))
const AccessRestrictedPage = lazy(() => import("@/pages/access-restricted").then(m => ({ default: m.AccessRestrictedPage })))
const SettingsPage = lazy(() => import("@/pages/settings").then(m => ({ default: m.SettingsPage })))
const AddEmployeePage = lazy(() => import("@/pages/add-employee").then(m => ({ default: m.AddEmployeePage })))
const EditEmployeePage = lazy(() => import("@/pages/edit-employee").then(m => ({ default: m.EditEmployeePage })))

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={null}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/check-email" element={<CheckEmailPage />} />
            <Route path="/access-restricted" element={<AccessRestrictedPage />} />
            <Route
              path="/dashboard"
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
              <Route path="time-off-setup" element={<div className="p-8">Time-off setup</div>} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
