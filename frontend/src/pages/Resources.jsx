import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Search, Filter, FileText, BookOpen, Wrench, PenTool, Package, Tag, Download, MessageSquare } from 'lucide-react'

const categories = [
  { value: 'all', label: 'All Resources', icon: Package },
  { value: 'notes', label: 'Notes', icon: FileText },
  { value: 'question_papers', label: 'Question Papers', icon: BookOpen },
  { value: 'books', label: 'Books', icon: BookOpen },
  { value: 'stationery', label: 'Stationery', icon: PenTool },
  { value: 'drafting_tools', label: 'Drafting Tools', icon: Wrench },
  { value: 'other', label: 'Other', icon: Tag },
]

export default function Resources() {
  const { user } = useAuth()
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [requestModal, setRequestModal] = useState(null)
  const [requestMessage, setRequestMessage] = useState('')
  const [sending, setSending] = useState(false)

  const fetchResources = async () => {
    setLoading(true)
    let query = supabase
      .from('resources')
      .select('*')
      .eq('status', 'available')
      .order('created_at', { ascending: false })

    if (category !== 'all') query = query.eq('category', category)
    if (search.trim()) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,subject.ilike.%${search}%`)
    }

    const { data } = await query
    const donorIds = [...new Set((data || []).map(r => r.donor_id))]
    let profilesMap = {}
    if (donorIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, name, department, batch_year').in('id', donorIds)
      ;(profiles || []).forEach(p => { profilesMap[p.id] = p })
    }
    setResources((data || []).map(r => ({ ...r, profiles: profilesMap[r.donor_id] || null })))
    setLoading(false)
  }

  useEffect(() => {
    fetchResources()
  }, [category])

  useEffect(() => {
    const timer = setTimeout(fetchResources, 400)
    return () => clearTimeout(timer)
  }, [search])

  const handleRequest = async () => {
    if (!requestModal) return
    setSending(true)
    const { error } = await supabase.from('resource_requests').insert({
      resource_id: requestModal.id,
      requester_id: user.id,
      message: requestMessage
    })
    setSending(false)
    if (!error) {
      setRequestModal(null)
      setRequestMessage('')
      alert('Request sent successfully!')
    } else {
      alert(error.message || 'Failed to send request')
    }
  }

  const categoryLabels = Object.fromEntries(categories.map(c => [c.value, c.label]))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Browse Resources</h1>
        <p className="text-gray-500 mt-1">Find academic materials shared by your college community</p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, subject, description..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {categories.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setCategory(value)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
              ${category === value
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No resources found</p>
          <p className="text-gray-400 text-sm mt-1">Try a different search or category</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
                  {categoryLabels[r.category] || r.category}
                </span>
                {r.semester && (
                  <span className="text-xs text-gray-500">Sem {r.semester}</span>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{r.title}</h3>
              {r.subject && <p className="text-sm text-blue-600 mb-1">{r.subject}</p>}
              {r.description && (
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{r.description}</p>
              )}
              {r.tags && r.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {r.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                <p className="text-xs text-gray-400">
                  by {r.profiles?.name || 'Anonymous'}
                  {r.profiles?.department && ` · ${r.profiles.department}`}
                </p>
                <div className="flex items-center gap-2">
                  {r.file_url && (
                    <a
                      href={r.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Download file"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                  {r.donor_id !== user?.id && (
                    <button
                      onClick={() => setRequestModal(r)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Request
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Request Modal */}
      {requestModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Request Resource</h3>
            <p className="text-sm text-gray-500 mb-4">
              Requesting: <strong>{requestModal.title}</strong>
            </p>
            <textarea
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              placeholder="Add a message to the donor (optional)..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setRequestModal(null); setRequestMessage('') }}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRequest}
                disabled={sending}
                className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
