import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../services/authContext'
import api from '../services/api'

/**
 * Login page — split-screen design with branding on left, form on right.
 */
function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await api.post('/auth/login', formData)
      const { accessToken, refreshToken, user } = response.data.data
      login(user, accessToken, refreshToken)
      navigate(`/${user.role.toLowerCase()}/dashboard`, { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      {/* Left side - Branding */}
      <div className="auth-brand">
        <div>
          <h1 className="auth-brand-logo">CareConnect</h1>
          <p className="auth-brand-tagline">
            Online Healthcare Management System for better patient care
          </p>
          <ul className="auth-brand-features">
            <li>Book appointments with ease</li>
            <li>Access your medical records anytime</li>
            <li>Connect with qualified doctors</li>
            <li>Manage your health journey</li>
          </ul>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="auth-form-side">
        <div className="auth-card">
          <div className="card">
            <div className="card-header">
              <h1>Welcome back</h1>
              <p>Sign in to your account to continue</p>
            </div>

            <div className="card-body">
              {error && (
                <div className="alert alert-error mb-4" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-input"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    className="form-input"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    autoComplete="current-password"
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-full mt-6"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <div className="text-center text-sm text-slate-500 mt-6 space-y-2">
                <p>
                  Don't have an account?{' '}
                  <Link to="/register" className="text-teal-600 font-medium hover:text-teal-700">
                    Register as Patient
                  </Link>
                </p>
                <p>
                  Are you a doctor?{' '}
                  <Link to="/register-doctor" className="text-teal-600 font-medium hover:text-teal-700">
                    Register as Doctor
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login