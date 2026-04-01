import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { db } from '../lib/db'
import { useAuth } from '../context/AuthContext'
import { Gift, Upload, X } from 'lucide-react'

const categories = [
  { value: 'notes', label: 'Notes' },
  { value: 'question_papers', label: 'Question Papers' },
  { value: 'books', label: 'Books' },
  { value: 'stationery', label: 'Stationery' },
  { value: 'drafting_tools', label: 'Drafting Tools' },
  { value: 'other', label: 'Other' },
]

export default function Donate() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '', description: '', category: 'notes', tags: '', semester: '', subject: ''
  })
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.category) {
      return setError('Title and category are required')
    }
    if (!user) {
      return setError('You must be logged in to donate. Please logout and login again.')
    }

    setLoading(true)
    setError('')

    try {
      let fileUrl = null

      // Upload file to Supabase Storage if provided
      if (file) {
        try {
          const fileExt = file.name.split('.').pop()
          const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
          const { data: uploadData, error: uploadError } = await db.uploadFile('resources', fileName, file)

          if (uploadError) {
            console.error('[Donate] Upload failed:', uploadError)
            setError('File upload failed: ' + uploadError.message + '. Saving without file...')
          } else {
            fileUrl = uploadData.publicUrl
          }
        } catch (uploadErr) {
          console.error('[Donate] Upload exception:', uploadErr)
          setError('File upload failed. Saving without file...')
        }
      }

      // Insert resource
      const { data: insertResult, error: insertError } = await db.insert('resources', {
        title: form.title,
        description: form.description,
        category: form.category,
        donor_id: user.id,
        file_url: fileUrl,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        semester: form.semester ? parseInt(form.semester) : null,
        subject: form.subject || null
      })

      console.log('[Donate] Insert result:', JSON.stringify({ insertResult, insertError }))

      if (insertError) {
        setError('Failed to donate: ' + insertError.message)
      } else {
        alert('Resource donated successfully!')
        navigate('/my-donations')
      }
    } catch (err) {
      console.error('[Donate] Error:', err)
      setError('Something went wrong: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Gift className="w-6 h-6 text-blue-600" />
          Donate a Resource
        </h1>
        <p className="text-gray-500 mt-1">Share your academic materials with juniors who need them</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={update('title')}
              placeholder="e.g. Data Structures Notes - Unit 1 to 5"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm({ ...form, category: value })}
                  className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors
                    ${form.category === value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={update('description')}
              placeholder="Describe the resource — condition, content coverage, etc."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
              <input
                type="text"
                value={form.subject}
                onChange={update('subject')}
                placeholder="e.g. DBMS"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Semester</label>
              <select
                value={form.semester}
                onChange={update('semester')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              >
                <option value="">Select</option>
                {[1,2,3,4,5,6,7,8].map(n => (
                  <option key={n} value={n}>Semester {n}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags</label>
            <input
              type="text"
              value={form.tags}
              onChange={update('tags')}
              placeholder="Comma-separated, e.g. midterm, handwritten, 2024"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* File upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Attach File (PDF, DOC, images, ZIP — max 10MB)
            </label>
            {file ? (
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Upload className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-blue-700 flex-1 truncate">{file.name}</span>
                <button type="button" onClick={() => setFile(null)} className="text-blue-400 hover:text-blue-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors">
                <Upload className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-500">Click to upload a file</span>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.zip,.rar"
                  className="hidden"
                />
              </label>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Uploading...' : 'Donate Resource'}
          </button>
        </form>
      </div>
    </div>
  )
}
