import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Audio } from 'expo-av'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { tables } from '@/lib/db'
import { normalizePseudo } from '@/lib/pseudo'
import type { Appointment, Demand, Profile } from '@/lib/types'
import {
  parseReminder,
  reminderFireDates,
  REMINDER_SOUND_ASSETS,
  REMINDER_SOUND_FILES,
  type ReminderConfig,
  type ReminderMode,
  type ReminderSound,
} from '@/lib/reminder'

type ReminderKind = 'appointment' | 'demand'

if (Platform.OS !== 'web') {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const mode = String(notification.request.content.data?.mode ?? 'push')
        const loud = mode === 'alert' || mode === 'both'
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
          priority: loud
            ? Notifications.AndroidNotificationPriority.MAX
            : Notifications.AndroidNotificationPriority.HIGH,
        }
      },
    })
  } catch {
    // Native notifications can fail in a release APK; never crash startup.
  }
}

export const NOTIFY_OFFSETS = [
  { label: '5 min avant', value: 5 },
  { label: '15 min avant', value: 15 },
  { label: '30 min avant', value: 30 },
  { label: '1 h avant', value: 60 },
  { label: '1 jour avant', value: 1440 },
] as const

let alarmSound: Audio.Sound | null = null

function itemPrefix(kind: ReminderKind, id: string) {
  return `dealpro-${kind}-${id}`
}

function alertChannel(sound: ReminderSound) {
  return sound === 'default' ? 'dealpro-alert-default' : `dealpro-alert-${sound}`
}

async function ensureAndroidChannels() {
  if (Platform.OS !== 'android') return
  const channels: {
    id: string
    name: string
    importance: Notifications.AndroidImportance
    sound?: string
    vibrationPattern: number[]
  }[] = [
    {
      id: 'dealpro',
      name: 'DealPro',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    },
    {
      id: 'dealpro-push',
      name: 'Notifications',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 180],
    },
    {
      id: 'dealpro-alert-default',
      name: 'Alertes',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 400, 200, 400, 200, 400],
    },
    {
      id: 'dealpro-alert-alarm',
      name: 'Alerte réveil',
      importance: Notifications.AndroidImportance.MAX,
      sound: REMINDER_SOUND_FILES.alarm,
      vibrationPattern: [0, 500, 180, 500, 180, 500],
    },
    {
      id: 'dealpro-alert-chime',
      name: 'Alerte carillon',
      importance: Notifications.AndroidImportance.HIGH,
      sound: REMINDER_SOUND_FILES.chime,
      vibrationPattern: [0, 220, 120, 220],
    },
    {
      id: 'dealpro-alert-urgent',
      name: 'Alerte urgente',
      importance: Notifications.AndroidImportance.MAX,
      sound: REMINDER_SOUND_FILES.urgent,
      vibrationPattern: [0, 250, 80, 250, 80, 250, 80, 250],
    },
  ]
  for (const channel of channels) {
    await Notifications.setNotificationChannelAsync(channel.id, {
      name: channel.name,
      importance: channel.importance,
      vibrationPattern: channel.vibrationPattern,
      lightColor: '#059669',
      sound: channel.sound ?? 'default',
      enableVibrate: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    })
  }
}

export async function requestNotificationPermission() {
  if (Platform.OS === 'web') return false
  await ensureAndroidChannels()
  const current = await Notifications.getPermissionsAsync()
  const status = current.granted
    ? current
    : await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true },
      })
  return Boolean(
    status.granted || status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  )
}

