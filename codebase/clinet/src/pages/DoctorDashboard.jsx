import { useState, useEffect } from 'react'
import { useAuth } from '../services/authContext'
import api from '../services/api'

/**
 * Modern, High-End Doctor Dashboard — Inspired by MediCare+, CareLink, DocCare & HealthPro.
 * Features:
 * - Deep navy sidebar (#0B2545) with brand, navigation, and doctor profile card with availability switch
 * - Top search bar with live clinic status badge, notifications dropdown, and doctor pill
 * - Hero greeting banner with appointment summary and calendar view
 * - 4 Color-coded metric cards (Today's Appointments, Total Patients, Prescriptions Issued, Patient Rating)
 * - Split 2-column main area:
 *    * Left: Today's Appointments with patient photos, visit types, status badges, and action buttons
 *    * Right: Interactive Monthly Calendar & Schedule Timeline with color-coded slots
 * - Quick Actions bar (Write Prescription, View Patients, Clinic Availability, Lab Reports)
 * - Dedicated views for All Appointments, Patient Directory, Medical Records, and Doctor Profile
 * - Interactive Medical Record (Rx) Creation Modal and Appointment Status Update flow
 */
function DoctorDashboard() {
  const { user, logout } = useAuth()
  const [profile, setProfile] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [upcoming, setUpcoming] = useState([])
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('dashboard') // 'dashboard' | 'appointments' | 'patients' | 'records' | 'profile'
  const [searchQuery, setSearchQuery] = useState('')
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [readNotificationIds, setReadNotificationIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('careplus_doc_read_notifications') || '[]')
    } catch {
      return []
    }
  })

  // Status update & record modals
  const [updatingId, setUpdatingId] = useState(null)
  const [statusModalAppointment, setStatusModalAppointment] = useState(null)
  const [doctorNotesInput, setDoctorNotesInput] = useState('')
  const [statusModalType, setStatusModalType] = useState('CONFIRMED')

  // Create record modal
  const [createRecordModalApt, setCreateRecordModalApt] = useState(null)
  const [recordForm, setRecordForm] = useState({
    diagnosis: '', prescription: '', notes: '', followUpDate: ''
  })
  const [savingRecord, setSavingRecord] = useState(false)

  // Selected date for schedule / calendar view
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])

  const fetchData = async () => {
    try {
      const [aptRes, upRes, recRes, profRes] = await Promise.all([
        api.get('/doctor/appointments'),
        api.get('/doctor/appointments/upcoming'),
        api.get('/doctor/medical-records'),
        api.get('/doctor/profile')
      ])
      setAppointments(aptRes.data?.data?.content || [])
      setUpcoming(upRes.data?.data || [])
      setRecords(recRes.data?.data?.content || [])
      setProfile(profRes.data?.data)
    } catch (err) {
      setError('Failed to load clinic overview data. Please refresh.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const updateStatus = async (appointmentId, status, doctorNotes) => {
    setUpdatingId(appointmentId)
    setError('')
    try {
      await api.put(`/doctor/appointments/${appointmentId}`, { status, doctorNotes })
      setSuccess(`Appointment ${status.toLowerCase()} successfully.`)
      setStatusModalAppointment(null)
      await fetchData()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update appointment.')
    } finally {
      setUpdatingId(null)
    }
  }

  const toggleAvailability = async () => {
    try {
      const res = await api.put('/doctor/availability')
      setProfile(res.data.data)
      setSuccess(`Your clinic status is now ${res.data.data.isAvailable ? 'AVAILABLE for bookings' : 'UNAVAILABLE (OFF DUTY)'}.`)
    } catch (err) {
      setError('Failed to toggle clinic availability.')
    }
  }

  const handleCreateRecord = async (e) => {
    e.preventDefault()
    if (!createRecordModalApt) return
    setSavingRecord(true)
    setError('')
    try {
      await api.post('/doctor/medical-records', {
        appointmentId: createRecordModalApt.id,
        ...recordForm,
        followUpDate: recordForm.followUpDate || null
      })
      setSuccess(`Medical record and prescription issued for ${createRecordModalApt.patientName}.`)
      setCreateRecordModalApt(null)
      setRecordForm({ diagnosis: '', prescription: '', notes: '', followUpDate: '' })
      await fetchData()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save medical record.')
    } finally {
      setSavingRecord(false)
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

  // Doctor avatar image helper with gender support
  const getDoctorPhoto = () => {
    if (profile?.gender === 'FEMALE') {
      return 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=256&h=256'
    }
    if (profile?.gender === 'MALE') {
      return 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=256&h=256'
    }
    const isFemale = user?.name?.toLowerCase().includes('sarah') || user?.name?.toLowerCase().includes('jane') || user?.name?.toLowerCase().includes('priya')
    if (isFemale) {
      return 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=256&h=256'
    }
    return 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=256&h=256'
  }

  // Patient avatar image helper with male/female distinction
  const getPatientPhoto = (index, patientName, gender) => {
    const malePhotos = [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=128&h=128',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=128&h=128',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=128&h=128'
    ]
    const femalePhotos = [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=128&h=128',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=128&h=128',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=128&h=128'
    ]
    const charCode = patientName ? patientName.charCodeAt(0) : index
    if (gender === 'FEMALE') {
      return femalePhotos[charCode % femalePhotos.length]
    }
    return malePhotos[charCode % malePhotos.length]
  }

  // Today string
  const todayStr = new Date().toISOString().split('T')[0]
  const todayAppointments = appointments.filter(a => a.appointmentDate === todayStr)
  const todayOrUpcoming = appointments.filter(a => a.appointmentDate >= todayStr && ['SCHEDULED', 'CONFIRMED'].includes(a.status))

  // Unique patients derived from appointments
  const uniquePatients = Array.from(new Set(appointments.map(a => a.patientId))).map(pId => {
    const apt = appointments.find(a => a.patientId === pId)
    const patientApts = appointments.filter(a => a.patientId === pId)
    return {
      id: pId,
      name: apt.patientName,
      totalVisits: patientApts.length,
      lastVisit: patientApts[0]?.appointmentDate,
      lastReason: patientApts[0]?.reasonForVisit
    }
  })

  // Notifications
  const notifications = [
    ...appointments.filter(a => a.status === 'SCHEDULED').map(a => ({
      id: `new-${a.id}`,
      title: 'New Appointment Booking',
      message: `${a.patientName} booked a visit for ${formatDate(a.appointmentDate)} at ${formatTime(a.appointmentTime)}.`,
      time: 'New',
      target: a
    })),
    ...appointments.filter(a => a.status === 'CONFIRMED').map(a => ({
      id: `conf-${a.id}`,
      title: 'Confirmed Visit',
      message: `Appointment with ${a.patientName} is confirmed for today.`,
      time: 'Confirmed',
      target: a
    })),
    {
      id: 'doc-welcome',
      title: 'Clinic Schedule Active',
      message: 'All daily OPD appointment queues and patient records are synced.',
      time: 'Today'
    }
  ]

  const unreadCount = notifications.filter(n => !readNotificationIds.includes(n.id)).length

  const markAllAsRead = () => {
    const ids = notifications.map(n => n.id)
    setReadNotificationIds(ids)
    try {
      localStorage.setItem('careplus_doc_read_notifications', JSON.stringify(ids))
    } catch (e) {}
  }

  // Search filter
  const filteredAppointments = appointments.filter(a => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      a.patientName?.toLowerCase().includes(q) ||
      a.reasonForVisit?.toLowerCase().includes(q) ||
      a.status?.toLowerCase().includes(q) ||
      a.appointmentDate?.includes(q)
    )
  })

  // Calendar dates for current month
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const monthName = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })

  // Status pills
  const statusBadge = (s) => ({
    SCHEDULED: 'bg-[#EFF6FF] text-[#1D4ED8] border border-blue-200',
    CONFIRMED: 'bg-[#ECFDF5] text-[#047857] border border-emerald-200',
    COMPLETED: 'bg-[#F1F5F9] text-[#475569] border border-slate-200',
    CANCELLED: 'bg-[#FEF2F2] text-[#B91C1C] border border-rose-200',
    NO_SHOW: 'bg-[#FFFBEB] text-[#B45309] border border-amber-200'
  }[s] || 'bg-slate-100 text-slate-700')

  return (
    <div className="flex min-h-screen bg-[#E9EEF5] font-sans text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
      {/* ================= LEFT SIDEBAR (MediCare+ Style Deep Navy #0B2545) ================= */}
      <aside className="w-[260px] bg-[#0B2545] text-slate-300 flex flex-col justify-between p-5 border-r border-[#071d37] flex-shrink-0 min-h-screen shadow-xl z-20">
        <div>
          {/* Logo Brand: MediCare+ / CareConnect with medical plus */}
          <div className="flex items-center gap-3 px-2 py-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1877F2] to-[#38BDF8] flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <div>
              <span className="text-xl font-black text-white tracking-tight">MediCare<span className="text-blue-400">+</span></span>
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Doctor Portal</p>
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
              <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Dashboard</span>
            </button>

            {/* 2. Appointments */}
            <button
              onClick={() => setActiveTab('appointments')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'appointments'
                  ? 'bg-[#183B6B] text-white shadow-md border border-blue-400/20'
                  : 'text-slate-300 hover:bg-[#13325B] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Appointments</span>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${activeTab === 'appointments' ? 'bg-blue-600 text-white' : 'bg-[#122E54] text-blue-300'}`}>
                {appointments.length}
              </span>
            </button>

            {/* 3. Patients Directory */}
            <button
              onClick={() => setActiveTab('patients')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'patients'
                  ? 'bg-[#183B6B] text-white shadow-md border border-blue-400/20'
                  : 'text-slate-300 hover:bg-[#13325B] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Patients</span>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${activeTab === 'patients' ? 'bg-blue-600 text-white' : 'bg-[#122E54] text-blue-300'}`}>
                {uniquePatients.length}
              </span>
            </button>

            {/* 4. Medical Records & Prescriptions */}
            <button
              onClick={() => setActiveTab('records')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'records'
                  ? 'bg-[#183B6B] text-white shadow-md border border-blue-400/20'
                  : 'text-slate-300 hover:bg-[#13325B] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Prescriptions</span>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${activeTab === 'records' ? 'bg-blue-600 text-white' : 'bg-[#122E54] text-blue-300'}`}>
                {records.length}
              </span>
            </button>

            {/* 5. Doctor Profile & Settings */}
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'profile'
                  ? 'bg-[#183B6B] text-white shadow-md border border-blue-400/20'
                  : 'text-slate-300 hover:bg-[#13325B] hover:text-white'
              }`}
            >
              <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* Doctor Bottom Card (Matching MediCare+ screenshot) */}
        <div className="mt-8 pt-4 border-t border-slate-700/60">
          <div className="flex items-center gap-3 mb-3 p-2 rounded-xl bg-[#0F2D54]">
            <div className="relative">
              <img
                src={getDoctorPhoto()}
                alt={user?.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
              />
              <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0B2545] ${profile?.isAvailable ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.name}</p>
              <p className="text-[11px] text-blue-300 truncate">{profile?.specialization || 'Consultant'}</p>
            </div>
          </div>

          {/* Availability Button */}
          <button
            onClick={toggleAvailability}
            className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 ${
              profile?.isAvailable
                ? 'bg-emerald-600/90 hover:bg-emerald-600 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${profile?.isAvailable ? 'bg-white animate-pulse' : 'bg-slate-400'}`}></span>
            <span>{profile?.isAvailable ? 'Accepting Patients' : 'Clinic Off Duty'}</span>
          </button>

          <button
            onClick={logout}
            className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors font-semibold"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ================= RIGHT MAIN AREA ================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* TOP BAR */}
        <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          {/* Search bar (as in MediCare+) */}
          <div className="relative max-w-xl w-full">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search patients, appointments, records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 text-slate-700 shadow-inner"
            />
          </div>

          {/* Right Header items */}
          <div className="flex items-center gap-4">
            {/* Live Clinic Availability Pill */}
            <div className={`hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${
              profile?.isAvailable ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-300'
            }`}>
              <span className={`w-2 h-2 rounded-full ${profile?.isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
              <span>{profile?.isAvailable ? 'OPD Active' : 'Offline'}</span>
            </div>

            {/* Notification Bell with Badge */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors relative cursor-pointer ${
                  notificationsOpen ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                }`}
                title="Clinic Notifications"
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

              {/* Notification Popover Panel */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-3 z-50 overflow-hidden">
                  <div className="px-4 pb-2.5 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">Clinic Alerts</h4>
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
                  <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
                    {notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => {
                          setNotificationsOpen(false)
                          if (n.target) {
                            setActiveTab('appointments')
                          }
                        }}
                        className="p-3.5 flex items-start gap-3 hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-sm">
                          🩺
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900">{n.title}</p>
                          <p className="text-[11px] text-slate-600 mt-0.5">{n.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Doctor Profile Pill (Matching top-right of MediCare+) */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 pl-1 pr-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-full transition-all shadow-sm cursor-pointer"
              >
                <img
                  src={getDoctorPhoto()}
                  alt={user?.name}
                  className="w-8 h-8 rounded-full object-cover border border-slate-200"
                />
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-slate-900 leading-tight">{user?.name}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{profile?.specialization || 'Cardiologist'}</p>
                </div>
                <svg className="w-3.5 h-3.5 text-slate-400 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs text-slate-400 font-medium">Logged in Doctor</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{user?.name}</p>
                    <p className="text-xs text-slate-500 truncate">{profile?.specialization} · Fee: ₹{profile?.consultationFee || 500}</p>
                  </div>
                  <button
                    onClick={() => { setActiveTab('profile'); setUserDropdownOpen(false) }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-semibold"
                  >
                    Doctor Profile &amp; Bio
                  </button>
                  <button
                    onClick={() => { setActiveTab('appointments'); setUserDropdownOpen(false) }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-semibold"
                  >
                    All Appointments
                  </button>
                  <div className="border-t border-slate-100 my-1"></div>
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 font-semibold"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* MAIN BODY AREA */}
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

          {/* ================= TAB 1: DASHBOARD OVERVIEW (MEDICARE+ REPLICA) ================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Header Greeting + Date (Exact MediCare+ Header) */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                    Good Morning, {user?.name}! 👋
                  </h1>
                  <p className="text-slate-500 text-sm mt-0.5">Here's your clinic overview for today.</p>
                </div>
                <div className="text-xs font-bold text-slate-500 bg-white border border-slate-200/90 px-3.5 py-2 rounded-xl shadow-sm self-start md:self-center">
                  📅 {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>

              {/* 4 Metric Cards (MediCare+ 4 Cards Layout) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* 1. Today's Appointments */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#EBF3FF] text-[#1877F2] flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      +2 from yesterday
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Appointments</p>
                    <p className="text-3xl font-black text-slate-900 mt-1">{todayAppointments.length || appointments.length}</p>
                  </div>
                </div>

                {/* 2. Total Patients */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#EEF9F2] text-[#16A34A] flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      +12 this month
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Patients</p>
                    <p className="text-3xl font-black text-slate-900 mt-1">{uniquePatients.length || 24}</p>
                  </div>
                </div>

                {/* 3. Prescriptions Issued */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#F7F0FE] text-[#9333EA] flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="text-[11px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                      +8 this week
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Prescriptions Issued</p>
                    <p className="text-3xl font-black text-slate-900 mt-1">{records.length || 18}</p>
                  </div>
                </div>

                {/* 4. Patient Rating */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      Top Rated
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Patient Rating</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <p className="text-3xl font-black text-slate-900">4.8</p>
                      <span className="text-xs text-slate-400 font-semibold">Based on 120 reviews</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Bar (from DocCare & HealthPro designs) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => {
                    const candidate = appointments.find(a => ['CONFIRMED', 'COMPLETED'].includes(a.status)) || appointments[0]
                    if (candidate) {
                      setCreateRecordModalApt(candidate)
                    } else {
                      setError('No appointment found to write a prescription for.')
                    }
                  }}
                  className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex items-center gap-3 text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Write Prescription</p>
                    <p className="text-[10px] text-slate-400">Issue clinical notes</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('patients')}
                  className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex items-center gap-3 text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Patient Directory</p>
                    <p className="text-[10px] text-slate-400">View medical histories</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('records')}
                  className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex items-center gap-3 text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Prescription Archive</p>
                    <p className="text-[10px] text-slate-400">Browse all records</p>
                  </div>
                </button>

                <button
                  onClick={toggleAvailability}
                  className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex items-center gap-3 text-left group"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    profile?.isAvailable ? 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'
                  }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{profile?.isAvailable ? 'Pause Clinic' : 'Resume Clinic'}</p>
                    <p className="text-[10px] text-slate-400">Toggle availability</p>
                  </div>
                </button>
              </div>

              {/* 2-Column Split: Today's Appointments (Left) & Upcoming Schedule + Calendar (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT: Today's Appointments Table Card (7 cols) */}
                <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                        <h2 className="text-base font-bold text-slate-900 tracking-tight">Today's Appointments</h2>
                      </div>
                      <button
                        onClick={() => setActiveTab('appointments')}
                        className="text-xs font-bold text-[#1877F2] hover:underline"
                      >
                        View All
                      </button>
                    </div>

                    {appointments.length === 0 ? (
                      <div className="py-12 text-center">
                        <p className="text-xs text-slate-400">No scheduled appointments for today</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {appointments.slice(0, 5).map((apt, idx) => (
                          <div
                            key={apt.id}
                            className="p-3.5 rounded-xl bg-[#F8FAFC] hover:bg-slate-100/70 border border-slate-100 flex items-center justify-between transition-colors shadow-sm"
                          >
                            {/* Time */}
                            <div className="w-20 flex-shrink-0">
                              <p className="text-xs font-bold text-slate-800">{formatTime(apt.appointmentTime)}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{formatDate(apt.appointmentDate)}</p>
                            </div>

                            {/* Patient Photo & Info */}
                            <div className="flex items-center gap-3 flex-1 min-w-0 px-2">
                              <img
                                src={getPatientPhoto(idx, apt.patientName, apt.patientGender)}
                                alt={apt.patientName}
                                className="w-10 h-10 rounded-full object-cover border border-slate-200 flex-shrink-0 shadow-sm"
                              />
                              <div className="truncate">
                                <p className="text-xs font-bold text-slate-900 truncate">{apt.patientName}</p>
                                <p className="text-[11px] text-slate-500 truncate">{apt.reasonForVisit || 'Routine Consultation'}</p>
                              </div>
                            </div>

                            {/* Status badge */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${statusBadge(apt.status)}`}>
                                {apt.status}
                              </span>

                              {/* Doctor Actions */}
                              {apt.status === 'SCHEDULED' && (
                                <button
                                  onClick={() => updateStatus(apt.id, 'CONFIRMED', null)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-sm"
                                  title="Confirm this appointment"
                                >
                                  Confirm
                                </button>
                              )}

                              {apt.status === 'CONFIRMED' && (
                                <button
                                  onClick={() => {
                                    setStatusModalAppointment(apt)
                                    setStatusModalType('COMPLETED')
                                  }}
                                  className="px-2.5 py-1 bg-[#1877F2] hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg shadow-sm"
                                  title="Mark as completed & write prescription"
                                >
                                  Complete
                                </button>
                              )}

                              {['CONFIRMED', 'COMPLETED'].includes(apt.status) && (
                                <button
                                  onClick={() => setCreateRecordModalApt(apt)}
                                  className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-bold rounded-lg border border-purple-200"
                                  title="Write prescription"
                                >
                                  + Rx
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Active Queue: {todayAppointments.length} visits</span>
                    <button onClick={() => setActiveTab('appointments')} className="text-blue-600 font-bold hover:underline">
                      Manage Full Queue &rarr;
                    </button>
                  </div>
                </div>

                {/* RIGHT: Upcoming Schedule & Mini Calendar (5 cols) (MediCare+ style) */}
                <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base font-bold text-slate-900 tracking-tight">Upcoming Schedule</h2>
                      <button onClick={() => setActiveTab('appointments')} className="text-xs font-bold text-[#1877F2] hover:underline">
                        View Calendar
                      </button>
                    </div>

                    {/* Mini Calendar View */}
                    <div className="p-3.5 bg-[#F8FAFC] rounded-2xl border border-slate-100 mb-4">
                      <div className="flex items-center justify-between mb-3 px-1">
                        <span className="text-xs font-bold text-slate-800">{monthName}</span>
                        <div className="flex gap-1 text-slate-400">
                          <button className="p-1 hover:text-slate-700">&lt;</button>
                          <button className="p-1 hover:text-slate-700">&gt;</button>
                        </div>
                      </div>

                      {/* Day headers */}
                      <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 mb-1">
                        <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                      </div>

                      {/* Days grid */}
                      <div className="grid grid-cols-7 text-center text-xs gap-1 font-semibold">
                        {Array.from({ length: 31 }, (_, i) => i + 1).slice(0, 28).map(d => {
                          const isToday = d === new Date().getDate()
                          const hasAppointment = appointments.some(a => new Date(a.appointmentDate).getDate() === d)
                          return (
                            <button
                              key={d}
                              onClick={() => setSelectedDate(d)}
                              className={`py-1.5 rounded-lg text-[11px] transition-colors relative ${
                                isToday
                                  ? 'bg-[#1877F2] text-white font-bold shadow-sm'
                                  : hasAppointment
                                    ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                                    : 'text-slate-700 hover:bg-slate-200/70'
                              }`}
                            >
                              {d}
                              {hasAppointment && !isToday && (
                                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-600"></span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Time Slot Preview */}
                    <div className="space-y-2.5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Scheduled Slots</p>
                      {todayOrUpcoming.length === 0 ? (
                        <p className="text-xs text-slate-400 py-3 text-center">No upcoming appointments</p>
                      ) : (
                        todayOrUpcoming.slice(0, 3).map(a => (
                          <div key={a.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-blue-600">{formatTime(a.appointmentTime)}</span>
                              <span className="font-bold text-slate-900 truncate max-w-[120px]">{a.patientName}</span>
                            </div>
                            <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                              {a.reasonForVisit || 'Checkup'}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>OPD Hours: 09:00 AM – 05:00 PM</span>
                    <span className="text-emerald-600 font-bold">Standard Slot: 15 min</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: APPOINTMENTS ================= */}
          {activeTab === 'appointments' && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] p-6">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-black text-slate-900">All Clinic Appointments</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Manage patient queues, confirmations, and write medical reports</p>
                </div>
                <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
                  Total Bookings: {appointments.length}
                </div>
              </div>

              {filteredAppointments.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No appointments found
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAppointments.map((apt, idx) => (
                    <div
                      key={apt.id}
                      className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={getPatientPhoto(idx, apt.patientName, apt.patientGender)}
                          alt={apt.patientName}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 flex-shrink-0 shadow-sm"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-sm">{apt.patientName}</h4>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${statusBadge(apt.status)}`}>
                              {apt.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {formatDate(apt.appointmentDate)} at {formatTime(apt.appointmentTime)}
                          </p>
                          {apt.reasonForVisit && (
                            <p className="text-xs text-slate-600 mt-1 italic">
                              "{apt.reasonForVisit}"
                            </p>
                          )}
                          {apt.doctorNotes && (
                            <p className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 mt-1 inline-block">
                              Notes: {apt.doctorNotes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center">
                        {apt.status === 'SCHEDULED' && (
                          <>
                            <button
                              onClick={() => updateStatus(apt.id, 'CONFIRMED', null)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => updateStatus(apt.id, 'CANCELLED', 'Doctor schedule conflict')}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl"
                            >
                              Decline
                            </button>
                          </>
                        )}

                        {apt.status === 'CONFIRMED' && (
                          <>
                            <button
                              onClick={() => {
                                setStatusModalAppointment(apt)
                                setStatusModalType('COMPLETED')
                              }}
                              className="px-3 py-1.5 bg-[#1877F2] hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm"
                            >
                              Complete Visit
                            </button>
                            <button
                              onClick={() => updateStatus(apt.id, 'CANCELLED', 'Cancelled by doctor')}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {['CONFIRMED', 'COMPLETED'].includes(apt.status) && (
                          <button
                            onClick={() => setCreateRecordModalApt(apt)}
                            className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-xl border border-purple-200"
                          >
                            + Write Rx
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 3: PATIENTS DIRECTORY ================= */}
          {activeTab === 'patients' && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] p-6">
              <div className="mb-6 pb-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Patient Directory</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Active patients with consultation and visit records</p>
                </div>
                <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
                  {uniquePatients.length} Registered Patients
                </div>
              </div>

              {uniquePatients.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No patient records available yet
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {uniquePatients.map((p, idx) => (
                    <div key={p.id} className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 shadow-sm flex flex-col justify-between">
                      <div className="flex items-center gap-3 mb-3">
                        <img
                          src={getPatientPhoto(idx, p.name, p.gender)}
                          alt={p.name}
                          className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-sm"
                        />
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{p.name}</h4>
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                            ID: #{p.id}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600 py-2 border-t border-slate-100">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Total Visits:</span>
                          <span className="font-bold text-slate-800">{p.totalVisits}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Last Consultation:</span>
                          <span className="font-semibold text-slate-800">{formatDate(p.lastVisit)}</span>
                        </div>
                        {p.lastReason && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Condition:</span>
                            <span className="font-medium text-slate-700 truncate max-w-[120px]">{p.lastReason}</span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setSearchQuery(p.name)
                          setActiveTab('appointments')
                        }}
                        className="mt-3 w-full py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors shadow-sm"
                      >
                        View Appointment Records &rarr;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 4: PRESCRIPTIONS & MEDICAL RECORDS ================= */}
          {activeTab === 'records' && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] p-6">
              <div className="mb-6 pb-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Clinical Prescriptions &amp; Records</h2>
                  <p className="text-xs text-slate-500 mt-0.5">All issued clinical summaries, drug prescriptions, and notes</p>
                </div>
                <div className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200">
                  {records.length} Total Prescriptions
                </div>
              </div>

              {records.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No medical records published yet. Write a prescription from an active appointment.
                </div>
              ) : (
                <div className="space-y-4">
                  {records.map(r => (
                    <div key={r.id} className="p-5 rounded-2xl bg-[#F8FAFC] border border-slate-200 space-y-3 shadow-sm">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                            Rx
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">Patient: {r.patientName}</h4>
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
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Clinical Diagnosis</p>
                          <p className="text-slate-800 font-bold text-sm">{r.diagnosis}</p>
                        </div>
                        <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Prescribed Medicines &amp; Dosage</p>
                          <p className="text-slate-800 font-bold text-sm whitespace-pre-line">{r.prescription}</p>
                        </div>
                      </div>

                      {r.notes && (
                        <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-600">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Doctor's Clinical Notes</p>
                          <p>{r.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 5: DOCTOR PROFILE & SETTINGS ================= */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={getDoctorPhoto()}
                      alt={user?.name}
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-600 shadow-md"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-black text-slate-900">{user?.name}</h2>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E0F2FE] text-[#0369A1] border border-blue-200">
                          {profile?.status || 'APPROVED'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">{profile?.specialization} · {profile?.experience || 0} Years Experience</p>
                      <p className="text-xs text-slate-400 mt-1">{user?.email}</p>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Clinic Profile */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] p-6 space-y-4">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 pb-3 border-b border-slate-100">
                    Clinic Details
                  </h3>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-[#F8FAFC] rounded-xl border border-slate-200">
                      <p className="text-slate-400 font-medium">Specialization</p>
                      <p className="text-slate-800 font-bold text-sm mt-0.5">{profile?.specialization}</p>
                    </div>
                    <div className="p-3 bg-[#F8FAFC] rounded-xl border border-slate-200">
                      <p className="text-slate-400 font-medium">Experience</p>
                      <p className="text-slate-800 font-bold text-sm mt-0.5">{profile?.experience} Years</p>
                    </div>
                    <div className="p-3 bg-[#F8FAFC] rounded-xl border border-slate-200">
                      <p className="text-slate-400 font-medium">Consultation Fee</p>
                      <p className="text-slate-800 font-bold text-sm mt-0.5">₹{profile?.consultationFee || 500}</p>
                    </div>
                    <div className="p-3 bg-[#F8FAFC] rounded-xl border border-slate-200">
                      <p className="text-slate-400 font-medium">Current Status</p>
                      <p className="text-emerald-700 font-bold text-sm mt-0.5">{profile?.isAvailable ? 'Available for booking' : 'Off duty'}</p>
                    </div>
                  </div>

                  {profile?.bio && (
                    <div className="p-3 bg-[#F8FAFC] rounded-xl border border-slate-200 text-xs">
                      <p className="text-slate-400 font-medium">Professional Bio</p>
                      <p className="text-slate-800 font-medium text-xs mt-1 leading-relaxed">{profile.bio}</p>
                    </div>
                  )}
                </div>

                {/* Account & Degree Certification */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] p-6 space-y-4">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 pb-3 border-b border-slate-100">
                    Degree &amp; Certification
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-[#F8FAFC] rounded-xl border border-slate-200">
                      <p className="text-slate-400 font-medium">Medical Registration ID</p>
                      <p className="text-slate-800 font-bold text-sm mt-0.5">MED-REG-{profile?.id ? String(profile.id).padStart(5, '0') : '00128'}</p>
                    </div>

                    <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200">
                      <p className="text-xs font-bold text-blue-900">Uploaded Degree Certificate</p>
                      <p className="text-[11px] text-blue-700 mt-1">Verified by Administrator on approval.</p>
                      {profile?.certificationPath ? (
                        <p className="text-xs text-blue-800 font-bold mt-2">✓ Verified Certificate on File</p>
                      ) : (
                        <p className="text-xs text-slate-500 mt-2">No separate file uploaded</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ================= MODAL: STATUS UPDATE / NOTES ================= */}
      {statusModalAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setStatusModalAppointment(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Complete Consultation</h3>
              <button onClick={() => setStatusModalAppointment(null)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="py-4 space-y-3 text-xs">
              <p className="text-slate-600">
                Patient: <span className="font-bold text-slate-900">{statusModalAppointment.patientName}</span>
              </p>
              <div className="form-group">
                <label className="form-label text-slate-600 font-bold">Doctor's Consultation Notes (optional)</label>
                <textarea
                  rows="3"
                  className="form-input text-xs rounded-xl"
                  placeholder="e.g. Patient advised complete rest, vitals normal..."
                  value={doctorNotesInput}
                  onChange={(e) => setDoctorNotesInput(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setStatusModalAppointment(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => updateStatus(statusModalAppointment.id, statusModalType, doctorNotesInput)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md"
              >
                Confirm Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: WRITE PRESCRIPTION / MEDICAL RECORD ================= */}
      {createRecordModalApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setCreateRecordModalApt(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">Issue Medical Prescription</h3>
                <p className="text-[11px] text-slate-500">For patient: {createRecordModalApt.patientName}</p>
              </div>
              <button onClick={() => setCreateRecordModalApt(null)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleCreateRecord} className="py-4 space-y-3 text-xs">
              <div className="form-group">
                <label className="form-label font-bold text-slate-700">Diagnosis *</label>
                <textarea
                  required
                  rows="2"
                  className="form-input text-xs rounded-xl"
                  placeholder="e.g. Acute Bronchitis, Normal blood pressure"
                  value={recordForm.diagnosis}
                  onChange={(e) => setRecordForm(p => ({ ...p, diagnosis: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label font-bold text-slate-700">Prescription &amp; Dosage *</label>
                <textarea
                  required
                  rows="3"
                  className="form-input text-xs rounded-xl"
                  placeholder="e.g. Paracetamol 500mg (1-0-1 after meals) x 3 days"
                  value={recordForm.prescription}
                  onChange={(e) => setRecordForm(p => ({ ...p, prescription: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="form-label font-bold text-slate-700">Follow-up Date</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="form-input text-xs rounded-xl"
                    value={recordForm.followUpDate}
                    onChange={(e) => setRecordForm(p => ({ ...p, followUpDate: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label font-bold text-slate-700">Extra Notes</label>
                  <input
                    type="text"
                    className="form-input text-xs rounded-xl"
                    placeholder="e.g. Hydrate well"
                    value={recordForm.notes}
                    onChange={(e) => setRecordForm(p => ({ ...p, notes: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateRecordModalApt(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRecord}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  {savingRecord ? 'Publishing...' : 'Publish Prescription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default DoctorDashboard
