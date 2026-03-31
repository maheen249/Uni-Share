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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      console.log('Profile fetch:', { data, error })
      if (data) setProfile(data)
    } catch (err) {
      console.error('Profile fetch failed:', err)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Session:', session ? 'exists' : 'none')
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id).then(() => setLoading(false))
      } else {
        setLoading(false)
      }
    }).catch(err => {
      console.error('Session error:', err)
      setLoading(false)
    })

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

    return () => subscription.unsubscribe()
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
