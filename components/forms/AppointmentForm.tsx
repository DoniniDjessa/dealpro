import { useState } from 'react'
import { Pressable } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'
import { Field } from '@/components/Field'
import { FormPanel } from '@/components/FormPanel'
import { ContactAttach } from '@/components/ContactAttach'
import { OptionalDateTime, resolveStartsAt } from '@/components/OptionalDateTime'
import { ReminderPick } from '@/components/ReminderPick'
import { useAuth } from '@/lib/auth'
import { tables } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import { upsertContact } from '@/lib/crm'
import { dateAndTimeFromIso } from '@/lib/format'
import { cancelItemNotification } from '@/lib/notifications'
import { parseReminder, reminderPayload } from '@/lib/reminder'
import type { Appointment, AppointmentKind, DirectoryPerson } from '@/lib/types'
import { colors, fonts } from '@/lib/theme'

const KINDS: { id: AppointmentKind; label: string }[] = [
  { id: 'affaire', label: 'Rendez-vous d’affaires' },
  { id: 'visite', label: 'Visite' },
]

export function AppointmentForm({
  item,
  onClose,
  onSaved,
}: {
  item: Appointment | null
  onClose: () => void
  onSaved: () => void
}) {
  const { user } = useAuth()
  const starts = dateAndTimeFromIso(item?.starts_at)
  const [title, setTitle] = useState(item?.title || '')
  const [kind, setKind] = useState<AppointmentKind>(item?.kind || 'affaire')
  const [place, setPlace] = useState(item?.place || '')
  const [notes, setNotes] = useState(item?.notes || '')
  const [date, setDate] = useState<Date | null>(starts.date)
  const [time, setTime] = useState<Date | null>(starts.time)
  const [person, setPerson] = useState<DirectoryPerson | null>(
    item?.contact
      ? { id: item.contact.id, name: item.contact.name, phone: item.contact.phone, fromApp: true }
      : item?.contact_id
        ? { id: item.contact_id, name: 'Contact lié', phone: null, fromApp: true }
        : null
  )
  const [reminder, setReminder] = useState(() => parseReminder(item?.reminder, 'both'))
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const save = async () => {
    if (!user?.id) return
    if (!title.trim()) {
      setError('Le titre est requis.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      let contactId: string | null = item?.contact_id ?? null
      if (person?.fromApp) contactId = person.id
      else if (person) {
        const contact = await upsertContact(user.id, person)
        contactId = contact.id
      } else {
        contactId = null
      }

      const payload = {
        user_id: user.id,
        kind,
        title: title.trim(),
        starts_at: resolveStartsAt(date, time).toISOString(),
        place: place.trim() || null,
        notes: notes.trim() || null,
        contact_id: contactId,
        reminder: reminderPayload(reminder),
        updated_at: new Date().toISOString(),
      }
      const { error: err } = item
        ? await supabase.from(tables.appointments).update(payload).eq('id', item.id)
        : await supabase.from(tables.appointments).insert(payload)
      if (err) throw new Error(err.message)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement impossible')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!item) return
    setBusy(true)
    await cancelItemNotification('appointment', item.id)
    const { error: err } = await supabase.from(tables.appointments).delete().eq('id', item.id)
    setBusy(false)
    if (err) {
      setError(err.message)
      return
    }
    onSaved()
  }

  return (
    <FormPanel
      title={item ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
      onClose={onClose}
      onSave={() => void save()}
      onDelete={item ? () => void remove() : undefined}
      busy={busy}
    >
      <Text style={{ ...fonts.bold, fontSize: 10, color: colors.emerald, letterSpacing: 1.4, marginLeft: 4 }}>
        TYPE
      </Text>
      <XStack flexWrap="wrap" gap={8}>
        {KINDS.map((entry) => (
          <Pressable key={entry.id} onPress={() => setKind(entry.id)}>
            <YStack
              backgroundColor={kind === entry.id ? colors.emerald : colors.card}
              borderRadius={14}
              paddingHorizontal={12}
              paddingVertical={8}
            >
              <Text style={{ ...fonts.semibold, fontSize: 12, color: kind === entry.id ? colors.white : colors.black }}>
                {entry.label}
              </Text>
            </YStack>
          </Pressable>
        ))}
      </XStack>
      <Field
        label="TITRE *"
        placeholder={kind === 'visite' ? 'Visite villa Cocody…' : 'Négociation avec…'}
        value={title}
        onChangeText={setTitle}
      />
      <OptionalDateTime date={date} time={time} onDate={setDate} onTime={setTime} />
      <Field label="LIEU" placeholder="Adresse ou point de rendez-vous" value={place} onChangeText={setPlace} />
      <Field label="NOTES" placeholder="Optionnel" value={notes} onChangeText={setNotes} multiline height={90} />
      <ReminderPick
        value={reminder}
        onChange={setReminder}
        emptyStart="30 min avant le rendez-vous"
      />
      <ContactAttach person={person} onChange={setPerson} label="Contact" hint="Personne à rencontrer" />
      {error ? <Text style={{ ...fonts.medium, color: colors.danger, fontSize: 13 }}>{error}</Text> : null}
    </FormPanel>
  )
}
