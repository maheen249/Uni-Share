// Direct REST API wrapper for Supabase database queries
// The Supabase JS client's .from().select() hangs in some environments,
// so we use direct fetch() calls to the PostgREST API instead.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// Get the current user's access token directly from localStorage
// (bypasses the Supabase JS client which hangs in some environments)
function getAccessToken() {
  try {
    // Supabase stores auth in localStorage with key: sb-<project-ref>-auth-token
    const keys = Object.keys(localStorage)
    const authKey = keys.find(k => k.includes('auth-token'))
    if (authKey) {
      const authData = JSON.parse(localStorage.getItem(authKey))
      if (authData?.access_token) return authData.access_token
    }
  } catch {
    // Ignore parse errors
  }
  return SUPABASE_KEY
}

// Generic query function
async function query(table, { select = '*', filters = {}, order, limit, eq = {} } = {}) {
  const params = new URLSearchParams()
  params.set('select', select)

  for (const [key, value] of Object.entries(eq)) {
    params.set(key, `eq.${value}`)
  }

  for (const [key, value] of Object.entries(filters)) {
    params.set(key, value)
  }

  if (order) {
    params.set('order', order)
  }
  if (limit) {
    params.set('limit', limit)
  }

  const token = getAccessToken()

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`
    }
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    return { data: null, error: { message: err.message || `HTTP ${res.status}` } }
  }

  const data = await res.json()
  return { data, error: null }
}

// Insert function
async function insert(table, row) {
  const token = getAccessToken()

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(row)
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    return { data: null, error: { message: err.message || err.error || `HTTP ${res.status}` } }
  }

  const data = await res.json()
  return { data, error: null }
}

// Update function
async function update(table, row, { eq = {} } = {}) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(eq)) {
    params.set(key, `eq.${value}`)
  }

  const token = getAccessToken()

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(row)
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    return { data: null, error: { message: err.message || `HTTP ${res.status}` } }
  }

  const data = await res.json()
  return { data, error: null }
}

// Query with IN filter (for fetching by multiple IDs)
async function queryIn(table, column, values, { select = '*' } = {}) {
  if (!values || values.length === 0) return { data: [], error: null }

  const params = new URLSearchParams()
  params.set('select', select)
  params.set(column, `in.(${values.join(',')})`)

  const token = getAccessToken()

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`
    }
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    return { data: null, error: { message: err.message || `HTTP ${res.status}` } }
  }

  const data = await res.json()
  return { data, error: null }
}

// Search with OR/ILIKE
async function search(table, { select = '*', searchFields = [], searchTerm = '', eq = {}, order, neq = {} } = {}) {
  const params = new URLSearchParams()
  params.set('select', select)

  for (const [key, value] of Object.entries(eq)) {
    params.set(key, `eq.${value}`)
  }

  for (const [key, value] of Object.entries(neq)) {
    params.set(key, `neq.${value}`)
  }

  if (searchTerm && searchFields.length > 0) {
    const orClauses = searchFields.map(f => `${f}.ilike.%${searchTerm}%`).join(',')
    params.set('or', `(${orClauses})`)
  }

  if (order) {
    params.set('order', order)
  }

  const token = getAccessToken()

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`
    }
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    return { data: null, error: { message: err.message || `HTTP ${res.status}` } }
  }

  const data = await res.json()
  return { data, error: null }
}

// Upload file to storage
async function uploadFile(bucket, path, file) {
  const token = getAccessToken()

  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey': SUPABASE_KEY,
    },
    body: file
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    return { data: null, error: { message: err.message || `HTTP ${res.status}` } }
  }

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
  return { data: { path, publicUrl }, error: null }
}

export const db = { query, queryIn, insert, update, search, uploadFile }
