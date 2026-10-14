import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../services/authContext'
import api from '../services/api'

/**
 * Book Appointment page — sidebar layout with doctor selection and form.
 */
function BookAppointment() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [doctors, setDoctors] = useState([])
  const [loadingDoctors, setLoadingDoctors] = useState(true)
  const [formData, setFormData] = useState({
    doctorId: '', appointmentDate: '', appointmentTime: '', reasonForVisit: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await api.get('/patient/doctors')
        setDoctors(response.data.data.content || [])
      } catch (err) {
        setError('Failed to load doctors. Please try again.')
      } finally {
        setLoadingDoctors(false)
      }
    }
    fetchDoctors()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      await api.post('/patient/appointments', {
        doctorId: Number(formData.doctorId),
        appointmentDate: formData.appointmentDate,
        appointmentTime: formData.appointmentTime,
        reasonForVisit: formData.reasonForVisit
      })
      setSuccess('Appointment booked successfully!')
      setTimeout(() => navigate('/patient/dashboard'), 1500)
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  const getDoctorPhoto = (docName, specialization, gender) => {
    if (gender === 'FEMALE') {
      return 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=256&h=256'
    }
    if (gender === 'MALE') {
      return 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=256&h=256'
    }
    const isFemale = docName?.toLowerCase().includes('sarah') || docName?.toLowerCase().includes('jane') || docName?.toLowerCase().includes('priya')
    if (isFemale) {
      return 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=256&h=256'
    }
    return 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=256&h=256'
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-xl font-bold text-teal-700">CareConnect</h1>
          <p className="text-xs text-slate-500 mt-1">Patient Portal</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link to="/patient/dashboard" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            Dashboard
          </Link>
          <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-teal-50 text-teal-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            Book Appointment
          </div>
        </nav>
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm">
              {user?.name?.charAt(0) || 'P'}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>
          <button onClick={logout} className="btn btn-outline w-full btn-sm">Sign Out</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-2xl">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Book Appointment</h1>
            <p className="text-slate-500 mt-1">Choose a doctor and pick a date and time</p>
          </div>

          {error && <div className="alert alert-error mb-6">{error}</div>}
          {success && <div className="alert alert-success mb-6">{success}</div>}

          {loadingDoctors ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
              <p className="text-slate-500 mt-3">Loading doctors...</p>
            </div>
          ) : doctors.length === 0 ? (
            <div className="card card-body text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900">No doctors available</h3>
              <p className="text-slate-500 mt-1">Please check back later or contact admin</p>
            </div>
          ) : (
            <div className="card">
              <div className="card-body">
                <form onSubmit={handleSubmit} noValidate>
                  {/* Doctor Selection */}
                  <div className="form-group">
                    <label className="form-label">Select Doctor</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {doctors.map(doc => (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => setFormData(p => ({...p, doctorId: doc.id}))}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            formData.doctorId === doc.id
                              ? 'border-blue-500 bg-blue-50/70 shadow-sm'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={getDoctorPhoto(doc.name, doc.specialization, doc.gender)}
                              alt={doc.name}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-sm"
                            />
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{doc.name}</p>
                              <p className="text-xs text-slate-500">{doc.specialization} · {doc.experience} yrs</p>
                              {doc.consultationFee && <p className="text-xs text-blue-600 font-bold mt-0.5">₹{doc.consultationFee}</p>}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Date</label>
                      <input
                        type="date" name="appointmentDate" className="form-input"
                        min={today} value={formData.appointmentDate}
                        onChange={handleChange} required disabled={submitting}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Time</label>
                      <input
                        type="time" name="appointmentTime" className="form-input"
                        value={formData.appointmentTime}
                        onChange={handleChange} required disabled={submitting}
                      />
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="form-group">
                    <label className="form-label">Reason for Visit</label>
                    <textarea
                      name="reasonForVisit" className="form-input" rows="3"
                      placeholder="Describe your symptoms or reason for the appointment..."
                      value={formData.reasonForVisit}
                      onChange={handleChange} disabled={submitting}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary w-full mt-2" disabled={submitting || !formData.doctorId}>
                    {submitting ? 'Booking...' : 'Book Appointment'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default BookAppointment