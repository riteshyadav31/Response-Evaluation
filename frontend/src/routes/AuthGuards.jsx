import { Navigate, useLocation } from 'react-router-dom'
import { Loading } from '../components/Loading.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export function RequireAuth({ children }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <div className="auth-loading"><Loading label="Checking your session" /></div>
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return children
}

export function GuestOnly({ children }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <div className="auth-loading"><Loading label="Checking your session" /></div>
  if (user) return <Navigate to="/" replace />
  return children
}