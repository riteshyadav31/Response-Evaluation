export function StatusBadge({ status }) {
  const badgeClass = status === 'completed' ? 'status-badge status-badge-completed' : 'status-badge status-badge-draft'
  return <span className={badgeClass}>{status === 'completed' ? 'Completed' : 'Draft'}</span>
}
