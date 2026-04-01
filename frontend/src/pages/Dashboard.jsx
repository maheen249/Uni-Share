import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { db } from '../lib/db'
import { BookOpen, Gift, Users, Package, ArrowRight, TrendingUp } from 'lucide-react'

export default function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ resources: 0, users: 0, donations: 0, mentors: 0 })
  const [recentResources, setRecentResources] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Force stop loading after 5 seconds no matter what
    const timeout = setTimeout(() => {
      console.log('[Dashboard] Timeout fired - forcing loading=false')
      setLoading(false)
    }, 5000)

    async function fetchData() {
      try {
        const { data: allResources } = await db.query('resources', { eq: { status: 'available' }, order: 'created_at.desc' })
        const { data: allProfiles } = await db.query('profiles', { select: 'id, role' })

        setStats({
          resources: (allResources || []).length,
          users: (allProfiles || []).length,
          donations: (allResources || []).length,
          mentors: (allProfiles || []).filter(p => p.role === 'alumni').length
        })
        setRecentResources((allResources || []).slice(0, 5))
      } catch (err) {
        console.error('Dashboard error:', err)
      }
      setLoading(false)
    }
    fetchData()

    return () => clearTimeout(timeout)
  }, [])

  const statCards = [
    { label: 'Available Resources', value: stats.resources, icon: BookOpen, color: 'blue', link: '/resources' },
    { label: 'Total Donations', value: stats.donations, icon: Gift, color: 'emerald', link: '/my-donations' },
    { label: 'Community Members', value: stats.users, icon: Users, color: 'purple', link: '#' },
    { label: 'Alumni Mentors', value: stats.mentors, icon: TrendingUp, color: 'amber', link: '/mentorship' },
  ]

  const categoryLabels = {
    notes: 'Notes', question_papers: 'Question Papers', stationery: 'Stationery',
    drafting_tools: 'Drafting Tools', books: 'Books', other: 'Other'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {profile?.name || 'User'}!
        </h1>
        <p className="text-gray-500 mt-1">
          {profile?.role === 'alumni'
            ? 'Help shape the next generation through mentorship and resource sharing.'
            : 'Find resources you need or share what you no longer use.'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, link }) => (
          <Link
            key={label}
            to={link}
            className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${color}-100`}>
                <Icon className={`w-5 h-5 text-${color}-600`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <Link
          to="/donate"
          className="bg-blue-600 text-white rounded-xl p-6 hover:bg-blue-700 transition-colors"
        >
          <Gift className="w-8 h-8 mb-3" />
          <h3 className="text-lg font-semibold">Donate a Resource</h3>
          <p className="text-blue-100 text-sm mt-1">Share notes, books, stationery with juniors</p>
          <div className="flex items-center gap-1 mt-4 text-sm font-medium">
            Get started <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
        <Link
          to="/resources"
          className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
        >
          <BookOpen className="w-8 h-8 mb-3 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">Browse Resources</h3>
          <p className="text-gray-500 text-sm mt-1">Find what you need by category or search</p>
          <div className="flex items-center gap-1 mt-4 text-sm font-medium text-blue-600">
            Explore <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      </div>

      {/* Recent resources */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recently Added Resources</h2>
          <Link to="/resources" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View all
          </Link>
        </div>
        {recentResources.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <Package className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p>No resources yet. Be the first to donate!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentResources.map((r) => (
              <div key={r.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900">{r.title}</p>
                  <p className="text-sm text-gray-500">
                    {categoryLabels[r.category] || r.category}
                    {r.subject && ` · ${r.subject}`}
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 bg-green-50 text-green-700 rounded-full font-medium">
                  Available
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
