import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Resources from './pages/Resources'
import Donate from './pages/Donate'
import Mentorship from './pages/Mentorship'
import MyDonations from './pages/MyDonations'
import MyRequests from './pages/MyRequests'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
  return user ? children : <Navigate to="/login" />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
  return !user ? children : <Navigate to="/dashboard" />
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      {user && <Navbar />}
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
        <Route path="/donate" element={<ProtectedRoute><Donate /></ProtectedRoute>} />
        <Route path="/mentorship" element={<ProtectedRoute><Mentorship /></ProtectedRoute>} />
        <Route path="/my-donations" element={<ProtectedRoute><MyDonations /></ProtectedRoute>} />
        <Route path="/my-requests" element={<ProtectedRoute><MyRequests /></ProtectedRoute>} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  )
}
