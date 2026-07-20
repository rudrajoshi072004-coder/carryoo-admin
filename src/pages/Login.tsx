import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Lock, Phone, Truck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getApiErrorMessage } from '../api/client'
import { Button } from '../components/ui'
import './Login.css'

export default function Login() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(phone.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <span className="login-brand__icon">
            <Truck size={28} strokeWidth={1.75} />
          </span>
          <div>
            <h1>Carryoo Admin</h1>
            <p>Manage vehicles, pricing, orders, and operations</p>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error ? (
            <div className="login-error" role="alert">
              {error}
            </div>
          ) : null}

          <label className="login-field">
            <span>Phone number</span>
            <div className="login-field__wrap">
              <Phone size={16} strokeWidth={1.75} aria-hidden />
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="9175504996"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </label>

          <label className="login-field">
            <span>Password</span>
            <div className="login-field__wrap">
              <Lock size={16} strokeWidth={1.75} aria-hidden />
              <input
                type="password"
                autoComplete="current-password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </label>

          <Button type="submit" variant="primary" disabled={submitting} className="login-submit">
            {submitting ? 'Signing in…' : 'Sign in to admin'}
          </Button>
        </form>

        <p className="login-footnote">
          Use an admin account for full CRUD access. Read-only views work with any authenticated user.
        </p>
      </div>
    </div>
  )
}