export async function registerPushToken() {
  if (Platform.OS === 'web') {
    console.log('[DealPro] Push token: web — pas de token Expo')
    return null
  }

  const allowed = await requestNotificationPermission()
  if (!allowed) {
    console.log('[DealPro] Push token: permission notifications refusée')
    return null
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId
  if (!projectId) {
    console.log('[DealPro] Push token: extra.eas.projectId manquant')
    return null
  }

  try {
    const result = await Notifications.getExpoPushTokenAsync({ projectId })
    console.log('[DealPro] Expo push token:', result.data)
    return result.data
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.log('[DealPro] Push token: échec —', message)
    if (!Device.isDevice) {
      console.log('[DealPro] Utilise un téléphone physique (ou un émulateur avec Google Play).')
    }
    console.log('[DealPro] Android Expo Go ne délivre plus de token FCM — un development build est requis.')
    return null
  }
}

function fallbackPseudo(user: User) {
  const meta = normalizePseudo(String(user.user_metadata?.pseudo ?? ''))
  const fromEmail = normalizePseudo((user.email ?? 'user').split('@')[0]).replace(/[^a-z0-9._]/g, '')
  const base = (meta || fromEmail || 'user').replace(/[^a-z0-9._]/g, '') || 'user'
  const suffix = user.id.replace(/-/g, '').slice(0, 6)
  return `${base.slice(0, 17)}_${suffix}`.toLowerCase()
}

export async function persistPushToken(user: User, current?: string | null) {
  const token = await registerPushToken()
  if (!token) return null
  if (token === current) return token

  const { data, error } = await supabase
    .from(tables.profiles)
    .update({ push_token: token })
    .eq('id', user.id)
    .select('id')
    .maybeSingle()

  if (error) {
    console.log('[DealPro] Push token non enregistré en base:', error.message)
    return token
  }

  if (data) {
    console.log('[DealPro] Push token enregistré pour', user.id)
    return token
  }

  const { error: insertError } = await supabase.from(tables.profiles).insert({
    id: user.id,
    pseudo: fallbackPseudo(user),
    display_name: user.user_metadata?.pseudo ?? user.email ?? 'owner',
    push_token: token,
  })
  if (insertError) {
    console.log('[DealPro] Impossible de créer le profil + token:', insertError.message)
    return token
  }
  console.log('[DealPro] Profil existant complété avec un push token pour', user.id)
  return token
}

function contentSound(mode: ReminderMode, sound: ReminderSound) {
  if (mode === 'push' || sound === 'default') return true
  return REMINDER_SOUND_FILES[sound]
}

async function scheduleAt(
  identifier: string,
  title: string,
  body: string,
  when: Date,
  data: { kind: ReminderKind; id: string; mode: ReminderMode; sound: ReminderSound },
  channelId: string
) {
  if (when.getTime() <= Date.now() + 5000) return
  await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => undefined)
  await Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title,
      body,
      sound: contentSound(data.mode, data.sound),
      interruptionLevel: data.mode === 'push' ? 'active' : 'timeSensitive',
      data,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: when,
      channelId,
    },
  })
}

async function scheduleOccurrence(
  kind: ReminderKind,
  id: string,
  title: string,
  body: string,
  when: Date,
  index: number,
  config: ReminderConfig
) {
  const prefix = itemPrefix(kind, id)
  const data = { kind, id, mode: config.mode, sound: config.sound }
  if (config.mode === 'push' || config.mode === 'both') {
    await scheduleAt(`${prefix}-p${index}`, title, body, when, { ...data, mode: 'push' }, 'dealpro-push')
  }
  if (config.mode === 'alert' || config.mode === 'both') {
    await scheduleAt(
      `${prefix}-a${index}`,
      config.mode === 'both' ? `Alerte · ${title}` : title,
      body,
      when,
      { ...data, mode: 'alert' },
      alertChannel(config.sound)
    )
  }
}

export async function cancelItemNotification(kind: ReminderKind, id: string) {
  if (Platform.OS === 'web') return
  const prefix = itemPrefix(kind, id)
  try {
    const existing = await Notifications.getAllScheduledNotificationsAsync()
    await Promise.all(
      existing
        .filter((item) => item.identifier === prefix || item.identifier.startsWith(`${prefix}-`))
        .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier))
    )
  } catch {
    await Notifications.cancelScheduledNotificationAsync(prefix).catch(() => undefined)
  }
}

export function notificationTarget(data: Record<string, unknown> | undefined | null) {
  const kind = data?.kind
  if (kind === 'appointment') return '/(app)/(tabs)/rendez-vous' as const
  if (kind === 'demand') return '/(app)/(tabs)/demands' as const
  return null
}

