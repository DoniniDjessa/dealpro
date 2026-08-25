import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { tables } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import { useFormNonce } from '@/components/FormDrawer'
import type { Appointment, CashEntry, Contact, Demand, MatchRow, Offer } from '@/lib/types'

function useRows<T>(table: string, extra?: (query: ReturnType<typeof supabase.from>) => unknown) {
  const { user } = useAuth()
  const nonce = useFormNonce()
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!user?.id) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    let query = supabase.from(table).select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    if (extra) query = extra(query as never) as typeof query
    const { data, error: err } = await query
    if (err) setError(err.message)
    else {
      setError(null)
      setItems((data as T[]) ?? [])
    }
    setLoading(false)
  }, [user?.id, table, extra, nonce])

  useEffect(() => {
    void reload()
  }, [reload])

  return { items, loading, error, reload }
}

export function useOffers() {
  return useRows<Offer>(tables.offers)
}

export function useDemands() {
  const { user } = useAuth()
  const nonce = useFormNonce()
  const [items, setItems] = useState<Demand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!user?.id) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error: err } = await supabase
      .from(tables.demands)
      .select('*, contact:dealpro_contacts(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (err) setError(err.message)
    else {
      setError(null)
      setItems((data as Demand[]) ?? [])
    }
    setLoading(false)
  }, [user?.id, nonce])

  useEffect(() => {
    void reload()
  }, [reload])

  return { items, loading, error, reload }
}

export function useContacts() {
  return useRows<Contact>(tables.contacts)
}

export function useCashEntries() {
  return useRows<CashEntry>(tables.cashEntries)
}

export function useAppointments() {
  const { user } = useAuth()
  const nonce = useFormNonce()
  const [items, setItems] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!user?.id) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error: err } = await supabase
      .from(tables.appointments)
      .select('*, contact:dealpro_contacts(*)')
      .eq('user_id', user.id)
      .order('starts_at', { ascending: true })
    if (err) setError(err.message)
    else {
      setError(null)
      setItems((data as Appointment[]) ?? [])
    }
    setLoading(false)
  }, [user?.id, nonce])

  useEffect(() => {
    void reload()
  }, [reload])

  return { items, loading, error, reload }
}

export function useMatches() {
  const { user } = useAuth()
  const nonce = useFormNonce()
  const [items, setItems] = useState<MatchRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!user?.id) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error: err } = await supabase
      .from(tables.matches)
      .select('*, offer:dealpro_offers(*), demand:dealpro_demands(*)')
      .eq('user_id', user.id)
      .order('score', { ascending: false })
    if (err) setError(err.message)
    else {
      setError(null)
      setItems((data as MatchRow[]) ?? [])
    }
    setLoading(false)
  }, [user?.id, nonce])

  useEffect(() => {
    void reload()
  }, [reload])

  return { items, loading, error, reload }
}
