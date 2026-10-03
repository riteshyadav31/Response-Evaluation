import { CircleAlert } from 'lucide-react'

export function ErrorMessage({ title = 'Something went wrong', message = 'Please try again in a moment.' }) {
  return (
    <div className="feedback-panel error-panel" role="alert">
      <CircleAlert size={19} aria-hidden="true" />
      <div><strong>{title}</strong><p>{message}</p></div>
    </div>
  )
}