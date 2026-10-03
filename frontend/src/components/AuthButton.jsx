import { LoaderCircle } from 'lucide-react'

export function AuthButton({ children, isLoading = false, disabled = false, ...buttonProps }) {
  return (
    <button className="button button-primary auth-submit" {...buttonProps} disabled={isLoading || disabled}>
      {isLoading && <LoaderCircle size={16} className="auth-spinner" aria-hidden="true" />}
      {children}
    </button>
  )
}