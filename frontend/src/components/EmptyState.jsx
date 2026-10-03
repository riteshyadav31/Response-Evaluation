import { ClipboardList } from 'lucide-react'

export function EmptyState({ title, description, icon: Icon = ClipboardList, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon"><Icon size={21} strokeWidth={1.8} aria-hidden="true" /></div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  )
}