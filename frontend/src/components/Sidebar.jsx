import { BarChart3, ClipboardCheck, FileText, LayoutDashboard, LogOut, Settings2, UserRound } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'

const navigation = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, end: true },
  { label: 'New evaluation', to: '/evaluations/new', icon: ClipboardCheck },
  { label: 'Evaluation history', to: '/evaluations', icon: FileText },
  { label: 'Reports', to: '/reports', icon: BarChart3 },
  { label: 'Settings', to: '/settings', icon: Settings2 },
]

export function Sidebar({ user, onLogout, onNavigate }) {
  const initials = user?.full_name?.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'EV'

  return (
    <div className="sidebar-content">
      <div className="brand-lockup">
        <div className="brand-mark" aria-hidden="true"><span /><span /><span /></div>
        <span className="brand-name">response<span>quality</span></span>
      </div>
      <div className="workspace-label">WORKSPACE</div>
      <nav aria-label="Main navigation" className="primary-navigation">
        {navigation.map(({ label, to, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={onNavigate} className={({ isActive }) => `nav-link${isActive ? ' nav-link-active' : ''}`}>
            <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
            <span>{label}</span>
            {label === 'New evaluation' && <span className="nav-shortcut">N</span>}
          </NavLink>
        ))}
        <NavLink to="/profile" onClick={onNavigate} className={({ isActive }) => `nav-link${isActive ? ' nav-link-active' : ''}`}>
          <UserRound size={18} strokeWidth={1.8} aria-hidden="true" />
          <span>Profile</span>
        </NavLink>
      </nav>
      <div className="sidebar-bottom">
        <div className="human-note"><span className="human-note-dot" />Human-led evaluation</div>
        <Link className="profile-row profile-row-link" to="/profile" onClick={onNavigate}>
          <div className="avatar" aria-hidden="true">{initials}</div>
          <div className="profile-copy"><strong>{user?.full_name}</strong><span>{user?.email}</span></div>
        </Link>
        <button className="logout-button" type="button" onClick={onLogout}><LogOut size={16} />Sign out</button>
      </div>
    </div>
  )
}