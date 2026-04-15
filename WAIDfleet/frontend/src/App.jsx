import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { ForgotPassword } from './pages/ForgotPassword'
import { Dashboard } from './pages/Dashboard'
import { Drivers } from './pages/Drivers'
import { Vehicles } from './pages/Vehicles'
import { Earnings } from './pages/Earnings'
import { Payments } from './pages/Payments'
import { Services } from './pages/Services'
import { Performance } from './pages/Performance'
import Billing from './pages/Billing'
import AdminDashboard from './pages/AdminDashboard'
import AdminUsers from './pages/AdminUsers'
import SupportTickets from './pages/SupportTickets'
import AuditLogs from './pages/AuditLogs'
import Reports from './pages/Reports'
import { LiveMap } from './pages/LiveMap'
import { Dispatch } from './pages/Dispatch'
import { Maintenance } from './pages/Maintenance'
import { ComplianceCenter } from './pages/ComplianceCenter'
import { Rostering } from './pages/Rostering'
import { Incidents } from './pages/Incidents'
import { Payroll } from './pages/Payroll'
import { CorporatePortal } from './pages/CorporatePortal'
import { CommandPalette } from './components/CommandPalette'
import { FleetPerformance } from './pages/FleetPerformance'
import { AdminPanel } from './pages/AdminPanel'
import { AdminRoute } from './components/AdminRoute'
import AdminInvoiceGenerator from './pages/AdminInvoiceGenerator'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <CommandPalette />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/drivers"
            element={
              <AdminRoute>
                <Drivers />
              </AdminRoute>
            }
          />
          <Route
            path="/vehicles"
            element={
              <AdminRoute>
                <Vehicles />
              </AdminRoute>
            }
          />
          <Route
            path="/services"
            element={
              <ProtectedRoute>
                <Services />
              </ProtectedRoute>
            }
          />
          <Route
            path="/performance"
            element={
              <ProtectedRoute>
                <Performance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/billing"
            element={
              <AdminRoute>
                <Billing />
              </AdminRoute>
            }
          />
          <Route
            path="/earnings"
            element={
              <ProtectedRoute>
                <Earnings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments"
            element={
              <AdminRoute>
                <Payments />
              </AdminRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          {/* ADMIN ROUTES */}
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/tickets"
            element={
              <AdminRoute>
                <SupportTickets />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <AdminRoute>
                <AuditLogs />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <AdminRoute>
                <Reports />
              </AdminRoute>
            }
          />
          <Route
            path="/telematics"
            element={
              <AdminRoute>
                <LiveMap />
              </AdminRoute>
            }
          />
          <Route
            path="/dispatch"
            element={
              <AdminRoute>
                <Dispatch />
              </AdminRoute>
            }
          />
          <Route
            path="/maintenance"
            element={
              <AdminRoute>
                <Maintenance />
              </AdminRoute>
            }
          />
          <Route
            path="/compliance"
            element={
              <AdminRoute>
                <ComplianceCenter />
              </AdminRoute>
            }
          />
          <Route
            path="/rostering"
            element={
              <AdminRoute>
                <Rostering />
              </AdminRoute>
            }
          />
          <Route
            path="/incidents"
            element={
              <ProtectedRoute>
                <Incidents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payroll"
            element={
              <AdminRoute>
                <Payroll />
              </AdminRoute>
            }
          />
          <Route
            path="/corporate/b2b-portal"
            element={
              <CorporatePortal /> // Not protected to simulate external access
            }
          />
          <Route
            path="/fleet-performance"
            element={
              <AdminRoute>
                <FleetPerformance />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/invoice-generator"
            element={
              <AdminRoute>
                <AdminInvoiceGenerator />
              </AdminRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
