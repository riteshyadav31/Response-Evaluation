import { Bell, Search } from 'lucide-react'

export function Header({ user, onMenuClick }) {
  const initials = user?.full_name?.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'EV'

  return (
    <header className="topbar">
      <button className="icon-button topbar-menu" aria-label="Open navigation" onClick={onMenuClick}>
        <span className="menu-glyph"><span /><span /></span>
      </button>
      <div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-separator">/</span><strong>Overview</strong></div>
      <div className="topbar-actions">
        <button className="icon-button search-button" aria-label="Search"><Search size={18} /></button>
        <button className="icon-button notification-button" aria-label="Notifications"><Bell size={18} /><span className="notification-dot" /></button>
        <div className="topbar-avatar" aria-label={`${user?.full_name || 'User'} profile`}>{initials}</div>
      </div>
    </header>
  )
}