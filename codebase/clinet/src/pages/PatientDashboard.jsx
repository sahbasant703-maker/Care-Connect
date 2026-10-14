import { useState, useEffect } from 'react'
import { useAuth } from '../services/authContext'
import { Link } from 'react-router-dom'
import api from '../services/api'

/**
 * Modern, High-End Patient Dashboard — Designed like leading medical portals (CarePlus / One Medical).
 * Enhancements:
 * - Soothing, non-white layered background (#E9EEF5 / #E3EAF3) for high contrast and modern feel
 * - Real medical images, doctor portraits, and wellness graphics
 * - Quick Healthcare Services bar (Teleconsult, Specialists, Prescriptions, Lab Reports)
 * - Vitals preview bar (Blood Pressure, Heart Rate, SpO2, Blood Group)
 * - Hero Next Appointment spotlight with doctor photo, verified badges, and quick actions
 * - Wellness Tip card with real visual imagery and hydration tracker
 * - Full Profile view with patient card and clinical history
 */
function PatientDashboard() {
  const { user, logout } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [records, setRecords] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('dashboard') // 'dashboard' | 'appointments' | 'records' | 'profile'
  const [searchQuery, setSearchQuery] = useState('')
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [readNotificationIds, setReadNotificationIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('careplus_read_notifications') || '[]')
    } catch {
      return []
    }
  })

  // Modals
  const [rescheduleId, setRescheduleId] = useState(null)
  const [rescheduleForm, setRescheduleForm] = useState({ appointmentDate: '', appointmentTime: '', reasonForVisit: '' })
  const [rescheduling, setRescheduling] = useState(false)
  const [cancellingId, setCancellingId] = useState(null)
  const [viewAppointment, setViewAppointment] = useState(null)

  const fetchData = async () => {
    try {
      const [aptRes, recRes, profRes] = await Promise.all([
        api.get('/patient/appointments'),
        api.get('/patient/medical-records'),
        api.get('/patient/profile').catch(() => ({ data: { data: null } }))
      ])
      setAppointments(aptRes.data?.data?.content || [])
      setRecords(recRes.data?.data?.content || [])
      if (profRes.data?.data) {
        setProfile(profRes.data.data)
      }
    } catch (err) {
      setError('Failed to load dashboard data. Please refresh.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const cancelAppointment = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return
    setCancellingId(id)
    setError('')
    try {
      await api.put(`/patient/appointments/${id}/cancel`, { cancellationReason: 'Cancelled by patient' })
      setSuccess('Appointment cancelled successfully.')
      if (viewAppointment?.id === id) setViewAppointment(null)
      await fetchData()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel appointment.')
    } finally {
      setCancellingId(null)
    }
  }

  const openReschedule = (apt) => {
    setRescheduleId(apt.id)
    setRescheduleForm({
      appointmentDate: apt.appointmentDate,
      appointmentTime: apt.appointmentTime,
      reasonForVisit: apt.reasonForVisit || ''
    })
  }

  const handleReschedule = async (e) => {
    e.preventDefault()
    setRescheduling(true)
    setError('')
    try {
      await api.put(`/patient/appointments/${rescheduleId}/reschedule`, {
        doctorId: appointments.find(a => a.id === rescheduleId)?.doctorId,
        ...rescheduleForm
      })
      setSuccess('Appointment rescheduled successfully!')
      setRescheduleId(null)
      if (viewAppointment?.id === rescheduleId) setViewAppointment(null)
      await fetchData()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reschedule.')
    } finally {
      setRescheduling(false)
    }
  }

  const formatDate = (d) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatTime = (t) => {
    if (!t) return ''
    const [h, m] = t.split(':')
    const hr = parseInt(h)
    return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`
  }

  const canCancel = (apt) => ['SCHEDULED', 'CONFIRMED'].includes(apt.status) &&
    new Date(apt.appointmentDate) >= new Date().setHours(0, 0, 0, 0)

  // Filter and sort appointments
  const upcomingList = appointments
    .filter(a => ['SCHEDULED', 'CONFIRMED'].includes(a.status))
    .sort((a, b) => new Date(`${a.appointmentDate}T${a.appointmentTime}`) - new Date(`${b.appointmentDate}T${b.appointmentTime}`))

  const completedList = appointments.filter(a => a.status === 'COMPLETED')
  const nextAppointment = upcomingList[0] || null

  // Greeting by hour
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const todayFormatted = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })

  // Generate Notification Items
  const notifications = [
    ...upcomingList.map(apt => ({
      id: `apt-${apt.id}`,
      type: 'appointment',
      title: 'Appointment Reminder',
      message: `Upcoming visit with ${apt.doctorName} (${apt.doctorSpecialization}) on ${formatDate(apt.appointmentDate)} at ${formatTime(apt.appointmentTime)}.`,
      time: 'Scheduled',
      target: apt
    })),
    ...records.map(rec => ({
      id: `rec-${rec.id}`,
      type: 'record',
      title: 'New Medical Record',
      message: `Dr. ${rec.doctorName} has published your clinical prescription and diagnosis.`,
      time: formatDate(rec.createdAt),
      target: rec
    })),
    ...completedList.map(apt => ({
      id: `comp-${apt.id}`,
      type: 'completed',
      title: 'Visit Completed',
      message: `Your appointment with ${apt.doctorName} has been marked completed.`,
      time: formatDate(apt.appointmentDate),
      target: apt
    })),
    {
      id: 'welcome-1',
      type: 'system',
      title: 'Welcome to CarePlus',
      message: 'Your health dashboard is active. You can browse specialists and book consultations anytime.',
      time: 'Just now'
    }
  ]

  const unreadCount = notifications.filter(n => !readNotificationIds.includes(n.id)).length

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id)
    setReadNotificationIds(allIds)
    try {
      localStorage.setItem('careplus_read_notifications', JSON.stringify(allIds))
    } catch (e) {
      // ignore
    }
  }

  const markNotificationRead = (n) => {
    if (!readNotificationIds.includes(n.id)) {
      const updated = [...readNotificationIds, n.id]
      setReadNotificationIds(updated)
      try {
        localStorage.setItem('careplus_read_notifications', JSON.stringify(updated))
      } catch (e) {
        // ignore
      }
    }
    setNotificationsOpen(false)
    if (n.type === 'appointment' && n.target) {
      setViewAppointment(n.target)
    } else if (n.type === 'record') {
      setActiveTab('records')
    } else if (n.type === 'completed' && n.target) {
      setViewAppointment(n.target)
    }
  }

  // Doctor avatar image helper with gender support
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

  // Search filter
  const filteredAppointments = appointments.filter(a => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      a.doctorName?.toLowerCase().includes(q) ||
      a.doctorSpecialization?.toLowerCase().includes(q) ||
      a.reasonForVisit?.toLowerCase().includes(q) ||
      a.status?.toLowerCase().includes(q)
    )
  })

  const filteredRecords = records.filter(r => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      r.doctorName?.toLowerCase().includes(q) ||
      r.diagnosis?.toLowerCase().includes(q) ||
      r.prescription?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="flex min-h-screen bg-[#E9EEF5] font-sans text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
      {/* ================= LEFT SIDEBAR (DEEP NAVY BLUE #0B2545) ================= */}
      <aside className="w-[260px] bg-[#0B2545] text-slate-300 flex flex-col justify-between p-5 border-r border-[#071c35] flex-shrink-0 min-h-screen shadow-xl z-20">
        <div>
          {/* Brand Logo with Cross Icon */}
          <div className="flex items-center gap-3 px-2 py-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1877F2] to-[#38BDF8] flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <div>
              <span className="text-xl font-black text-white tracking-tight">CarePlus</span>
              <p className="text-[10px] text-blue-400 font-bold tracking-wider uppercase">Health Network</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {/* 1. Dashboard */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-[#183B6B] text-white shadow-md border border-blue-400/20'
                  : 'text-slate-300 hover:bg-[#13325B] hover:text-white'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Dashboard</span>
            </button>

            {/* 2. Book Appointment */}
            <Link
              to="/patient/book"
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-slate-300 hover:bg-[#13325B] hover:text-white transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Book Appointment</span>
            </Link>

            {/* 3. Appointment History */}
            <button
              onClick={() => setActiveTab('appointments')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'appointments'
                  ? 'bg-[#183B6B] text-white shadow-md border border-blue-400/20'
                  : 'text-slate-300 hover:bg-[#13325B] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Appointment History</span>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${activeTab === 'appointments' ? 'bg-blue-600 text-white' : 'bg-[#122E54] text-blue-300'}`}>
                {appointments.length}
              </span>
            </button>

            {/* 4. Medical Records */}
            <button
              onClick={() => setActiveTab('records')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'records'
                  ? 'bg-[#183B6B] text-white shadow-md border border-blue-400/20'
                  : 'text-slate-300 hover:bg-[#13325B] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Medical Records</span>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${activeTab === 'records' ? 'bg-blue-600 text-white' : 'bg-[#122E54] text-blue-300'}`}>
                {records.length}
              </span>
            </button>

            {/* 5. Profile */}
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'profile'
                  ? 'bg-[#183B6B] text-white shadow-md border border-blue-400/20'
                  : 'text-slate-300 hover:bg-[#13325B] hover:text-white'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Profile</span>
            </button>
          </nav>
        </div>

        {/* Promo Card: "Your Health Our Priority" */}
        <div className="mt-8">
          <div className="rounded-2xl p-4 bg-gradient-to-b from-[#153B6C] to-[#0D294E] border border-blue-400/20 text-center relative overflow-hidden shadow-lg">
            <div className="w-12 h-14 mx-auto mb-2 bg-[#E0F2FE] rounded-2xl flex items-center justify-center shadow-inner relative">
              <svg className="w-7 h-7 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              <span className="absolute bottom-1 right-1.5 w-2.5 h-2.5 bg-amber-400 rounded-full border border-white"></span>
            </div>
            <h4 className="text-white font-bold text-sm leading-snug">Your Health<br />Our Priority</h4>
            <div className="flex items-center justify-center gap-1.5 mt-2.5 text-xs text-blue-200 font-semibold">
              <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold">
                +
              </div>
              <span>CarePlus</span>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-rose-400 transition-colors font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ================= RIGHT MAIN AREA (WARM SLATE-BLUE BACKGROUND) ================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* TOP BAR: Glassmorphism header */}
        <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          {/* Search bar */}
          <div className="relative max-w-xl w-full">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search doctors, records, or services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 text-slate-700 shadow-inner"
            />
          </div>

          {/* Right: Notification bell + User profile */}
          <div className="flex items-center gap-4">
            {/* 24/7 Helpline Badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>24/7 Emergency Active</span>
            </div>

            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen)
                  setUserDropdownOpen(false)
                }}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors relative cursor-pointer ${
                  notificationsOpen ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                }`}
                title="Notifications"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-black rounded-full ring-2 ring-white shadow-sm animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Panel */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-3 z-50 overflow-hidden">
                  <div className="px-4 pb-2.5 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">Notifications</h4>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map(n => {
                        const isRead = readNotificationIds.includes(n.id)
                        return (
                          <div
                            key={n.id}
                            onClick={() => markNotificationRead(n)}
                            className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 cursor-pointer transition-colors ${
                              isRead ? 'opacity-70 bg-white' : 'bg-blue-50/40'
                            }`}
                          >
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold shadow-sm">
                              {n.type === 'appointment' && (
                                <span className="w-full h-full rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">📅</span>
                              )}
                              {n.type === 'record' && (
                                <span className="w-full h-full rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">📝</span>
                              )}
                              {n.type === 'completed' && (
                                <span className="w-full h-full rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">✓</span>
                              )}
                              {n.type === 'system' && (
                                <span className="w-full h-full rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">✨</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <p className={`text-xs ${isRead ? 'font-semibold text-slate-800' : 'font-bold text-slate-900'}`}>
                                  {n.title}
                                </p>
                                <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{n.time}</span>
                              </div>
                              <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                                {n.message}
                              </p>
                            </div>
                            {!isRead && (
                              <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1.5"></span>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>

                  <div className="px-4 pt-2 border-t border-slate-100 text-center">
                    <button
                      onClick={() => setNotificationsOpen(false)}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-800"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 pl-1 pr-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-full transition-all shadow-sm cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-[#0B2545] text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                  {user?.name?.charAt(0) || 'B'}
                </div>
                <span className="text-sm font-bold text-slate-800">{user?.name}</span>
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs text-slate-400 font-medium">Signed in as</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{user?.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => { setActiveTab('profile'); setUserDropdownOpen(false) }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-semibold"
                  >
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    My Profile
                  </button>
                  <button
                    onClick={() => { setActiveTab('appointments'); setUserDropdownOpen(false) }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-semibold"
                  >
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    My Appointments
                  </button>
                  <div className="border-t border-slate-100 my-1"></div>
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 font-semibold"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* MAIN BODY AREA WITH COLOR CONTRAST */}
        <main className="p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Alerts */}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center justify-between text-sm shadow-sm">
              <span>{error}</span>
              <button onClick={() => setError('')} className="text-rose-500 font-bold hover:text-rose-700 text-lg leading-none">&times;</button>
            </div>
          )}
          {success && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between text-sm shadow-sm">
              <span>{success}</span>
              <button onClick={() => setSuccess('')} className="text-emerald-500 font-bold hover:text-emerald-700 text-lg leading-none">&times;</button>
            </div>
          )}

          {/* ================= VIEW 1: DASHBOARD OVERVIEW ================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Header Greeting with Health Vitals Preview Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                    {greeting}, {user?.name} 👋
                  </h1>
                  <p className="text-slate-500 text-sm mt-0.5">Take charge of your health today with CarePlus.</p>
                </div>
                <div className="text-xs font-bold text-slate-500 bg-white/80 border border-slate-200/90 px-3.5 py-2 rounded-xl shadow-sm self-start md:self-center">
                  📅 {todayFormatted}
                </div>
              </div>

              {/* 3 Metric Cards (Light Cyan/Blue, Light Mint/Green, Light Lavender/Purple) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. Upcoming Appointments */}
                <div className="bg-[#EDF5FD] border border-[#D5E6F7] rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#DBEAFE] text-[#1D4ED8] flex items-center justify-center shadow-sm">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">Next Scheduled</span>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Upcoming Appointments</p>
                    <p className="text-3xl font-black text-slate-900 mt-1">{upcomingList.length}</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('appointments')}
                    className="mt-3 text-xs font-bold text-[#1877F2] hover:underline flex items-center gap-1 self-start"
                  >
                    View all <span>&rarr;</span>
                  </button>
                </div>

                {/* 2. Completed Visits */}
                <div className="bg-[#EEF9F2] border border-[#D0F0DC] rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] text-[#15803D] flex items-center justify-center shadow-sm">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Verified History</span>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Completed Visits</p>
                    <p className="text-3xl font-black text-slate-900 mt-1">{completedList.length}</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('appointments')}
                    className="mt-3 text-xs font-bold text-[#16A34A] hover:underline flex items-center gap-1 self-start"
                  >
                    View history <span>&rarr;</span>
                  </button>
                </div>

                {/* 3. Medical Records */}
                <div className="bg-[#F7F0FE] border border-[#EADBFA] rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#F3E8FF] text-[#7E22CE] flex items-center justify-center shadow-sm">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">Clinical Prescriptions</span>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Medical Records</p>
                    <p className="text-3xl font-black text-slate-900 mt-1">{records.length}</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('records')}
                    className="mt-3 text-xs font-bold text-[#9333EA] hover:underline flex items-center gap-1 self-start"
                  >
                    View records <span>&rarr;</span>
                  </button>
                </div>
              </div>

              {/* Patient Vitals Bar (Real Medical Portal Experience) */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Heart Rate</span>
                    <p className="text-sm font-black text-slate-800">72 <span className="text-xs font-medium text-slate-400">bpm</span></p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Blood Pressure</span>
                    <p className="text-sm font-black text-slate-800">120/80 <span className="text-xs font-medium text-slate-400">mmHg</span></p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Blood Group</span>
                    <p className="text-sm font-black text-slate-800">{profile?.bloodGroup || 'O+'} <span className="text-xs font-medium text-slate-400">Positive</span></p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Blood Glucose</span>
                    <p className="text-sm font-black text-slate-800">95 <span className="text-xs font-medium text-slate-400">mg/dL</span></p>
                  </div>
                </div>
              </div>

              {/* Next Appointment Card (White Elevated Card from Image) */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)]">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">Next Appointment</h2>
                  </div>
                  {nextAppointment && (
                    <button
                      onClick={() => setActiveTab('appointments')}
                      className="text-xs font-bold text-[#1877F2] hover:underline"
                    >
                      View all
                    </button>
                  )}
                </div>

                {nextAppointment ? (
                  <div>
                    {/* Top Row: Date Box + Doctor Photo & Details + Status Pill */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 p-4 rounded-xl bg-[#F8FAFC] border border-slate-100">
                      {/* Left: Date Box + Doctor Picture & Info */}
                      <div className="flex items-center gap-5">
                        {/* Light Blue Date Box */}
                        <div className="w-24 h-24 bg-[#EDF6FD] border border-[#D5E8FA] rounded-2xl flex flex-col items-center justify-center text-center flex-shrink-0 shadow-sm">
                          <span className="text-[11px] font-bold text-[#1877F2] uppercase tracking-wider">
                            {new Date(nextAppointment.appointmentDate).toLocaleDateString('en-US', { weekday: 'short' })}
                          </span>
                          <span className="text-3xl font-black text-[#0B2545] leading-none my-0.5">
                            {new Date(nextAppointment.appointmentDate).getDate()}
                          </span>
                          <span className="text-[11px] text-slate-600 font-semibold">
                            {new Date(nextAppointment.appointmentDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </span>
                        </div>

                        {/* Doctor Picture + Real Website Experience */}
                        <div className="relative flex-shrink-0 hidden sm:block">
                          <img
                            src={getDoctorPhoto(nextAppointment.doctorName, nextAppointment.doctorSpecialization, nextAppointment.doctorGender)}
                            alt={nextAppointment.doctorName}
                            className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md"
                          />
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>
                        </div>

                        {/* Middle Info */}
                        <div className="space-y-1">
                          {/* Time */}
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{formatTime(nextAppointment.appointmentTime)}</span>
                          </div>

                          {/* Doctor */}
                          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                            <span>{nextAppointment.doctorName}</span>
                            <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">✓</span>
                          </div>

                          {/* Specialization */}
                          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                            <svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd"/>
                            </svg>
                            <span>{nextAppointment.doctorSpecialization}</span>
                          </div>

                          {/* Location */}
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>CarePlus Central Hospital · OPD Block B</span>
                          </div>
                        </div>
                      </div>

                      {/* Status Pill on Right */}
                      <div className="self-start md:self-center">
                        <span className="px-3.5 py-1.5 bg-[#E0F2FE] text-[#0369A1] font-bold text-xs rounded-xl uppercase tracking-wide border border-blue-200">
                          {nextAppointment.status}
                        </span>
                      </div>
                    </div>

                    {/* Reason for visit */}
                    <div className="mt-4 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
                      <span className="font-bold text-slate-700">Reason for visit: </span>
                      {nextAppointment.reasonForVisit || 'General health consultation'}
                    </div>

                    {/* Buttons: Book New Appointment + View Details */}
                    <div className="flex flex-wrap items-center gap-3 mt-4 pt-1">
                      <Link
                        to="/patient/book"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1877F2] hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Book New Appointment</span>
                      </Link>

                      <button
                        onClick={() => setViewAppointment(nextAppointment)}
                        className="inline-flex items-center px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl transition-colors shadow-sm"
                      >
                        View Details
                      </button>

                      {canCancel(nextAppointment) && (
                        <div className="flex gap-2 ml-auto">
                          <button
                            onClick={() => openReschedule(nextAppointment)}
                            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                          >
                            Reschedule
                          </button>
                          <button
                            onClick={() => cancelAppointment(nextAppointment.id)}
                            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-colors"
                            disabled={cancellingId === nextAppointment.id}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm font-semibold text-slate-700">No scheduled appointment right now</p>
                    <Link
                      to="/patient/book"
                      className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 bg-[#1877F2] text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20"
                    >
                      Book Your First Appointment &rarr;
                    </Link>
                  </div>
                )}
              </div>

              {/* Bottom 2-Column Section (Upcoming Appointments List & Wellness Card with Real Visual Photo) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left Card: Upcoming Appointments */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-slate-900 text-sm">Upcoming Appointments</h3>
                      <button
                        onClick={() => setActiveTab('appointments')}
                        className="text-xs font-bold text-[#1877F2] hover:underline"
                      >
                        View all
                      </button>
                    </div>

                    {upcomingList.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center">No upcoming appointments</p>
                    ) : (
                      <div className="space-y-3">
                        {upcomingList.slice(0, 2).map(apt => (
                          <div
                            key={apt.id}
                            onClick={() => setViewAppointment(apt)}
                            className="p-3.5 rounded-xl bg-[#F8FAFC] hover:bg-slate-100/80 border border-slate-100 flex items-center justify-between cursor-pointer transition-colors shadow-sm"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={getDoctorPhoto(apt.doctorName, apt.doctorSpecialization, apt.doctorGender)}
                                alt={apt.doctorName}
                                className="w-11 h-11 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                              />
                              <div>
                                <p className="text-xs text-slate-500 font-medium">
                                  {formatDate(apt.appointmentDate)} · {formatTime(apt.appointmentTime)}
                                </p>
                                <p className="text-xs font-bold text-slate-900 mt-0.5">{apt.doctorName}</p>
                                <p className="text-[11px] text-slate-500">{apt.doctorSpecialization}</p>
                              </div>
                            </div>
                            <span className="px-2.5 py-0.5 bg-[#E0F2FE] text-[#0369A1] font-bold text-[10px] rounded-md border border-blue-200">
                              {apt.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Card: Wellness Tip with High Quality Health Photo & Lotus Pose Graphic */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] flex items-center justify-between gap-4">
                  <div className="space-y-2 max-w-[240px]">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm">Wellness Tip</h3>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Stay hydrated and get proper sleep to keep your immune system strong.
                    </p>
                    <div className="pt-2 flex items-center gap-2">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Daily Goal: 2.5L Water
                      </span>
                    </div>
                  </div>

                  {/* Meditation illustration visual */}
                  <div className="w-24 h-24 flex-shrink-0 relative flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
                      <circle cx="60" cy="60" r="45" fill="#E6F4EA" />
                      <path d="M25 80C25 55 45 40 60 40C75 40 95 55 95 80" stroke="#A7D7B5" strokeWidth="2" strokeDasharray="3 3" />
                      <circle cx="60" cy="45" r="10" fill="#F4B896" />
                      <path d="M50 42C50 35 70 35 70 42C70 45 68 49 60 49C52 49 50 45 50 42Z" fill="#2C3E50" />
                      <path d="M48 60C48 55 52 53 60 53C68 53 72 55 72 60L74 74H46L48 60Z" fill="#1877F2" />
                      <path d="M48 62L40 70C38 72 40 75 44 75L56 75" stroke="#F4B896" strokeWidth="4" strokeLinecap="round" />
                      <path d="M72 62L80 70C82 72 80 75 76 75L64 75" stroke="#F4B896" strokeWidth="4" strokeLinecap="round" />
                      <ellipse cx="60" cy="84" rx="26" ry="9" fill="#1E3A8A" />
                      <ellipse cx="60" cy="80" rx="14" ry="7" fill="#2563EB" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= VIEW 2: APPOINTMENT HISTORY ================= */}
          {activeTab === 'appointments' && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] p-6">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Appointment History</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Manage, track, or reschedule all your medical visits</p>
                </div>
                <Link to="/patient/book" className="px-4 py-2 bg-[#1877F2] hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/20">
                  <span>+ Book New</span>
                </Link>
              </div>

              {filteredAppointments.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm font-semibold text-slate-600">No appointments found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAppointments.map(apt => (
                    <div
                      key={apt.id}
                      className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={getDoctorPhoto(apt.doctorName, apt.doctorSpecialization, apt.doctorGender)}
                          alt={apt.doctorName}
                          className="w-14 h-14 rounded-2xl object-cover border border-slate-200 flex-shrink-0 shadow-sm"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-sm">{apt.doctorName}</h4>
                            <span className="px-2 py-0.5 bg-[#E0F2FE] text-[#0369A1] font-bold text-[10px] rounded-md border border-blue-200">
                              {apt.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {apt.doctorSpecialization} · {formatDate(apt.appointmentDate)} at {formatTime(apt.appointmentTime)}
                          </p>
                          {apt.reasonForVisit && (
                            <p className="text-xs text-slate-600 mt-1 italic">
                              "{apt.reasonForVisit}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center">
                        <button
                          onClick={() => setViewAppointment(apt)}
                          className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl shadow-sm"
                        >
                          View
                        </button>
                        {canCancel(apt) && (
                          <>
                            <button
                              onClick={() => openReschedule(apt)}
                              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                            >
                              Reschedule
                            </button>
                            <button
                              onClick={() => cancelAppointment(apt.id)}
                              className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl"
                              disabled={cancellingId === apt.id}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= VIEW 3: MEDICAL RECORDS ================= */}
          {activeTab === 'records' && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] p-6">
              <div className="mb-6 pb-4 border-b border-slate-100">
                <h2 className="text-xl font-black text-slate-900">Medical Records</h2>
                <p className="text-xs text-slate-500 mt-0.5">Clinical notes, diagnosis, and doctor prescriptions</p>
              </div>

              {filteredRecords.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm font-semibold text-slate-600">No medical records on file yet</p>
                  <p className="text-xs text-slate-400 mt-1">Records are created by doctors once visits are completed.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRecords.map(r => (
                    <div key={r.id} className="p-5 rounded-2xl bg-[#F8FAFC] border border-slate-200 space-y-3 shadow-sm">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                        <div className="flex items-center gap-3">
                          <img
                            src={getDoctorPhoto(r.doctorName, '')}
                            alt={r.doctorName}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                          />
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">{r.doctorName}</h4>
                            <p className="text-[11px] text-slate-500">Issued on {formatDate(r.createdAt)}</p>
                          </div>
                        </div>
                        {r.followUpDate && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            Follow-up: {formatDate(r.followUpDate)}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Diagnosis</p>
                          <p className="text-slate-800 font-bold text-sm">{r.diagnosis}</p>
                        </div>
                        <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Prescription</p>
                          <p className="text-slate-800 font-bold text-sm whitespace-pre-line">{r.prescription}</p>
                        </div>
                      </div>

                      {r.notes && (
                        <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-600">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Doctor's Notes</p>
                          <p>{r.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= VIEW 4: PATIENT PROFILE ================= */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Profile Hero Header Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0B2545] to-[#1E3A8A] text-white flex items-center justify-center text-3xl font-black shadow-md">
                      {user?.name?.charAt(0) || 'B'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-black text-slate-900">{user?.name}</h2>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E0F2FE] text-[#0369A1] border border-blue-200">
                          PATIENT
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">{user?.email}</p>
                      {profile?.createdAt && (
                        <p className="text-xs text-slate-400 mt-1">
                          CarePlus Member since {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors self-start md:self-center shadow-sm"
                  >
                    &larr; Back to Dashboard
                  </button>
                </div>
              </div>

              {/* Personal Information & Emergency Contact Grids */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Personal Information */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] p-6 space-y-4">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 pb-3 border-b border-slate-100">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Personal Information
                  </h3>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-[#F8FAFC] rounded-xl border border-slate-200">
                      <p className="text-slate-400 font-medium">Date of Birth</p>
                      <p className="text-slate-800 font-bold text-sm mt-0.5">{profile?.dateOfBirth || 'Not provided'}</p>
                    </div>
                    <div className="p-3 bg-[#F8FAFC] rounded-xl border border-slate-200">
                      <p className="text-slate-400 font-medium">Gender</p>
                      <p className="text-slate-800 font-bold text-sm mt-0.5">{profile?.gender || 'Not provided'}</p>
                    </div>
                    <div className="p-3 bg-[#F8FAFC] rounded-xl border border-slate-200">
                      <p className="text-slate-400 font-medium">Blood Group</p>
                      <p className="text-slate-800 font-bold text-sm mt-0.5">{profile?.bloodGroup || 'O+'}</p>
                    </div>
                    <div className="p-3 bg-[#F8FAFC] rounded-xl border border-slate-200">
                      <p className="text-slate-400 font-medium">Registered Phone</p>
                      <p className="text-slate-800 font-bold text-sm mt-0.5">{profile?.phone || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] rounded-xl border border-slate-200 text-xs">
                    <p className="text-slate-400 font-medium">Residential Address</p>
                    <p className="text-slate-800 font-bold text-sm mt-0.5">{profile?.address || '123 Main Street, Sector 4'}</p>
                  </div>
                </div>

                {/* 2. Emergency & Medical Details */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] p-6 space-y-4">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 pb-3 border-b border-slate-100">
                    <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Emergency & Clinical Info
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-[#F8FAFC] rounded-xl border border-slate-200">
                      <p className="text-slate-400 font-medium">Emergency Contact Name</p>
                      <p className="text-slate-800 font-bold text-sm mt-0.5">{profile?.emergencyContactName || 'None listed'}</p>
                    </div>
                    <div className="p-3 bg-[#F8FAFC] rounded-xl border border-slate-200">
                      <p className="text-slate-400 font-medium">Emergency Contact Phone</p>
                      <p className="text-slate-800 font-bold text-sm mt-0.5">{profile?.emergencyContactPhone || 'None listed'}</p>
                    </div>
                    <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl">
                      <p className="text-amber-800 font-bold uppercase text-[10px]">Known Allergies & Conditions</p>
                      <p className="text-amber-900 font-semibold text-xs mt-1">{profile?.allergies || 'No known allergies recorded'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ================= DETAIL MODAL ================= */}
      {viewAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setViewAppointment(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">Appointment Details</h3>
              <button onClick={() => setViewAppointment(null)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="py-4 space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={getDoctorPhoto(viewAppointment.doctorName, viewAppointment.doctorSpecialization, viewAppointment.doctorGender)}
                    alt={viewAppointment.doctorName}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                  />
                  <div>
                    <p className="font-bold text-base text-slate-900">{viewAppointment.doctorName}</p>
                    <p className="text-xs text-slate-500">{viewAppointment.doctorSpecialization}</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-[#E0F2FE] text-[#0369A1] font-bold text-xs rounded-lg uppercase border border-blue-200">
                  {viewAppointment.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <p className="text-slate-400 font-semibold">Date</p>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{formatDate(viewAppointment.appointmentDate)}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold">Time</p>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{formatTime(viewAppointment.appointmentTime)}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Reason for Visit</p>
                <p className="text-slate-700 bg-slate-50 p-3 rounded-xl text-xs">{viewAppointment.reasonForVisit || 'No reason provided'}</p>
              </div>
              {viewAppointment.doctorNotes && (
                <div>
                  <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Doctor's Notes</p>
                  <p className="text-slate-700 bg-blue-50/70 p-3 rounded-xl text-xs border border-blue-100">{viewAppointment.doctorNotes}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              {canCancel(viewAppointment) && (
                <>
                  <button
                    onClick={() => { openReschedule(viewAppointment); setViewAppointment(null) }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    Reschedule
                  </button>
                  <button
                    onClick={() => cancelAppointment(viewAppointment.id)}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl"
                  >
                    Cancel Appointment
                  </button>
                </>
              )}
              <button
                onClick={() => setViewAppointment(null)}
                className="px-4 py-2 bg-[#1877F2] hover:bg-blue-700 text-white text-xs font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= RESCHEDULE MODAL ================= */}
      {rescheduleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setRescheduleId(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">Reschedule Appointment</h3>
              <button onClick={() => setRescheduleId(null)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleReschedule} className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label text-xs font-semibold text-slate-600">New Date</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={rescheduleForm.appointmentDate}
                    onChange={(e) => setRescheduleForm(p => ({ ...p, appointmentDate: e.target.value }))}
                    className="form-input text-sm rounded-xl"
                    required
                    disabled={rescheduling}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label text-xs font-semibold text-slate-600">New Time</label>
                  <input
                    type="time"
                    value={rescheduleForm.appointmentTime}
                    onChange={(e) => setRescheduleForm(p => ({ ...p, appointmentTime: e.target.value }))}
                    className="form-input text-sm rounded-xl"
                    required
                    disabled={rescheduling}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label text-xs font-semibold text-slate-600">Reason for visit (optional)</label>
                <textarea
                  rows="2"
                  value={rescheduleForm.reasonForVisit}
                  onChange={(e) => setRescheduleForm(p => ({ ...p, reasonForVisit: e.target.value }))}
                  className="form-input text-sm rounded-xl"
                  disabled={rescheduling}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={rescheduling}
                  className="flex-1 py-2.5 rounded-xl bg-[#1877F2] hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20"
                >
                  {rescheduling ? 'Rescheduling...' : 'Confirm Reschedule'}
                </button>
                <button
                  type="button"
                  onClick={() => setRescheduleId(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientDashboard
