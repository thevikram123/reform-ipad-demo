import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getMyProfile, registerAssessor, signInWithAccessId, supabase } from '../lib/supabase'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    const apply = async (nextUser) => {
      if (!alive) return
      setUser(nextUser || null)
      if (!nextUser) { setProfile(null); setLoading(false); return }
      try { setProfile(await getMyProfile(nextUser.id)) }
      finally { if (alive) setLoading(false) }
    }
    supabase.auth.getUser().then(({ data }) => apply(data.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => apply(session?.user))
    return () => { alive = false; listener.subscription.unsubscribe() }
  }, [])

  const value = useMemo(() => ({
    user, profile, loading,
    signIn: signInWithAccessId,
    register: registerAssessor,
    signOut: () => supabase.auth.signOut(),
  }), [user, profile, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

