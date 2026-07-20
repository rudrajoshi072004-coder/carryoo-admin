import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Skeleton } from './ui'

export default function ProtectedRoute() {
  const { isAuthenticated, isAdmin, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="auth-loading">
        <Skeleton variant="card" style={{ width: 280, height: 48 }} />
      </div>
    )
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
