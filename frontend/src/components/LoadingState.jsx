export function LoadingState({ message = 'Loading…' }) {
  return (
    <div className="loading-panel">
      <span>{message}</span>
    </div>
  )
}
