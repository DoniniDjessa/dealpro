const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const file = path.join(__dirname, '..', '.env.local')
if (!fs.existsSync(file)) {
  console.error('Missing .env.local')
  process.exit(1)
}

const env = {}
for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eq = trimmed.indexOf('=')
  if (eq < 0) continue
  let value = trimmed.slice(eq + 1).trim()
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1)
  }
  env[trimmed.slice(0, eq).trim()] = value
}

const url = env.EXPO_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL
const key = env.EXPO_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const gemini = env.EXPO_PUBLIC_GEMINI_API_KEY
if (!url || !key) {
  console.error('Missing Supabase URL or anon key in .env.local')
  process.exit(1)
}

const environments = ['preview', 'production', 'development']
const vars = [
  ['EXPO_PUBLIC_SUPABASE_URL', url],
  ['EXPO_PUBLIC_SUPABASE_ANON_KEY', key],
]
if (gemini) vars.push(['EXPO_PUBLIC_GEMINI_API_KEY', gemini])

let failed = false
for (const environment of environments) {
  for (const [name, value] of vars) {
    const result = spawnSync(
      'npx',
      [
        'eas',
        'env:set',
        environment,
        '--name',
        name,
        '--value',
        value,
        '--visibility',
        'sensitive',
        '--type',
        'string',
        '--non-interactive',
      ],
      { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', shell: true }
    )
    const output = `${result.stdout || ''}${result.stderr || ''}`.replace(value, '[redacted]')
    if (result.status !== 0) {
      failed = true
      console.error(`Failed ${name} on ${environment}`)
      console.error(output.trim())
    } else {
      console.log(`Set ${name} on ${environment}`)
    }
  }
}

process.exit(failed ? 1 : 0)
