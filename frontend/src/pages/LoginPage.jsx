import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthButton } from '../components/AuthButton.jsx'
import { AuthField } from '../components/AuthField.jsx'
import { AuthLayout } from '../components/AuthLayout.jsx'
import { ErrorMessage } from '../components/ErrorMessage.jsx'
import { PasswordField } from '../components/PasswordField.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getApiErrorMessage } from '../utils/apiError.js'

export function LoginPage() {
  const { login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const notice = location.state?.notice

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await login({ email, password })
      const destination = location.state?.from?.pathname || '/'
      navigate(destination, { replace: true })
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to sign in. Check your details and try again.'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="WELCOME BACK"
      title="Sign in to your workspace"
      description="Continue your response evaluation work."
      footer={<>New to Response Quality? <Link to="/register">Create an account</Link></>}
    >
      {notice && <div className="auth-notice" role="status">{notice}</div>}
      {error && <ErrorMessage title="Sign-in failed" message={error} />}
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <AuthField id="login-email" label="Email address" type="email" autoComplete="email" inputMode="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        <PasswordField id="login-password" label="Password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
        <AuthButton type="submit" isLoading={isLoading} disabled={!email.trim() || !password}>{isLoading ? 'Signing in' : 'Sign in'}</AuthButton>
      </form>
    </AuthLayout>
  )
}