import { Navigate } from 'react-router-dom'
import { authStore } from '../../lib/authStore'

/**
 * Public route wrapper that redirects to / when user is already authenticated.
 * Prevents authenticated users from accessing the login page.
 */
export function PublicRoute({ children }: { children: React.ReactNode }) {
  if (authStore.isAuthenticated()) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}
