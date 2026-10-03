import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthButton } from '../components/AuthButton.jsx'
import { AuthField } from '../components/AuthField.jsx'
import { AuthLayout } from '../components/AuthLayout.jsx'
import { ErrorMessage } from '../components/ErrorMessage.jsx'
import { PasswordField } from '../components/PasswordField.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getApiErrorMessage } from '../utils/apiError.js'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState({ full_name: '', email: '', password: '', confirm_password: '' })
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }))
    setFieldError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (values.password.length < 12) {
      setFieldError('Use at least 12 characters for your password.')
      return
    }
    if (new TextEncoder().encode(values.password).length > 72) {
      setFieldError('Password must be at most 72 UTF-8 bytes.')
      return
    }
    if (values.password !== values.confirm_password) {
      setFieldError('Passwords do not match.')
      return
    }

    setIsLoading(true)
    try {
      await register(values)
      navigate('/login', { replace: true, state: { notice: 'Account created. Sign in to continue.', email: values.email } })
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to create your account. Check your details and try again.'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="GET STARTED"
      title="Create your account"
      description="Set up a secure evaluator workspace account."
      footer={<>Already have an account? <Link to="/login">Sign in</Link></>}
    >
      {error && <ErrorMessage title="Account creation failed" message={error} />}
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <AuthField id="register-name" label="Full name" type="text" autoComplete="name" minLength={2} maxLength={100} required value={values.full_name} onChange={(event) => update('full_name', event.target.value)} />
        <AuthField id="register-email" label="Email address" type="email" autoComplete="email" inputMode="email" required value={values.email} onChange={(event) => update('email', event.target.value)} />
        <PasswordField id="register-password" label="Password" autoComplete="new-password" hint="At least 12 characters; maximum 72 UTF-8 bytes." required value={values.password} onChange={(event) => update('password', event.target.value)} />
        <PasswordField id="register-confirm" label="Confirm password" autoComplete="new-password" required value={values.confirm_password} onChange={(event) => update('confirm_password', event.target.value)} />
        {fieldError && <div className="auth-field-error auth-form-error" role="alert">{fieldError}</div>}
        <AuthButton type="submit" isLoading={isLoading} disabled={isLoading || !values.full_name.trim() || !values.email.trim() || !values.password || !values.confirm_password}>{isLoading ? 'Creating account' : 'Create account'}</AuthButton>
      </form>
    </AuthLayout>
  )
}