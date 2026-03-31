import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Users, Plus, GraduationCap, Mail, X } from 'lucide-react'

export default function Mentorship() {
  const { user, profile } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', topic: '', contactEmail: '' })
  const [submitting, setSubmitting] = useState(false)

  const fetchPosts = async () => {
    try {
      const { data: postsData } = await supabase
        .from('mentorship_posts')
        .select('*')
        .order('created_at', { ascending: false })

      // Fetch alumni profiles separately
      const alumniIds = [...new Set((postsData || []).map(p => p.alumni_id))]
      let profilesMap = {}
      if (alumniIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name, department, batch_year')
          .in('id', alumniIds)
        ;(profilesData || []).forEach(p => { profilesMap[p.id] = p })
      }

      setPosts((postsData || []).map(p => ({ ...p, profiles: profilesMap[p.alumni_id] || null })))
    } catch (err) {
      console.error('Mentorship fetch error:', err)
    }
    setLoading(false)
  }

  useEffect(() => { fetchPosts() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title) return
    setSubmitting(true)
    const { error } = await supabase.from('mentorship_posts').insert({
      alumni_id: user.id,
      title: form.title,
      description: form.description,
      topic: form.topic,
      contact_email: form.contactEmail || profile?.email || ''
    })
    setSubmitting(false)
    if (!error) {
      setForm({ title: '', description: '', topic: '', contactEmail: '' })
      setShowForm(false)
      fetchPosts()
    }
  }

  const topicColors = {
    'Career Guidance': 'bg-purple-50 text-purple-700',
    'Technical Skills': 'bg-blue-50 text-blue-700',
    'Higher Studies': 'bg-emerald-50 text-emerald-700',
    'Interview Prep': 'bg-amber-50 text-amber-700',
    'Research': 'bg-rose-50 text-rose-700',
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Alumni Mentorship
          </h1>
          <p className="text-gray-500 mt-1">Connect with alumni for career and academic guidance</p>
        </div>
        {profile?.role === 'alumni' && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Offer Mentorship
          </button>
        )}
      </div>

      {/* Create post form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Create Mentorship Post</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Offering guidance on cracking GATE exam"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Topic</label>
              <select
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              >
                <option value="">Select a topic</option>
                <option>Career Guidance</option>
                <option>Technical Skills</option>
                <option>Higher Studies</option>
                <option>Interview Prep</option>
                <option>Research</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe how you can help students..."
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Email</label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                placeholder="your.email@example.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Posting...' : 'Post Mentorship Offer'}
            </button>
          </form>
        </div>
      )}

      {/* Posts list */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20">
          <GraduationCap className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No mentorship posts yet</p>
          {profile?.role === 'alumni' && (
            <p className="text-gray-400 text-sm mt-1">Be the first to offer guidance!</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{post.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-500">
                      {post.profiles?.name || 'Alumni'}
                    </span>
                    {post.profiles?.department && (
                      <span className="text-xs text-gray-400">· {post.profiles.department}</span>
                    )}
                    {post.profiles?.batch_year && (
                      <span className="text-xs text-gray-400">· Batch {post.profiles.batch_year}</span>
                    )}
                  </div>
                </div>
                {post.topic && (
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${topicColors[post.topic] || 'bg-gray-100 text-gray-600'}`}>
                    {post.topic}
                  </span>
                )}
              </div>
              {post.description && (
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{post.description}</p>
              )}
              {post.contact_email && (
                <a
                  href={`mailto:${post.contact_email}`}
                  className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Mail className="w-4 h-4" />
                  Reach out
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
