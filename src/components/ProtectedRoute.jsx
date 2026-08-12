import { Navigate, useLocation } from 'react-router-dom'
import Loader from './Loader'
import { useAuth } from '../lib/useAuth'

// Wraps protected routes; redirects to /auth if not logged in.
export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader label="Checking your session…" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />
  }

  return children
}
