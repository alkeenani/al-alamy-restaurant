import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AdminDashboard from '../components/admin/AdminDashboard.jsx'

function Admin() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/admin/login', { replace: true })
  }

  return <AdminDashboard user={user} onLogout={handleLogout} />
}

export default Admin
