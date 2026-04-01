import { useState, useEffect } from 'react'
import { db } from '../lib/db'
import { useAuth } from '../context/AuthContext'
import { Package, Check, X, Clock, FileText } from 'lucide-react'

export default function MyDonations() {
  const { user } = useAuth()
  const [donations, setDonations] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('donations')

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: donationData } = await db.query('resources', { eq: { donor_id: user.id }, order: 'created_at.desc' })
        setDonations(donationData || [])

        const myResourceIds = (donationData || []).map(d => d.id)
        if (myResourceIds.length > 0) {
          const { data: requestData } = await db.queryIn('resource_requests', 'resource_id', myResourceIds)

          const requesterIds = [...new Set((requestData || []).map(r => r.requester_id))]
          let profilesMap = {}
          if (requesterIds.length > 0) {
            const { data: profiles } = await db.queryIn('profiles', 'id', requesterIds, { select: 'id, name, email, department' })
            ;(profiles || []).forEach(p => { profilesMap[p.id] = p })
          }
          const resourceMap = {}
          ;(donationData || []).forEach(d => { resourceMap[d.id] = { title: d.title, category: d.category } })

          setRequests((requestData || []).map(r => ({
            ...r,
            profiles: profilesMap[r.requester_id] || null,
            resources: resourceMap[r.resource_id] || null
          })))
        }
      } catch (err) {
        console.error('MyDonations error:', err)
      }
      setLoading(false)
    }
    fetchData()
  }, [user.id])

  const handleRequest = async (requestId, status, resourceId) => {
    const { error } = await db.update('resource_requests', { status }, { eq: { id: requestId } })

    if (!error && status === 'accepted') {
      await db.update('resources', { status: 'claimed' }, { eq: { id: resourceId } })
    }

    window.location.reload()
  }

  const categoryLabels = {
    notes: 'Notes', question_papers: 'Question Papers', stationery: 'Stationery',
    drafting_tools: 'Drafting Tools', books: 'Books', other: 'Other'
  }

  const statusBadge = {
    available: 'bg-green-50 text-green-700',
    claimed: 'bg-gray-100 text-gray-500'
  }

  const pendingRequests = requests.filter(r => r.status === 'pending')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="w-6 h-6 text-blue-600" />
          My Donations
        </h1>
        <p className="text-gray-500 mt-1">Manage your donated resources and incoming requests</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
        <button
          onClick={() => setActiveTab('donations')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'donations' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Donations ({donations.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'requests' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Requests {pendingRequests.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
              {pendingRequests.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'donations' ? (
        donations.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">You haven't donated anything yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {donations.map((d) => (
              <div key={d.id} className="bg-white rounded-xl border border-gray-100 p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{d.title}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {categoryLabels[d.category]}
                    {d.subject && ` · ${d.subject}`}
                    {d.semester && ` · Sem ${d.semester}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {d.file_url && <FileText className="w-4 h-4 text-gray-400" />}
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusBadge[d.status]}`}>
                    {d.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        requests.length === 0 ? (
          <div className="text-center py-20">
            <Clock className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No incoming requests yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {r.profiles?.name || 'Someone'} wants{' '}
                      <span className="text-blue-600">{r.resources?.title || 'a resource'}</span>
                    </p>
                    {r.message && (
                      <p className="text-sm text-gray-500 mt-1 italic">"{r.message}"</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {r.profiles?.department && `${r.profiles.department} · `}
                      {r.profiles?.email}
                    </p>
                  </div>
                  {r.status === 'pending' ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRequest(r.id, 'accepted', r.resource_id)}
                        className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg"
                        title="Accept"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRequest(r.id, 'rejected', r.resource_id)}
                        className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg"
                        title="Reject"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize
                      ${r.status === 'accepted' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {r.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
