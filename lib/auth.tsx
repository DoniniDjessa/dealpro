import { Session, User } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { looksLikeEmail, normalizePseudo, validatePseudo } from '@/lib/pseudo'
import { tables } from '@/lib/db'
import type { Profile } from '@/lib/types'

type AuthContextValue = {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (identifier: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, pseudo: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateProfile: (patch: Partial<Profile>) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session ?? null)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
    })
    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const userId = session?.user?.id
    if (!userId) {
      setProfile(null)
      return
    }
    const ensureProfile = async () => {
      const { data } = await supabase.from(tables.profiles).select('*').eq('id', userId).maybeSingle()
      if (data) {
        setProfile(data as Profile)
        return
      }
      const meta = session?.user?.user_metadata?.pseudo as string | undefined
      const fallback = (session?.user?.email || 'owner').split('@')[0].toLowerCase()
      const pseudo = (meta || fallback).replace(/[^a-z0-9._]/g, '').slice(0, 24) || 'owner'
      const { data: created } = await supabase
        .from(tables.profiles)
        .upsert({ id: userId, pseudo, display_name: meta || fallback })
        .select('*')
        .maybeSingle()
      setProfile((created as Profile | null) ?? null)
    }
    void ensureProfile()
  }, [session?.user?.id, session?.user?.email, session?.user?.user_metadata?.pseudo])

  const refreshProfile = async () => {
    const userId = session?.user?.id
    if (!userId) return
    const { data } = await supabase.from(tables.profiles).select('*').eq('id', userId).maybeSingle()
    setProfile((data as Profile | null) ?? null)
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      refreshProfile,
      updateProfile: async (patch) => {
        const userId = session?.user?.id
        if (!userId) return { error: 'Non connecté.' }
        const { error } = await supabase.from(tables.profiles).update(patch).eq('id', userId)
        if (error) return { error: error.message }
        await refreshProfile()
        return { error: null }
      },
      signIn: async (identifier, password) => {
        const raw = identifier.trim()
        if (!raw) return { error: 'Email ou pseudo requis.' }

        let email = raw
        if (!looksLikeEmail(raw)) {
          const { data, error } = await supabase.rpc('dealpro_email_for_pseudo', {
            p_pseudo: normalizePseudo(raw),
          })
          if (error) return { error: error.message }
          if (!data) return { error: 'Pseudo introuvable.' }
          email = String(data)
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password })
        return { error: error?.message ?? null }
      },
      signUp: async (email, password, pseudo) => {
        const handle = normalizePseudo(pseudo)
        const invalid = validatePseudo(handle)
        if (invalid) return { error: invalid }

        const { data: taken, error: takenError } = await supabase.rpc('dealpro_pseudo_taken', {
          p_pseudo: handle,
        })
        if (takenError) return { error: takenError.message }
        if (taken) return { error: 'Ce pseudo est déjà pris.' }

        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { pseudo: handle } },
        })
        return { error: error?.message ?? null }
      },
      signOut: async () => {
        await supabase.auth.signOut()
      },
    }),
    [session, loading, profile]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
