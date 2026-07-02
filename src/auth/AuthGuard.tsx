import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export function AuthGuard() {
  const isLoading = useAuthStore((s) => s.isLoading)
  const currentUser = useAuthStore((s) => s.currentUser)
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-chalk-muted">
        Loading…
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
