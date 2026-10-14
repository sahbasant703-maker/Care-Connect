import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './services/authContext'
import Login from './pages/Login'
import Register from './pages/Register'
import RegisterDoctor from './pages/RegisterDoctor'
import PatientDashboard from './pages/PatientDashboard'
import BookAppointment from './pages/BookAppointment'
import DoctorDashboard from './pages/DoctorDashboard'
import AdminDashboard from './pages/AdminDashboard'

/**
 * Root application component with routing and authentication context.
 */
function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="loading-screen">Loading...</div>
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/register-doctor" element={user ? <Navigate to="/" replace /> : <RegisterDoctor />} />
      <Route
        path="/patient/dashboard"
        element={
          user?.role === 'PATIENT' ? (
            <PatientDashboard />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/patient/book"
        element={
          user?.role === 'PATIENT' ? (
            <BookAppointment />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/doctor/*"
        element={
          user?.role === 'DOCTOR' ? (
            <DoctorDashboard />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/admin/*"
        element={
          user?.role === 'ADMIN' ? (
            <AdminDashboard />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="/" element={<Navigate to={user ? `/${user.role.toLowerCase()}/dashboard` : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

/**
 * Main App component wrapped with AuthProvider.
 */
function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App