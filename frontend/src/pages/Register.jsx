import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isValidRollNumber, parseRollNumber } from '../lib/rollNumber'
import { BookOpen, Eye, EyeOff, CheckCircle } from 'lucide-react'

export default function Register() {
  const [form, setForm] = useState({
    name: '', rollNumber: '', password: '', role: 'student', personalEmail: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })
  const parsed = parseRollNumber(form.rollNumber)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!isValidRollNumber(form.rollNumber)) {
      return setError('Invalid roll number format. Example: 23D21A05F4')
    }
    if (form.password.length < 6) {
      return setError('Password must be at least 6 characters')
    }
    if (!form.name.trim()) {
      return setError('Name is required')
    }

    setLoading(true)
    try {
      await signUp({
        rollNumber: form.rollNumber,
        password: form.password,
        name: form.name,
        role: form.role,
        personalEmail: form.personalEmail
      })
      setSuccess('Registration successful! You can now login.')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-12">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">UniShare</span>
          </Link>
          <p className="mt-2 text-gray-500">Register with your college roll number.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">{success}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={update('name')}
                placeholder="Your full name"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Roll Number</label>
              <input
                type="text"
                value={form.rollNumber}
                onChange={(e) => setForm({ ...form, rollNumber: e.target.value.toUpperCase() })}
                placeholder="e.g. 23D21A05F4"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none uppercase"
                required
              />
              {/* Auto-detected info */}
              {parsed && (
                <div className="mt-2 p-2.5 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  <div className="text-xs text-green-700">
                    <p className="font-medium">Auto-detected:</p>
                    <p>Department: {parsed.department} · Batch: {parsed.batchYear} · Roll: {parsed.classRoll}</p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Personal Email (Gmail)</label>
              <input
                type="email"
                value={form.personalEmail}
                onChange={update('personalEmail')}
                placeholder="yourname@gmail.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={update('password')}
                  placeholder="Min 6 characters"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">I am a</label>
              <div className="grid grid-cols-2 gap-3">
                {['student', 'alumni'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setForm({ ...form, role })}
                    className={`py-2.5 px-4 rounded-lg border text-sm font-medium capitalize transition-colors
                      ${form.role === role
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 font-medium hover:text-blue-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
