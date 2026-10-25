import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ToastProvider } from './components/Toast'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import DashboardLayout from './layouts/DashboardLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Drivers from './pages/Drivers'
import Orders from './pages/Orders'
import Customers from './pages/Customers'
import Trips from './pages/Trips'
import LiveTracking from './pages/LiveTracking'
import ZonalMaps from './pages/ZonalMaps'
import Payments from './pages/Payments'
import Wallet from './pages/Wallet'
import Documents from './pages/Documents'
import Vehicles from './pages/Vehicles'
import Pricing from './pages/Pricing'
import DriverOffers from './pages/DriverOffers'
import Incentives from './pages/Incentives'
import Support from './pages/Support'
import Analytics from './pages/Analytics'
import Reports from './pages/Reports'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'
import AdminUsers from './pages/AdminUsers'
import SystemLogs from './pages/SystemLogs'

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="drivers" element={<Drivers />} />
                <Route path="customers" element={<Customers />} />
                <Route path="orders" element={<Orders />} />
                <Route path="trips" element={<Trips />} />
                <Route path="live-tracking" element={<LiveTracking />} />
                <Route path="zonal-maps" element={<ZonalMaps />} />
                <Route path="payments" element={<Payments />} />
                <Route path="wallet" element={<Wallet />} />
                <Route path="documents" element={<Documents />} />
                <Route path="vehicles" element={<Vehicles />} />
                <Route path="pricing" element={<Pricing />} />
                <Route path="driver-offers" element={<DriverOffers />} />
                <Route path="incentives" element={<Incentives />} />
                <Route path="support" element={<Support />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="reports" element={<Reports />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="settings" element={<Settings />} />
                <Route path="admin-users" element={<AdminUsers />} />
                <Route path="system-logs" element={<SystemLogs />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
