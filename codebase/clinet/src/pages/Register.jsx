import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../services/authContext'
import api from '../services/api'

/**
 * Patient registration page — split-screen design.
 */
function Register() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', dateOfBirth: '', gender: '', phone: '', address: ''
  })
  const [errors, setErrors] = useState({})
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
    setErrors({})

    try {
      const response = await api.post('/auth/register', formData)
      const { accessToken, refreshToken, user } = response.data.data
      login(user, accessToken, refreshToken)
      navigate('/patient/dashboard', { replace: true })
    } catch (err) {
      if (err.response?.data?.data) {
        setErrors(err.response.data.data)
      }
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
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
            Create your patient account to start booking appointments
          </p>
          <ul className="auth-brand-features">
            <li>Quick &amp; easy registration</li>
            <li>Book appointments in seconds</li>
            <li>Track your medical history</li>
            <li>Secure &amp; private</li>
          </ul>
        </div>
      </div>

      {/* Right side - Registration form */}
      <div className="auth-form-side">
        <div className="auth-card">
          <div className="card">
            <div className="card-header">
              <h1>Create Account</h1>
              <p>Fill in your details to get started</p>
            </div>

            <div className="card-body">
              {error && (
                <div className="alert alert-error mb-4" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className="form-group">
                  <label htmlFor="name" className="form-label">Full Name</label>
                  <input
                    type="text" id="name" name="name" className="form-input"
                    placeholder="Enter your full name" value={formData.name}
                    onChange={handleChange} required disabled={loading}
                  />
                  {errors.name && <p className="text-danger text-sm mt-1">{errors.name}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email" id="email" name="email" className="form-input"
                    placeholder="you@example.com" value={formData.email}
                    onChange={handleChange} required autoComplete="email" disabled={loading}
                  />
                  {errors.email && <p className="text-danger text-sm mt-1">{errors.email}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input
                    type="password" id="password" name="password" className="form-input"
                    placeholder="At least 6 characters" value={formData.password}
                    onChange={handleChange} required autoComplete="new-password" disabled={loading}
                  />
                  {errors.password && <p className="text-danger text-sm mt-1">{errors.password}</p>}
                </div>

                <div className="flex gap-4">
                  <div className="form-group flex-1">
                    <label htmlFor="dateOfBirth" className="form-label">Date of Birth</label>
                    <input
                      type="date" id="dateOfBirth" name="dateOfBirth" className="form-input"
                      value={formData.dateOfBirth} onChange={handleChange} required disabled={loading}
                    />
                  </div>
                  <div className="form-group flex-1">
                    <label htmlFor="gender" className="form-label">Gender</label>
                    <select
                      id="gender" name="gender" className="form-input"
                      value={formData.gender} onChange={handleChange} required disabled={loading}
                    >
                      <option value="">Select</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="phone" className="form-label">Phone</label>
                  <input
                    type="tel" id="phone" name="phone" className="form-input"
                    placeholder="Enter your phone number" value={formData.phone}
                    onChange={handleChange} required disabled={loading}
                  />
                  {errors.phone && <p className="text-danger text-sm mt-1">{errors.phone}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="address" className="form-label">Address</label>
                  <input
                    type="text" id="address" name="address" className="form-input"
                    placeholder="Enter your address" value={formData.address}
                    onChange={handleChange} disabled={loading}
                  />
                </div>

                <button
                  type="submit" className="btn btn-primary w-full mt-6" disabled={loading}
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>

              <p className="text-center text-sm text-slate-500 mt-6">
                Already have an account?{' '}
                <Link to="/login" className="text-teal-600 font-medium hover:text-teal-700">Sign In</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register