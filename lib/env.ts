import Constants from 'expo-constants'

type Extra = {
  supabaseUrl?: string
  supabaseAnonKey?: string
  geminiApiKey?: string
}

function readExtra(): Extra {
  return (Constants.expoConfig?.extra ?? {}) as Extra
}

export function getSupabaseUrl(): string {
  const extra = readExtra()
  return (
    extra.supabaseUrl ||
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ''
  )
}

export function getSupabaseAnonKey(): string {
  const extra = readExtra()
  return (
    extra.supabaseAnonKey ||
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  )
}

export function getGeminiKey(): string {
  const extra = readExtra()
  return extra.geminiApiKey || process.env.EXPO_PUBLIC_GEMINI_API_KEY || ''
}

export function isSupabaseConfigured() {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey())
}
