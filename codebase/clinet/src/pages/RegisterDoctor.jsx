import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'

/**
 * Doctor self-registration — split-screen design with pending approval notice.
 */
function RegisterDoctor() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    specialization: '', experience: '', bio: '', consultationFee: '',
    gender: 'MALE'
  })
  const [certFile, setCertFile] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setSubmitting(false)
      return
    }

    try {
      const data = new Blob([JSON.stringify({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        specialization: formData.specialization,
        experience: parseInt(formData.experience),
        bio: formData.bio,
        consultationFee: formData.consultationFee ? parseFloat(formData.consultationFee) : null,
        gender: formData.gender
      })], { type: 'application/json' })

      const form = new FormData()
      form.append('data', data)
      if (certFile) form.append('certification', certFile)

      await api.post('/auth/register-doctor', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setSuccess('Registration submitted! An admin will review and approve your account.')
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-layout">
      {/* Left side - Branding */}
      <div className="auth-brand">
        <div>
          <h1 className="auth-brand-logo">CareConnect</h1>
          <p className="auth-brand-tagline">
            Join our network of qualified doctors
          </p>
          <ul className="auth-brand-features">
            <li>Manage your appointment schedule</li>
            <li>Create digital medical records</li>
            <li>Set your availability</li>
            <li>Build your patient base</li>
          </ul>
        </div>
      </div>

      {/* Right side - Registration form */}
      <div className="auth-form-side">
        <div className="auth-card">
          <div className="card">
            <div className="card-header">
              <h1>Doctor Registration</h1>
              <p>Register your professional account</p>
            </div>

            <div className="card-body">
              {error && <div className="alert alert-error mb-4">{error}</div>}
              {success && <div className="alert alert-success mb-4">{success}</div>}

              <form onSubmit={handleSubmit} noValidate>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" name="name" className="form-input" placeholder="Dr. John Smith" value={formData.name} onChange={handleChange} required disabled={submitting} />
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" name="email" className="form-input" placeholder="doctor@example.com" value={formData.email} onChange={handleChange} required disabled={submitting} />
                </div>

                <div className="flex gap-4">
                  <div className="form-group flex-1">
                    <label className="form-label">Password</label>
                    <input type="password" name="password" className="form-input" value={formData.password} onChange={handleChange} required minLength="6" disabled={submitting} />
                  </div>
                  <div className="form-group flex-1">
                    <label className="form-label">Confirm Password</label>
                    <input type="password" name="confirmPassword" className="form-input" value={formData.confirmPassword} onChange={handleChange} required disabled={submitting} />
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="form-group flex-1">
                    <label className="form-label">Specialization</label>
                    <input type="text" name="specialization" className="form-input" placeholder="e.g., Cardiology, Dermatology" value={formData.specialization} onChange={handleChange} required disabled={submitting} />
                  </div>
                  <div className="form-group flex-1">
                    <label className="form-label">Doctor Gender</label>
                    <select name="gender" className="form-input" value={formData.gender} onChange={handleChange} required disabled={submitting}>
                      <option value="MALE">Male Doctor 👨‍⚕️</option>
                      <option value="FEMALE">Female Doctor 👩‍⚕️</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="form-group flex-1">
                    <label className="form-label">Experience (years)</label>
                    <input type="number" name="experience" className="form-input" min="0" max="100" value={formData.experience} onChange={handleChange} required disabled={submitting} />
                  </div>
                  <div className="form-group flex-1">
                    <label className="form-label">Consultation Fee (₹)</label>
                    <input type="number" name="consultationFee" className="form-input" min="0" step="0.01" value={formData.consultationFee} onChange={handleChange} disabled={submitting} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Degree Certification</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="form-input"
                    onChange={e => setCertFile(e.target.files[0])}
                    disabled={submitting}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Upload your medical degree or certification (PDF, JPG, PNG — max 5MB)
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Bio</label>
                  <textarea name="bio" className="form-input" rows="3" placeholder="Tell us about your experience and expertise..." value={formData.bio} onChange={handleChange} disabled={submitting} />
                </div>

                <div className="alert alert-info mb-4">
                  Your account will be reviewed by an admin before you can log in.
                </div>

                <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Register as Doctor'}
                </button>
              </form>

              <p className="text-center text-sm text-slate-500 mt-4">
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

export default RegisterDoctor