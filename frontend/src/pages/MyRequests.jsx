import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { ClipboardList, Clock, Check, X } from 'lucide-react'

export default function MyRequests() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRequests() {
      const { data } = await supabase
        .from('resource_requests')
        .select('*, resources(title, category, profiles(name))')
        .eq('requester_id', user.id)
        .order('created_at', { ascending: false })
      setRequests(data || [])
      setLoading(false)
    }
    fetchRequests()
  }, [user.id])

  const categoryLabels = {
    notes: 'Notes', question_papers: 'Question Papers', stationery: 'Stationery',
    drafting_tools: 'Drafting Tools', books: 'Books', other: 'Other'
  }

  const statusConfig = {
    pending: { icon: Clock, color: 'text-amber-600 bg-amber-50', label: 'Pending' },
    accepted: { icon: Check, color: 'text-green-600 bg-green-50', label: 'Accepted' },
    rejected: { icon: X, color: 'text-red-600 bg-red-50', label: 'Rejected' },
  }

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
          <ClipboardList className="w-6 h-6 text-blue-600" />
          My Requests
        </h1>
        <p className="text-gray-500 mt-1">Track the status of resources you've requested</p>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-20">
          <ClipboardList className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No requests yet</p>
          <p className="text-gray-400 text-sm mt-1">Browse resources and request what you need</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => {
            const status = statusConfig[r.status] || statusConfig.pending
            const StatusIcon = status.icon
            return (
              <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{r.resources?.title || 'Unknown Resource'}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {categoryLabels[r.resources?.category] || ''}
                    {r.resources?.profiles?.name && ` · Donated by ${r.resources.profiles.name}`}
                  </p>
                  {r.message && (
                    <p className="text-xs text-gray-400 mt-1 italic">Your message: "{r.message}"</p>
                  )}
                </div>
                <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium ${status.color}`}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  {status.label}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
