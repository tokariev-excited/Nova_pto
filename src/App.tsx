import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { LoginPage } from "@/pages/login"
import { CheckEmailPage } from "@/pages/otp-verification"
import { RequestsPage } from "@/pages/requests"

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/check-email" element={<CheckEmailPage />} />
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
            <Route path="employees" element={<div className="p-8">Employees</div>} />
            <Route path="calendar" element={<div className="p-8">Calendar</div>} />
            <Route path="time-off-setup" element={<div className="p-8">Time-off setup</div>} />
            <Route path="settings" element={<div className="p-8">Settings</div>} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
