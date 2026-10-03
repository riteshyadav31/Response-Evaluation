export function StatCard({ label, value, subtitle, icon: Icon }) {
  return (
    <article className="metric-card">
      <div className="metric-icon metric-icon-mint">
        {Icon ? <Icon size={18} strokeWidth={1.8} aria-hidden="true" /> : null}
      </div>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-note">{subtitle}</div>
    </article>
  )
}
