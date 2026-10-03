export function Loading({ label = 'Loading' }) {
  return <div className="status-message" role="status"><span className="loading-indicator" />{label}</div>
}