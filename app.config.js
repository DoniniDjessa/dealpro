const fs = require('fs')
const path = require('path')

function loadEnvLocal() {
  const file = path.join(__dirname, '.env.local')
  const out = {}
  if (!fs.existsSync(file)) return out
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

const file = loadEnvLocal()
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  file.EXPO_PUBLIC_SUPABASE_URL ||
  file.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  file.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  file.NEXT_PUBLIC_SUPABASE_ANON_KEY
const geminiKey =
  process.env.EXPO_PUBLIC_GEMINI_API_KEY || file.EXPO_PUBLIC_GEMINI_API_KEY

if (supabaseUrl) process.env.EXPO_PUBLIC_SUPABASE_URL = supabaseUrl
if (supabaseAnonKey) process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = supabaseAnonKey
if (geminiKey) process.env.EXPO_PUBLIC_GEMINI_API_KEY = geminiKey

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[dealpro] Missing Supabase env. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.'
  )
}

module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    supabaseUrl: supabaseUrl || undefined,
    supabaseAnonKey: supabaseAnonKey || undefined,
    geminiApiKey: geminiKey || undefined,
  },
})
