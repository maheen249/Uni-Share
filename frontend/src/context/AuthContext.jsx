import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { rollToEmail, parseRollNumber } from '../lib/rollNumber'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (data) setProfile(data)
    } catch (err) {
      // Profile fetch failed silently
    }
  }

  useEffect(() => {
    // Force stop loading after 3 seconds no matter what
    const timeout = setTimeout(() => setLoading(false), 3000)

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      }
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })

    // Listen for auth changes (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async ({ rollNumber, password, name, role, personalEmail }) => {
    const parsed = parseRollNumber(rollNumber)
    if (!parsed) throw new Error('Invalid roll number format')

    const email = rollToEmail(rollNumber)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
          roll_number: parsed.rollNumber,
          department: parsed.department,
          batch_year: parsed.batchYear,
          personal_email: personalEmail || ''
        }
      }
    })
    if (error) throw error
    return data
  }

  const signIn = async ({ rollNumber, password }) => {
    const email = rollToEmail(rollNumber)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setProfile(null)
  }

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    fetchProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
