export const REMINDER_MODES = [
  { value: 'push', label: 'Notification', hint: 'Push' },
  { value: 'alert', label: 'Alerte', hint: 'Comme un réveil' },
  { value: 'both', label: 'Les deux', hint: 'Notif + alerte' },
] as const

export const REMINDER_SOUNDS = [
  { value: 'default', label: 'Défaut' },
  { value: 'alarm', label: 'Réveil' },
  { value: 'chime', label: 'Carillon' },
  { value: 'urgent', label: 'Urgent' },
] as const

export const REMINDER_INTERVALS = [
  { value: 0, label: 'Une fois' },
  { value: 5, label: 'Toutes les 5 min' },
  { value: 15, label: 'Toutes les 15 min' },
  { value: 30, label: 'Toutes les 30 min' },
  { value: 60, label: 'Toutes les heures' },
  { value: 180, label: 'Toutes les 3 h' },
  { value: 360, label: 'Toutes les 6 h' },
  { value: 720, label: 'Toutes les 12 h' },
  { value: 1440, label: 'Tous les jours' },
  { value: 10080, label: 'Toutes les semaines' },
] as const

export const REMINDER_COUNTS = [1, 2, 3, 4, 5, 7, 10] as const

export type ReminderMode = (typeof REMINDER_MODES)[number]['value']
export type ReminderSound = (typeof REMINDER_SOUNDS)[number]['value']

export type ReminderConfig = {
  enabled: boolean
  mode: ReminderMode
  sound: ReminderSound
  start_at: string | null
  interval_minutes: number
  count: number
}

export const REMINDER_SOUND_FILES: Record<Exclude<ReminderSound, 'default'>, string> = {
  alarm: 'alarm.wav',
  chime: 'chime.wav',
  urgent: 'urgent.wav',
}

export const REMINDER_SOUND_ASSETS = {
  default: require('@/assets/sounds/alarm.wav'),
  alarm: require('@/assets/sounds/alarm.wav'),
  chime: require('@/assets/sounds/chime.wav'),
  urgent: require('@/assets/sounds/urgent.wav'),
}

export function defaultReminder(mode: ReminderMode = 'both'): ReminderConfig {
  return {
    enabled: false,
    mode,
    sound: 'alarm',
    start_at: null,
    interval_minutes: 0,
    count: 1,
  }
}

export function parseReminder(value: unknown, fallbackMode: ReminderMode = 'both'): ReminderConfig {
  const base = defaultReminder(fallbackMode)
  if (!value || typeof value !== 'object') return base
  const raw = value as Partial<ReminderConfig>
  const interval = Number(raw.interval_minutes)
  const count = Number(raw.count)
  return {
    enabled: Boolean(raw.enabled),
    mode: REMINDER_MODES.some((item) => item.value === raw.mode) ? (raw.mode as ReminderMode) : fallbackMode,
    sound: REMINDER_SOUNDS.some((item) => item.value === raw.sound)
      ? (raw.sound as ReminderSound)
      : 'alarm',
    start_at: typeof raw.start_at === 'string' && raw.start_at ? raw.start_at : null,
    interval_minutes: REMINDER_INTERVALS.some((item) => item.value === interval) ? interval : 0,
    count: REMINDER_COUNTS.includes(count as (typeof REMINDER_COUNTS)[number]) ? count : 1,
  }
}

export function reminderPayload(config: ReminderConfig): ReminderConfig | null {
  if (!config.enabled) return null
  return {
    enabled: true,
    mode: config.mode,
    sound: config.sound,
    start_at: config.start_at,
    interval_minutes: config.interval_minutes,
    count: config.interval_minutes > 0 ? config.count : 1,
  }
}

export function reminderFireDates(config: ReminderConfig, fallback: Date | null) {
  if (!config.enabled) return []
  const start = config.start_at ? new Date(config.start_at) : fallback
  if (!start || Number.isNaN(start.getTime())) return []
  const count = config.interval_minutes > 0 ? Math.min(Math.max(config.count, 1), 10) : 1
  const intervalMs = Math.max(config.interval_minutes, 0) * 60_000
  const dates: Date[] = []
  for (let i = 0; i < count; i += 1) {
    const when = new Date(start.getTime() + i * intervalMs)
    if (when.getTime() > Date.now() + 5000) dates.push(when)
  }
  return dates
}
