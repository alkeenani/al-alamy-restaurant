import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/**
 * Wraps any route that requires an authenticated admin.
 *
 * While the auth status is still being resolved from the stored session
 * we render nothing (or a spinner) to avoid a flash of the wrong page.
 */
function ProtectedRoute({ children }) {
  const { status, isAdmin } = useAuth()

  if (status === 'initializing') {
    return (
      <section className="page">
        <div className="container">
          <p style={{ color: 'var(--color-text-muted)' }}>جاري التحميل…</p>
        </div>
      </section>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}

export default ProtectedRoute