export async function stopReminderAlarm() {
  if (!alarmSound) return
  try {
    await alarmSound.stopAsync()
    await alarmSound.unloadAsync()
  } catch {
    // already released
  }
  alarmSound = null
}

export async function startReminderAlarm(sound: ReminderSound = 'alarm') {
  if (Platform.OS === 'web') return
  await stopReminderAlarm()
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: false,
    })
    const { sound: player } = await Audio.Sound.createAsync(REMINDER_SOUND_ASSETS[sound], {
      isLooping: true,
      volume: 1,
      shouldPlay: true,
    })
    alarmSound = player
  } catch (e) {
    console.log('[DealPro] Alerte sonore impossible:', e instanceof Error ? e.message : e)
  }
}

export async function handleReminderReceived(data: Record<string, unknown> | undefined | null) {
  const mode = data?.mode
  if (mode !== 'alert' && mode !== 'both') return
  const sound = typeof data?.sound === 'string' ? data.sound : 'alarm'
  await startReminderAlarm(
    sound === 'chime' || sound === 'urgent' || sound === 'default' ? sound : 'alarm'
  )
}

function nextMorningNine() {
  const when = new Date()
  when.setHours(9, 0, 0, 0)
  if (when.getTime() <= Date.now() + 5000) when.setDate(when.getDate() + 1)
  return when
}

export async function syncNotifications(
  appointments: Appointment[],
  demands: Demand[],
  profile: Profile | null
) {
  if (Platform.OS === 'web') return
  try {
    const existing = await Notifications.getAllScheduledNotificationsAsync()
    await Promise.all(
      existing
        .filter((item) => item.identifier.startsWith('dealpro-'))
        .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier))
    )
  } catch {
    // Permission may not be granted yet.
  }

  const agendaMinutes = profile?.notify_agenda_minutes ?? 30
  const jobs: (() => Promise<void>)[] = []

  if (profile?.notify_appointments !== false) {
    for (const event of appointments) {
      const custom = event.reminder
      if (custom) {
        const reminder = parseReminder(custom, 'both')
        if (!reminder.enabled) continue
        const dates = reminderFireDates(reminder, new Date(event.starts_at))
        dates.forEach((when, index) => {
          jobs.push(() =>
            scheduleOccurrence(
              'appointment',
              event.id,
              event.kind === 'visite' ? 'Visite' : 'Rendez-vous',
              event.title,
              when,
              index,
              reminder
            )
          )
        })
        continue
      }
      if (new Date(event.starts_at).getTime() <= Date.now()) continue
      const when = new Date(new Date(event.starts_at).getTime() - agendaMinutes * 60_000)
      jobs.push(() =>
        scheduleOccurrence('appointment', event.id, event.kind === 'visite' ? 'Visite' : 'Rendez-vous', event.title, when, 0, {
          enabled: true,
          mode: 'push',
          sound: 'default',
          start_at: when.toISOString(),
          interval_minutes: 0,
          count: 1,
        })
      )
    }
  }

  if (profile?.notify_demands !== false) {
    for (const demand of demands.filter((item) => item.status === 'open')) {
      const custom = demand.reminder
      if (custom) {
        const reminder = parseReminder(custom, 'both')
        if (!reminder.enabled) continue
        const dates = reminderFireDates(reminder, nextMorningNine())
        dates.forEach((when, index) => {
          jobs.push(() =>
            scheduleOccurrence('demand', demand.id, 'Demande non traitée', demand.title, when, index, reminder)
          )
        })
        continue
      }
      const start = nextMorningNine()
      const reminder = {
        enabled: true,
        mode: 'push' as const,
        sound: 'default' as const,
        start_at: start.toISOString(),
        interval_minutes: 1440,
        count: 10,
      }
      reminderFireDates(reminder, start).forEach((when, index) => {
        jobs.push(() =>
          scheduleOccurrence('demand', demand.id, 'Demande non traitée', demand.title, when, index, reminder)
        )
      })
    }
  }

  if (!jobs.length) return
  const allowed = await requestNotificationPermission()
  if (!allowed) return
  await Promise.all(jobs.map((run) => run()))
}
