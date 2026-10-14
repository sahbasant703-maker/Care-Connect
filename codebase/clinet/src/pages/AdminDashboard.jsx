import { useState, useEffect } from 'react'
import { useAuth } from '../services/authContext'
import api from '../services/api'

/**
 * Modern, High-End Admin Dashboard — Designed like leading hospital management portals.
 * Features:
 * - Deep navy sidebar (#0B2545) with brand, navigation, and admin profile card
 * - Top search bar with live system status badge, notifications dropdown, and admin profile pill
 * - 4 Color-coded metric cards (Total Doctors, Pending Approvals, Total Patients, Total Appointments)
 * - Quick Actions bar (Create Doctor, Review Pending, Patients Directory, Analytics)
 * - Split 2-column overview:
 *    * Left: Priority Pending Approvals queue with doctor details, cert view & 1-click decision
 *    * Right: Real-time appointment status breakdown & doctor workload analytics
 * - Dedicated management tabs for Doctors, Pending Approvals, Patients, Appointments, and Analytics
 * - Doctor Details & Credentialing Review Modal with secure JWT certificate preview
 */
function AdminDashboard() {
  const { user, logout } = useAuth()
  const [doctors, setDoctors] = useState([])
  const [pendingDoctors, setPendingDoctors] = useState([])
  const [patients, setPatients] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('dashboard') // 'dashboard' | 'doctors' | 'pending' | 'patients' | 'appointments' | 'analytics'
  const [searchQuery, setSearchQuery] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [readNotificationIds, setReadNotificationIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('careplus_admin_read_notifications') || '[]')
    } catch {
      return []
    }
  })

  // Create doctor form
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '', email: '', password: '', specialization: '', experience: '', bio: '', consultationFee: '',
    gender: 'MALE'
  })
  const [creating, setCreating] = useState(false)

  // Doctor Details Modal
  const [viewDoctor, setViewDoctor] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const fetchData = async () => {
    try {
      const [docsRes, pendRes, patRes, aptRes] = await Promise.all([
        api.get('/admin/doctors'),
        api.get('/admin/doctors/pending'),
        api.get('/admin/patients'),
        api.get('/admin/appointments')
      ])
      setDoctors(docsRes.data?.data?.content || [])
      setPendingDoctors(pendRes.data?.data?.content || [])
      setPatients(patRes.data?.data?.content || [])
      setAppointments(aptRes.data?.data?.content || [])
    } catch (err) {
      setError('Failed to load clinic administration data. Please refresh.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const viewDoctorDetails = async (id) => {
    setLoadingDetail(true)
    try {
      const res = await api.get(`/admin/doctors/${id}`)
      setViewDoctor(res.data.data)
    } catch (err) {
      setError('Failed to load doctor details.')
    } finally {
      setLoadingDetail(false)
    }
  }

  const viewCertification = async (filename) => {
    try {
      const res = await api.get(`/admin/certifications/${filename}`, {
        responseType: 'blob'
      })
      const blob = new Blob([res.data], { type: res.headers['content-type'] })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (err) {
      setError('Failed to load certification file.')
    }
  }

  const approveDoctor = async (id) => {
    setUpdatingId(id)
    setError('')
    try {
      await api.put(`/admin/doctors/${id}/approve`)
      setSuccess('Doctor approved successfully! Their account is now active.')
      if (viewDoctor?.id === id) setViewDoctor(null)
      await fetchData()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve doctor.')
    } finally {
      setUpdatingId(null)
    }
  }

  const rejectDoctor = async (id) => {
    if (!window.confirm('Are you sure you want to reject this doctor? Their account will be permanently removed.')) return
    setUpdatingId(id)
    setError('')
    try {
      await api.put(`/admin/doctors/${id}/reject`)
      setSuccess('Doctor application rejected and removed.')
      if (viewDoctor?.id === id) setViewDoctor(null)
      await fetchData()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject doctor.')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleCreateDoctor = async (e) => {
    e.preventDefault()
    setCreating(true)
    setError('')
    try {
      await api.post('/admin/doctors', {
        ...createForm,
        experience: parseInt(createForm.experience),
        consultationFee: createForm.consultationFee ? parseFloat(createForm.consultationFee) : null,
        gender: createForm.gender
      })
      setSuccess(`Doctor account for ${createForm.name} created and auto-approved!`)
      setShowCreateForm(false)
      setCreateForm({ name: '', email: '', password: '', specialization: '', experience: '', bio: '', consultationFee: '', gender: 'MALE' })
      await fetchData()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create doctor account.')
    } finally {
      setCreating(false)
    }
  }

  const formatDate = (d) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const formatTime = (t) => {
    if (!t) return ''
    const [h, m] = t.split(':')
    const hr = parseInt(h)
    return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`
  }

  // Doctor photo helper with male/female distinction
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

  // Patient photo helper with male/female distinction
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
    const code = patientName ? patientName.charCodeAt(0) : index
    if (gender === 'FEMALE') {
      return femalePhotos[code % femalePhotos.length]
    }
    return malePhotos[code % malePhotos.length]
  }

  // Status badges
  const statusBadge = (s) => ({
    SCHEDULED: 'bg-[#EFF6FF] text-[#1D4ED8] border border-blue-200',
    CONFIRMED: 'bg-[#ECFDF5] text-[#047857] border border-emerald-200',
    COMPLETED: 'bg-[#F1F5F9] text-[#475569] border border-slate-200',
    CANCELLED: 'bg-[#FEF2F2] text-[#B91C1C] border border-rose-200',
    NO_SHOW: 'bg-[#FFFBEB] text-[#B45309] border border-amber-200'
  }[s] || 'bg-slate-100 text-slate-700')

  const doctorStatusBadge = (s) => ({
    PENDING: 'bg-amber-100 text-amber-800 border border-amber-200',
    APPROVED: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    REJECTED: 'bg-rose-100 text-rose-800 border border-rose-200'
  }[s] || 'bg-slate-100 text-slate-700')

  // Search filter
  const filteredDoctors = doctors.filter(d => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return d.name?.toLowerCase().includes(q) || d.email?.toLowerCase().includes(q) || d.specialization?.toLowerCase().includes(q)
  })

  const filteredPatients = patients.filter(p => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return p.name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q) || p.phone?.includes(q)
  })

  const filteredAppointments = appointments.filter(a => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return a.patientName?.toLowerCase().includes(q) || a.doctorName?.toLowerCase().includes(q) || a.reasonForVisit?.toLowerCase().includes(q) || a.status?.toLowerCase().includes(q)
  })

  // Dynamic admin notifications
  const notifications = [
    ...pendingDoctors.map(d => ({
      id: `pend-${d.id}`,
      type: 'pending',
      title: 'Doctor Awaiting Approval',
      message: `${d.name} (${d.specialization}, ${d.experience} yrs) submitted registration.`,
      time: 'Action Required',
      target: d
    })),
    {
      id: 'admin-sys-1',
      type: 'system',
      title: 'Hospital Core Online',
      message: 'PostgreSQL database & Spring Boot security filters active.',
      time: 'Live'
    }
  ]

  const unreadCount = notifications.filter(n => !readNotificationIds.includes(n.id)).length

  const markAllAsRead = () => {
    const ids = notifications.map(n => n.id)
    setReadNotificationIds(ids)
    try {
      localStorage.setItem('careplus_admin_read_notifications', JSON.stringify(ids))
    } catch (e) {}
  }

  return (
    <div className="flex min-h-screen bg-[#E9EEF5] font-sans text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
      {/* ================= LEFT SIDEBAR (DEEP NAVY BLUE #0B2545) ================= */}
      <aside className="w-[260px] bg-[#0B2545] text-slate-300 flex flex-col justify-between p-5 border-r border-[#071d37] flex-shrink-0 min-h-screen shadow-xl z-20">
        <div>
          {/* Logo Brand: Medical Plus in cyan/blue */}
          <div className="flex items-center gap-3 px-2 py-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1877F2] to-[#38BDF8] flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <div>
              <span className="text-xl font-black text-white tracking-tight">CarePlus</span>
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Hospital Admin</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {/* 1. Dashboard / Overview */}
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
              <span>Overview</span>
            </button>

            {/* 2. Doctors Management */}
            <button
              onClick={() => setActiveTab('doctors')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'doctors'
                  ? 'bg-[#183B6B] text-white shadow-md border border-blue-400/20'
                  : 'text-slate-300 hover:bg-[#13325B] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Doctors</span>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${activeTab === 'doctors' ? 'bg-blue-600 text-white' : 'bg-[#122E54] text-blue-300'}`}>
                {doctors.length}
              </span>
            </button>

            {/* 3. Pending Approvals Queue (Priority highlighted) */}
            <button
              onClick={() => setActiveTab('pending')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'pending'
                  ? 'bg-[#183B6B] text-white shadow-md border border-blue-400/20'
                  : 'text-slate-300 hover:bg-[#13325B] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Pending Approvals</span>
              </div>
              {pendingDoctors.length > 0 ? (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white animate-pulse">
                  {pendingDoctors.length}
                </span>
              ) : (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#122E54] text-slate-400">0</span>
              )}
            </button>

            {/* 4. Patients Directory */}
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
                {patients.length}
              </span>
            </button>

            {/* 5. Appointments Network */}
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

            {/* 6. Analytics & Reports */}
            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-[#183B6B] text-white shadow-md border border-blue-400/20'
                  : 'text-slate-300 hover:bg-[#13325B] hover:text-white'
              }`}
            >
              <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Analytics</span>
            </button>
          </nav>
        </div>

        {/* Admin Profile Bottom Card */}
        <div className="mt-8 pt-4 border-t border-slate-700/60">
          <div className="flex items-center gap-3 mb-3 p-2.5 rounded-xl bg-[#0F2D54]">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
              🛡️
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'Administrator'}</p>
              <p className="text-[10px] text-blue-300 font-semibold uppercase tracking-wider">Super Admin</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-rose-400 transition-colors font-semibold"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          {/* Search bar */}
          <div className="relative max-w-xl w-full">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search doctors, patients, appointments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 text-slate-700 shadow-inner"
            />
          </div>

          {/* Right Header items */}
          <div className="flex items-center gap-4">
            {/* Server Online Badge */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Port 8081 Active</span>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors relative cursor-pointer ${
                  notificationsOpen ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                }`}
                title="System Notifications"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 px-1.5 py-0.2 bg-amber-500 text-white text-[10px] font-black rounded-full ring-2 ring-white shadow-sm animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-3 z-50 overflow-hidden">
                  <div className="px-4 pb-2.5 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">Admin Alerts</h4>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                          {unreadCount} pending review
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
                            viewDoctorDetails(n.target.id)
                          }
                        }}
                        className="p-3.5 flex items-start gap-3 hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-sm">
                          👨‍⚕️
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

            {/* Admin Profile Pill */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 pl-1 pr-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-full transition-all shadow-sm cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-[#0B2545] text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                  {user?.name?.charAt(0) || 'A'}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-slate-900 leading-tight">{user?.name}</p>
                  <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Super Admin</p>
                </div>
                <svg className="w-3.5 h-3.5 text-slate-400 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    onClick={() => { setActiveTab('doctors'); setUserDropdownOpen(false) }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-semibold"
                  >
                    Doctors Directory
                  </button>
                  <button
                    onClick={() => { setActiveTab('pending'); setUserDropdownOpen(false) }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-semibold"
                  >
                    Pending Approvals ({pendingDoctors.length})
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

          {/* ================= TAB 1: OVERVIEW ================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Header Greeting + Quick Action */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                    Hospital Administration 🛡️
                  </h1>
                  <p className="text-slate-500 text-sm mt-0.5">Central management of doctor credentialing, patient records &amp; clinic appointments.</p>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('doctors')
                    setShowCreateForm(true)
                  }}
                  className="px-5 py-2.5 bg-[#1877F2] hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 self-start md:self-center transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>+ Create Doctor Account</span>
                </button>
              </div>

              {/* 4 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* 1. Total Doctors */}
                <div
                  onClick={() => setActiveTab('doctors')}
                  className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] flex flex-col justify-between hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#EBF3FF] text-[#1877F2] flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                      Approved
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Doctors</p>
                    <p className="text-3xl font-black text-slate-900 mt-1">{doctors.length}</p>
                  </div>
                </div>

                {/* 2. Pending Approvals */}
                <div
                  onClick={() => setActiveTab('pending')}
                  className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] flex flex-col justify-between hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      pendingDoctors.length > 0 ? 'bg-amber-100 text-amber-800 border-amber-200 animate-pulse' : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {pendingDoctors.length} Waiting
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Review</p>
                    <p className="text-3xl font-black text-amber-600 mt-1">{pendingDoctors.length}</p>
                  </div>
                </div>

                {/* 3. Total Patients */}
                <div
                  onClick={() => setActiveTab('patients')}
                  className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] flex flex-col justify-between hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#EEF9F2] text-[#16A34A] flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      Active
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registered Patients</p>
                    <p className="text-3xl font-black text-slate-900 mt-1">{patients.length}</p>
                  </div>
                </div>

                {/* 4. Total Appointments */}
                <div
                  onClick={() => setActiveTab('appointments')}
                  className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] flex flex-col justify-between hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#F7F0FE] text-[#9333EA] flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                      All Time
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Appointments</p>
                    <p className="text-3xl font-black text-slate-900 mt-1">{appointments.length}</p>
                  </div>
                </div>
              </div>

              {/* 2-Column Split: Pending Approvals Priority Queue (Left) & Real-time Analytics (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT: Priority Pending Approvals (7 cols) */}
                <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                        <h2 className="text-base font-bold text-slate-900 tracking-tight">Doctor Credentialing Queue</h2>
                      </div>
                      <button
                        onClick={() => setActiveTab('pending')}
                        className="text-xs font-bold text-[#1877F2] hover:underline"
                      >
                        View All ({pendingDoctors.length})
                      </button>
                    </div>

                    {pendingDoctors.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 text-xs">
                        ✓ All doctor applications have been reviewed. No pending approvals.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pendingDoctors.slice(0, 4).map((d, idx) => (
                          <div
                            key={d.id}
                            className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors shadow-sm"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={getDoctorPhoto(d.name, d.specialization, d.gender)}
                                alt={d.name}
                                className="w-11 h-11 rounded-xl object-cover border border-amber-200 flex-shrink-0 shadow-sm"
                              />
                              <div>
                                <h4 className="font-bold text-slate-900 text-sm">{d.name}</h4>
                                <p className="text-xs text-slate-500 font-medium">
                                  {d.specialization} · {d.experience} yrs exp
                                </p>
                                <p className="text-[11px] text-slate-400">{d.email}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center">
                              <button
                                onClick={() => viewDoctorDetails(d.id)}
                                className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-sm"
                              >
                                View
                              </button>

                              {d.certificationPath && (
                                <button
                                  onClick={() => viewCertification(d.certificationPath.split('/').pop())}
                                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200"
                                >
                                  View Cert
                                </button>
                              )}

                              <button
                                onClick={() => approveDoctor(d.id)}
                                disabled={updatingId === d.id}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm"
                              >
                                Approve
                              </button>

                              <button
                                onClick={() => rejectDoctor(d.id)}
                                disabled={updatingId === d.id}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Admin verification protocol: review degree certifications before approval.</span>
                  </div>
                </div>

                {/* RIGHT: Status Breakdown & Workload Analytics (5 cols) */}
                <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] flex flex-col justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight mb-4">Clinic Operations Status</h2>

                    {appointments.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center">No appointment data to chart</p>
                    ) : (
                      <div className="space-y-4">
                        {['CONFIRMED', 'SCHEDULED', 'COMPLETED', 'CANCELLED'].map(s => {
                          const count = appointments.filter(a => a.status === s).length
                          const pct = Math.round((count / appointments.length) * 100) || 0
                          const colors = {
                            CONFIRMED: 'bg-emerald-500',
                            SCHEDULED: 'bg-blue-500',
                            COMPLETED: 'bg-slate-500',
                            CANCELLED: 'bg-rose-500'
                          }
                          return (
                            <div key={s} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-700">{s}</span>
                                <span className="text-slate-500 font-semibold">{count} ({pct}%)</span>
                              </div>
                              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full ${colors[s]} rounded-full transition-all`} style={{ width: `${pct}%` }}></div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Doctor Workload Preview */}
                    <div className="mt-6 pt-4 border-t border-slate-100">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">Top Doctor Workload</p>
                      <div className="space-y-2">
                        {(() => {
                          const counts = {}
                          appointments.forEach(a => { counts[a.doctorName] = (counts[a.doctorName] || 0) + 1 })
                          const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3)
                          const max = sorted[0]?.[1] || 1
                          return sorted.map(([name, count]) => (
                            <div key={name} className="flex items-center gap-2 text-xs">
                              <span className="w-28 truncate font-bold text-slate-800">{name}</span>
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(count / max) * 100}%` }}></div>
                              </div>
                              <span className="font-bold text-slate-700 w-8 text-right">{count}</span>
                            </div>
                          ))
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 text-right">
                    <button onClick={() => setActiveTab('analytics')} className="text-xs font-bold text-[#1877F2] hover:underline">
                      View Full Analytics Report &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: DOCTORS DIRECTORY + CREATE DOCTOR ================= */}
          {activeTab === 'doctors' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">Hospital Doctors Directory</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Approved medical specialists and consultants</p>
                  </div>
                  <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="px-4 py-2 bg-[#1877F2] hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 self-start sm:self-center"
                  >
                    <span>{showCreateForm ? '✕ Close Form' : '+ Add New Doctor'}</span>
                  </button>
                </div>

                {/* Inline Create Doctor Form */}
                {showCreateForm && (
                  <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-blue-200 mb-6 shadow-sm">
                    <h3 className="text-sm font-black text-slate-900 mb-1">Add Doctor Account (Direct Auto-Approval)</h3>
                    <p className="text-xs text-slate-500 mb-4">Doctor account created by administrator bypasses pending review workflow.</p>

                    <form onSubmit={handleCreateDoctor} noValidate className="space-y-4 text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-group">
                          <label className="form-label font-bold text-slate-700">Full Name *</label>
                          <input
                            type="text"
                            required
                            className="form-input text-xs rounded-xl"
                            placeholder="Dr. Full Name"
                            value={createForm.name}
                            onChange={(e) => setCreateForm(p => ({ ...p, name: e.target.value }))}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label font-bold text-slate-700">Email Address *</label>
                          <input
                            type="email"
                            required
                            className="form-input text-xs rounded-xl"
                            placeholder="doctor@hospital.com"
                            value={createForm.email}
                            onChange={(e) => setCreateForm(p => ({ ...p, email: e.target.value }))}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label font-bold text-slate-700">Password * (min 6 chars)</label>
                          <input
                            type="password"
                            required
                            minLength={6}
                            className="form-input text-xs rounded-xl"
                            placeholder="••••••••"
                            value={createForm.password}
                            onChange={(e) => setCreateForm(p => ({ ...p, password: e.target.value }))}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label font-bold text-slate-700">Specialization *</label>
                          <input
                            type="text"
                            required
                            className="form-input text-xs rounded-xl"
                            placeholder="e.g. Cardiology, Neurology"
                            value={createForm.specialization}
                            onChange={(e) => setCreateForm(p => ({ ...p, specialization: e.target.value }))}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label font-bold text-slate-700">Experience (Years) *</label>
                          <input
                            type="number"
                            required
                            min={0}
                            className="form-input text-xs rounded-xl"
                            placeholder="10"
                            value={createForm.experience}
                            onChange={(e) => setCreateForm(p => ({ ...p, experience: e.target.value }))}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label font-bold text-slate-700">Consultation Fee (₹)</label>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            className="form-input text-xs rounded-xl"
                            placeholder="500"
                            value={createForm.consultationFee}
                            onChange={(e) => setCreateForm(p => ({ ...p, consultationFee: e.target.value }))}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label font-bold text-slate-700">Doctor Gender</label>
                          <select
                            className="form-input text-xs rounded-xl"
                            value={createForm.gender}
                            onChange={(e) => setCreateForm(p => ({ ...p, gender: e.target.value }))}
                          >
                            <option value="MALE">Male Doctor 👨‍⚕️</option>
                            <option value="FEMALE">Female Doctor 👩‍⚕️</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label font-bold text-slate-700">Professional Bio</label>
                        <textarea
                          rows={2}
                          className="form-input text-xs rounded-xl"
                          placeholder="Short doctor biography..."
                          value={createForm.bio}
                          onChange={(e) => setCreateForm(p => ({ ...p, bio: e.target.value }))}
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowCreateForm(false)}
                          className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={creating}
                          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md"
                        >
                          {creating ? 'Creating Account...' : 'Create & Auto-Approve'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Doctors List */}
                {filteredDoctors.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">No doctors found</div>
                ) : (
                  <div className="space-y-3">
                    {filteredDoctors.map(d => (
                      <div
                        key={d.id}
                        className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={getDoctorPhoto(d.name, d.specialization, d.gender)}
                            alt={d.name}
                            className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-sm"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-900 text-sm">{d.name}</h4>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${doctorStatusBadge(d.status)}`}>
                                {d.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {d.specialization} · {d.experience} Years Exp · Fee: ₹{d.consultationFee || 500}
                            </p>
                            <p className="text-[11px] text-slate-400">{d.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => viewDoctorDetails(d.id)}
                            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-sm"
                          >
                            View
                          </button>

                          {d.certificationPath && (
                            <button
                              onClick={() => viewCertification(d.certificationPath.split('/').pop())}
                              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200"
                            >
                              View Cert
                            </button>
                          )}

                          {d.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => approveDoctor(d.id)}
                                disabled={updatingId === d.id}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => rejectDoctor(d.id)}
                                disabled={updatingId === d.id}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= TAB 3: PENDING APPROVALS ================= */}
          {activeTab === 'pending' && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] p-6">
              <div className="mb-6 pb-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Pending Credentialing Approvals</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Verify doctor qualifications &amp; degree certifications before allowing login</p>
                </div>
                <div className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                  {pendingDoctors.length} Waiting Review
                </div>
              </div>

              {pendingDoctors.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  ✓ No pending doctor applications. All registrations are approved.
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingDoctors.map(d => (
                    <div
                      key={d.id}
                      className="p-5 rounded-2xl bg-amber-50/40 border border-amber-200/90 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={getDoctorPhoto(d.name, d.specialization, d.gender)}
                          alt={d.name}
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-200 shadow-sm"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-base">{d.name}</h4>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                              PENDING APPROVAL
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 font-semibold mt-0.5">
                            {d.specialization} · {d.experience} Years Experience · Expected Fee: ₹{d.consultationFee || 500}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">Email: {d.email}</p>
                          {d.bio && (
                            <p className="text-xs text-slate-600 mt-2 bg-white/80 p-2.5 rounded-xl border border-amber-100 italic">
                              "{d.bio}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 self-end md:self-center">
                        <button
                          onClick={() => viewDoctorDetails(d.id)}
                          className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-sm"
                        >
                          View Details
                        </button>

                        {d.certificationPath && (
                          <button
                            onClick={() => viewCertification(d.certificationPath.split('/').pop())}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5"
                          >
                            <span>📄 View Cert</span>
                          </button>
                        )}

                        <button
                          onClick={() => approveDoctor(d.id)}
                          disabled={updatingId === d.id}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm"
                        >
                          Approve
                        </button>

                        <button
                          onClick={() => rejectDoctor(d.id)}
                          disabled={updatingId === d.id}
                          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 4: PATIENTS DIRECTORY ================= */}
          {activeTab === 'patients' && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] p-6">
              <div className="mb-6 pb-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Hospital Patients Directory</h2>
                  <p className="text-xs text-slate-500 mt-0.5">All registered healthcare recipients on the platform</p>
                </div>
                <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
                  {patients.length} Registered Patients
                </div>
              </div>

              {filteredPatients.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">No patients found</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPatients.map((p, idx) => (
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
                          <span className="text-slate-400">Email:</span>
                          <span className="font-semibold text-slate-800 truncate max-w-[150px]">{p.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Phone:</span>
                          <span className="font-semibold text-slate-800">{p.phone || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Gender / DOB:</span>
                          <span className="font-semibold text-slate-800">{p.gender || '—'} · {p.dateOfBirth || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Joined:</span>
                          <span className="font-semibold text-slate-800">{formatDate(p.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 5: APPOINTMENTS NETWORK ================= */}
          {activeTab === 'appointments' && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] p-6">
              <div className="mb-6 pb-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Hospital Appointment Registry</h2>
                  <p className="text-xs text-slate-500 mt-0.5">All scheduled, confirmed, completed &amp; cancelled clinic appointments</p>
                </div>
                <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
                  Total Records: {appointments.length}
                </div>
              </div>

              {filteredAppointments.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">No appointments found</div>
              ) : (
                <div className="space-y-3">
                  {filteredAppointments.map((a, idx) => (
                    <div
                      key={a.id}
                      className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#EDF6FD] border border-[#D5E8FA] rounded-2xl flex flex-col items-center justify-center text-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-[#1877F2] uppercase">
                            {new Date(a.appointmentDate).toLocaleDateString('en-US', { month: 'short' })}
                          </span>
                          <span className="text-base font-black text-[#0B2545] leading-none">
                            {new Date(a.appointmentDate).getDate()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-sm">{a.patientName}</h4>
                            <span className="text-slate-400 text-xs">&rarr;</span>
                            <span className="text-xs font-bold text-blue-700">{a.doctorName}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {formatTime(a.appointmentTime)} · {a.doctorSpecialization || 'General Consultation'}
                          </p>
                          {a.reasonForVisit && (
                            <p className="text-xs text-slate-600 mt-1 italic">
                              "{a.reasonForVisit}"
                            </p>
                          )}
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider self-start sm:self-center ${statusBadge(a.status)}`}>
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 6: ANALYTICS & REPORTS ================= */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] p-6">
                <h2 className="text-xl font-black text-slate-900 mb-1">Hospital Operations Analytics</h2>
                <p className="text-xs text-slate-500 mb-6">Real-time breakdown of patient volume, status distributions, and doctor utilization.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Status distribution */}
                  <div className="p-5 bg-[#F8FAFC] rounded-2xl border border-slate-200">
                    <h3 className="font-bold text-sm text-slate-900 mb-4">Appointment Status Metrics</h3>
                    <div className="space-y-4">
                      {['CONFIRMED', 'SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].map(s => {
                        const count = appointments.filter(a => a.status === s).length
                        const pct = Math.round((count / (appointments.length || 1)) * 100)
                        const colors = {
                          CONFIRMED: 'bg-emerald-500',
                          SCHEDULED: 'bg-blue-500',
                          COMPLETED: 'bg-slate-500',
                          CANCELLED: 'bg-rose-500',
                          NO_SHOW: 'bg-amber-500'
                        }
                        return (
                          <div key={s} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-bold text-slate-700">{s}</span>
                              <span className="font-bold text-slate-500">{count} ({pct}%)</span>
                            </div>
                            <div className="h-3 bg-slate-200/80 rounded-full overflow-hidden">
                              <div className={`h-full ${colors[s]} rounded-full transition-all`} style={{ width: `${pct}%` }}></div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Doctor utilization */}
                  <div className="p-5 bg-[#F8FAFC] rounded-2xl border border-slate-200">
                    <h3 className="font-bold text-sm text-slate-900 mb-4">Doctor Consultation Volume</h3>
                    <div className="space-y-3">
                      {(() => {
                        const counts = {}
                        appointments.forEach(a => { counts[a.doctorName] = (counts[a.doctorName] || 0) + 1 })
                        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
                        const max = sorted[0]?.[1] || 1
                        if (sorted.length === 0) return <p className="text-xs text-slate-400">No data</p>
                        return sorted.map(([name, count]) => (
                          <div key={name} className="flex items-center gap-3 text-xs">
                            <span className="w-36 truncate font-bold text-slate-800">{name}</span>
                            <div className="flex-1 h-3 bg-slate-200/80 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(count / max) * 100}%` }}></div>
                            </div>
                            <span className="font-bold text-slate-700 w-12 text-right">{count} visits</span>
                          </div>
                        ))
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ================= DOCTOR DETAILS MODAL ================= */}
      {viewDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setViewDoctor(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">Doctor Credentialing Review</h3>
              <button onClick={() => setViewDoctor(null)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="flex items-center gap-4">
                <img
                  src={getDoctorPhoto(viewDoctor.name, viewDoctor.specialization, viewDoctor.gender)}
                  alt={viewDoctor.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-200 shadow-md"
                />
                <div>
                  <h4 className="font-bold text-base text-slate-900">{viewDoctor.name}</h4>
                  <p className="text-slate-500">{viewDoctor.email}</p>
                  <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${doctorStatusBadge(viewDoctor.status)}`}>
                    {viewDoctor.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <p className="text-slate-400 font-semibold">Specialization</p>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{viewDoctor.specialization}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold">Experience</p>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{viewDoctor.experience} Years</p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold">Consultation Fee</p>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">₹{viewDoctor.consultationFee || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold">Current Availability</p>
                  <p className="font-bold text-emerald-700 text-sm mt-0.5">{viewDoctor.isAvailable ? 'Available' : 'Unavailable'}</p>
                </div>
              </div>

              {viewDoctor.bio && (
                <div>
                  <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">Doctor Bio</p>
                  <p className="p-3 bg-slate-50 rounded-xl text-slate-600 leading-relaxed">{viewDoctor.bio}</p>
                </div>
              )}

              {viewDoctor.certificationPath ? (
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-blue-900">Medical Degree Certificate</p>
                    <p className="text-[11px] text-blue-600 mt-0.5">Uploaded file available for verification</p>
                  </div>
                  <button
                    onClick={() => viewCertification(viewDoctor.certificationPath.split('/').pop())}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm text-xs"
                  >
                    View Document &rarr;
                  </button>
                </div>
              ) : (
                <p className="text-slate-400 italic">No degree certificate uploaded</p>
              )}
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setViewDoctor(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Close
              </button>
              {viewDoctor.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => approveDoctor(viewDoctor.id)}
                    disabled={updatingId === viewDoctor.id}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md"
                  >
                    Approve Doctor
                  </button>
                  <button
                    onClick={() => rejectDoctor(viewDoctor.id)}
                    disabled={updatingId === viewDoctor.id}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs border border-rose-200"
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
