import { Field } from '@/components/Field'
import { FormPanel } from '@/components/FormPanel'
import { colors, fonts } from '@/lib/theme'
import { useAuth } from '@/lib/auth'
import { requestContactsPermission } from '@/lib/contacts'
import { NOTIFY_OFFSETS, requestNotificationPermission } from '@/lib/notifications'
import { useState } from 'react'
import { Platform, Pressable, Switch } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'

export function SettingsForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { profile, updateProfile } = useAuth()
  const [name, setName] = useState(profile?.display_name || profile?.pseudo || '')
  const [appointmentsOn, setAppointmentsOn] = useState(profile?.notify_appointments !== false)
  const [demandsOn, setDemandsOn] = useState(profile?.notify_demands !== false)
  const [agendaMinutes, setAgendaMinutes] = useState(profile?.notify_agenda_minutes ?? 30)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const save = async () => {
    setBusy(true)
    setError(null)
    setMessage(null)
    const allowed = await requestNotificationPermission()
    if (!allowed && Platform.OS !== 'web') {
      setBusy(false)
      setMessage('Autorise les notifications pour recevoir les rappels.')
      return
    }
    const { error: err } = await updateProfile({
      display_name: name.trim(),
      notify_appointments: appointmentsOn,
      notify_demands: demandsOn,
      notify_agenda_minutes: agendaMinutes,
    })
    setBusy(false)
    if (err) setError(err)
    else onSaved()
  }

  return (
    <FormPanel title="Paramètres" onClose={onClose} onSave={() => void save()} busy={busy}>
      <Field label="NOM AFFICHÉ" value={name} onChangeText={setName} />
      <Text style={{ ...fonts.semibold, color: colors.black, fontSize: 16 }}>Notifications</Text>
      <Text style={{ ...fonts.medium, color: colors.muted, fontSize: 13, marginTop: -4 }}>
        Rappels de rendez-vous, et relances des demandes encore ouvertes.
      </Text>
      <ToggleRow label="Rappels rendez-vous" value={appointmentsOn} onChange={setAppointmentsOn} />
      {appointmentsOn ? <OffsetPick value={agendaMinutes} onChange={setAgendaMinutes} /> : null}
      <ToggleRow label="Demandes non traitées" value={demandsOn} onChange={setDemandsOn} />
      {demandsOn ? (
        <Text style={{ ...fonts.medium, fontSize: 12, color: colors.muted, paddingHorizontal: 4 }}>
          Une notification chaque matin à 9h tant que la demande reste ouverte. Tu peux personnaliser le rappel dans
          chaque fiche.
        </Text>
      ) : null}
      <Text style={{ ...fonts.semibold, color: colors.black, fontSize: 16, marginTop: 8 }}>Répertoire</Text>
      <Pressable
        onPress={async () => {
          const ok = await requestContactsPermission()
          setMessage(
            ok
              ? 'Répertoire autorisé.'
              : Platform.OS === 'web'
                ? 'Le répertoire est disponible sur iOS et Android.'
                : 'Accès au répertoire refusé.'
          )
        }}
      >
        <XStack backgroundColor={colors.card} borderRadius={16} padding={16}>
          <Text style={{ ...fonts.semibold, color: colors.black }}>Autoriser le répertoire</Text>
        </XStack>
      </Pressable>
      <Text style={{ ...fonts.medium, fontSize: 12, color: colors.muted }}>
        Application privée. Le réseau d’apporteurs arrivera plus tard. Le partage depuis Facebook, X, WhatsApp ou
        TikTok nécessite un build natif (pas Expo Go).
      </Text>
      {message ? <Text style={{ ...fonts.medium, color: colors.emerald, fontSize: 13 }}>{message}</Text> : null}
      {error ? <Text style={{ ...fonts.medium, color: colors.danger }}>{error}</Text> : null}
    </FormPanel>
  )
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <XStack
      backgroundColor={colors.card}
      borderRadius={16}
      paddingHorizontal={16}
      paddingVertical={12}
      alignItems="center"
      justifyContent="space-between"
    >
      <Text style={{ ...fonts.semibold, color: colors.black }}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.emerald }} />
    </XStack>
  )
}

function OffsetPick({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <XStack flexWrap="wrap" gap={8}>
      {NOTIFY_OFFSETS.map((item) => {
        const active = value === item.value
        return (
          <Pressable key={item.value} onPress={() => onChange(item.value)}>
            <YStack
              backgroundColor={active ? colors.emerald : colors.card}
              borderRadius={16}
              paddingHorizontal={12}
              paddingVertical={8}
            >
              <Text style={{ ...fonts.semibold, fontSize: 12, color: active ? colors.white : colors.black }}>
                {item.label}
              </Text>
            </YStack>
          </Pressable>
        )
      })}
    </XStack>
  )
}
