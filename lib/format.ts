export function formatFcfa(value: number | null | undefined) {
  const n = Number(value || 0)
  if (!Number.isFinite(n) || n === 0) return '0 FCFA'
  if (Math.abs(n) >= 1_000_000) {
    const m = n / 1_000_000
    const shown = Number.isInteger(m) ? String(m) : m.toFixed(1).replace('.', ',')
    return `${shown}M FCFA`
  }
  if (Math.abs(n) >= 1_000) {
    const k = n / 1_000
    const shown = Number.isInteger(k) ? String(k) : k.toFixed(1).replace('.', ',')
    return `${shown}k FCFA`
  }
  return `${Math.round(n).toLocaleString('fr-FR')} FCFA`
}

export function potentialCommission(price: number, rate: number) {
  return Math.round(Number(price || 0) * Number(rate || 0))
}

export function daysSince(iso: string | null | undefined) {
  if (!iso) return 0
  const then = new Date(iso).getTime()
  if (!Number.isFinite(then)) return 0
  return Math.floor((Date.now() - then) / 86_400_000)
}

export function parseAmount(raw: string) {
  const digits = raw.replace(/[^\d]/g, '')
  const n = Number(digits)
  return Number.isFinite(n) ? n : 0
}

export function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function dateKey(value: Date | string) {
  const d = typeof value === 'string' ? new Date(value) : value
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function dateAndTimeFromIso(iso: string | null | undefined) {
  if (!iso) return { date: null as Date | null, time: null as Date | null }
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return { date: null, time: null }
  return { date: d, time: d }
}

export function formatMonthTitle(date: Date) {
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

export type CashPeriod = 'week' | 'month' | 'year'

export function startOfWeek(date = new Date()) {
  const day = (date.getDay() + 6) % 7
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - day)
}

export function shiftPeriodAnchor(anchor: Date, period: CashPeriod, delta: number) {
  if (period === 'week') return new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + delta * 7)
  if (period === 'month') return new Date(anchor.getFullYear(), anchor.getMonth() + delta, 1)
  return new Date(anchor.getFullYear() + delta, 0, 1)
}

export function periodBounds(period: CashPeriod, anchor = new Date()) {
  if (period === 'week') {
    const start = startOfWeek(anchor)
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7)
    return { start, end }
  }
  if (period === 'month') {
    const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
    const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1)
    return { start, end }
  }
  const start = new Date(anchor.getFullYear(), 0, 1)
  const end = new Date(anchor.getFullYear() + 1, 0, 1)
  return { start, end }
}

export function periodLabel(period: CashPeriod, anchor = new Date()) {
  if (period === 'week') {
    const { start, end } = periodBounds('week', anchor)
    const last = new Date(end.getTime() - 1)
    return `${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} – ${last.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
  }
  if (period === 'month') return formatMonthTitle(anchor)
  return String(anchor.getFullYear())
}

export function inPeriod(iso: string, period: CashPeriod, anchor: Date) {
  const t = new Date(iso).getTime()
  const { start, end } = periodBounds(period, anchor)
  return t >= start.getTime() && t < end.getTime()
}
