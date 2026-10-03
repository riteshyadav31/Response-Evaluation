import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { Sidebar } from '../components/Sidebar.jsx'
import { Header } from '../components/Header.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await logout()
    } finally {
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="app-frame">
      {mobileOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar-shell ${mobileOpen ? 'sidebar-shell-open' : ''}`}>
        <div className="sidebar-mobile-top">
          <span className="brand-name">response<span>quality</span></span>
          <button className="icon-button" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X size={19} /></button>
        </div>
        <Sidebar user={user} onLogout={handleLogout} onNavigate={() => setMobileOpen(false)} />
      </aside>
      <div className="workspace">
        <Header user={user} onMenuClick={() => setMobileOpen(true)} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}