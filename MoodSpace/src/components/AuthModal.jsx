import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, X } from 'lucide-react'
import { useAuth } from '../context/authState'

function AuthModal() {
  const navigate = useNavigate()
  const {
    authModal,
    closeAuthModal,
    login,
    openLogin,
    openRegister,
    register,
  } = useAuth()
  const [values, setValues] = useState({
    email: '',
    username: '',
    displayName: '',
    identifier: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const mode = authModal === 'register' ? 'register' : authModal === 'login' ? 'login' : null

  const copy = useMemo(() => (
    mode === 'register'
      ? {
          title: 'Create account',
          action: 'Create account',
          switchText: 'Already have an account?',
          switchAction: 'Log in',
        }
      : {
          title: 'Log in',
          action: 'Log in',
          switchText: 'New to Moodspace?',
          switchAction: 'Create account',
        }
  ), [mode])

  if (!mode) return null

  const updateValue = (key) => (event) => {
    setValues((current) => ({ ...current, [key]: event.target.value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      if (mode === 'register') {
        await register({
          email: values.email,
          username: values.username,
          displayName: values.displayName || values.username,
          password: values.password,
        })
      } else {
        const user = await login({
          identifier: values.identifier,
          password: values.password,
        })
        if (user?.role === 'admin') navigate('/admin')
      }
    } catch (err) {
      setError(err.message || 'Authentication failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-modal-backdrop" role="presentation" onMouseDown={closeAuthModal}>
      <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="auth-modal-close" aria-label="Close" onClick={closeAuthModal}>
          <X size={18} />
        </button>

        <h2 id="auth-title">{copy.title}</h2>

        <form className="auth-form" onSubmit={submit}>
          {mode === 'register' ? (
            <>
              <label>
                <span>Email</span>
                <input type="email" value={values.email} onChange={updateValue('email')} autoComplete="email" required />
              </label>
              <label>
                <span>Username</span>
                <input type="text" value={values.username} onChange={updateValue('username')} autoComplete="username" required minLength={3} />
              </label>
              <label>
                <span>Display name</span>
                <input type="text" value={values.displayName} onChange={updateValue('displayName')} autoComplete="name" />
              </label>
            </>
          ) : (
            <label>
              <span>Email or username</span>
              <input type="text" value={values.identifier} onChange={updateValue('identifier')} autoComplete="username" required />
            </label>
          )}

          <label>
            <span>Password</span>
            <div className="auth-password-wrapper">
              <input type={showPassword ? 'text' : 'password'} value={values.password} onChange={updateValue('password')} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} required minLength={8} />
              <button type="button" className="auth-password-toggle" onClick={() => setShowPassword((prev) => !prev)} tabIndex={-1}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Please wait...' : copy.action}
          </button>
        </form>

        <p className="auth-switch">
          {copy.switchText}{' '}
          <button type="button" onClick={mode === 'register' ? openLogin : openRegister}>
            {copy.switchAction}
          </button>
        </p>
      </section>
    </div>
  )
}

export default AuthModal
