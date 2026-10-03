export function AuthField({ id, label, error, hint, className = '', ...inputProps }) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined

  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        className={`auth-input ${error ? 'auth-input-invalid' : ''} ${className}`.trim()}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        {...inputProps}
      />
      {hint && <span className="auth-hint" id={`${id}-hint`}>{hint}</span>}
      {error && <span className="auth-field-error" id={`${id}-error`}>{error}</span>}
    </div>
  )
}