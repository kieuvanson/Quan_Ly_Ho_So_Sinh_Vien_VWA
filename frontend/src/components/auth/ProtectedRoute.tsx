import { Navigate, Outlet } from 'react-router-dom'
import { authStore } from '../../lib/authStore'

/**
 * Protected route wrapper that redirects to /login when user is not authenticated.
 */
export function ProtectedRoute() {
  if (!authStore.isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}
