import { useEffect, useState } from 'react'
import { Pressable } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'
import { Field } from '@/components/Field'
import { FormPanel } from '@/components/FormPanel'
import { ContactAttach } from '@/components/ContactAttach'
import { ReminderPick } from '@/components/ReminderPick'
import { useAuth } from '@/lib/auth'
import { tables } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import { markClient, recomputeMatches, upsertContact } from '@/lib/crm'
import { parseAmount } from '@/lib/format'
import { useContacts } from '@/lib/hooks'
import { cancelItemNotification } from '@/lib/notifications'
import { parseReminder, reminderPayload } from '@/lib/reminder'
import type { FormDraft } from '@/lib/share'
import { CATEGORIES, normalizeCategory } from '@/lib/taxonomy'
import type { Category, Demand, DirectoryPerson } from '@/lib/types'
import { colors, fonts } from '@/lib/theme'

export function DemandForm({
  item,
  draft,
  onClose,
  onSaved,
}: {
  item: Demand | null
  draft?: FormDraft | null
  onClose: () => void
  onSaved: () => void
}) {
  const { user } = useAuth()
  const { items: appContacts } = useContacts()
  const [title, setTitle] = useState(item?.title || '')
  const [category, setCategory] = useState<Category>(normalizeCategory(item?.category || 'immobilier'))
  const [location, setLocation] = useState(item?.location || '')
  const [min, setMin] = useState(item?.budget_min ? String(item.budget_min) : '')
  const [max, setMax] = useState(item?.budget_max ? String(item.budget_max) : '')
  const [sizeMin, setSizeMin] = useState(item?.size_min ? String(item.size_min) : '')
  const [notes, setNotes] = useState(item?.notes || '')
  const [person, setPerson] = useState<DirectoryPerson | null>(
    item?.contact
      ? { id: item.contact.id, name: item.contact.name, phone: item.contact.phone, fromApp: true }
      : draft?.contact
        ? draft.contact
        : item?.contact_id
          ? { id: item.contact_id, name: 'Client lié', phone: null, fromApp: true }
          : null
  )
  const [reminder, setReminder] = useState(() => parseReminder(item?.reminder, 'both'))
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!person?.fromApp) return
    const linked = appContacts.find((contact) => contact.id === person.id)
    if (!linked) return
    if (person.name === linked.name && person.phone === linked.phone) return
    setPerson({ id: linked.id, name: linked.name, phone: linked.phone, fromApp: true })
  }, [appContacts, person])

  const save = async () => {
    if (!user?.id) return
    const budgetMin = min ? parseAmount(min) : null
    const budgetMax = max ? parseAmount(max) : null
    if (budgetMin != null && budgetMax != null && budgetMax < budgetMin) {
      setError('Le budget max doit être ≥ au budget min.')
      return
    }
    if (!title.trim()) {
      setError('Donne un titre à la demande.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      let contactId: string | null = null
      if (person?.fromApp) contactId = person.id
      else if (person) {
        const contact = await upsertContact(user.id, person)
        contactId = contact.id
      }
      if (contactId) await markClient(contactId)
      const payload = {
        user_id: user.id,
        title: title.trim(),
        category,
        location: location.trim() || null,
        budget_min: budgetMin,
        budget_max: budgetMax,
        currency: 'XOF',
        size_min: sizeMin ? parseAmount(sizeMin) : null,
        notes: notes.trim() || null,
        contact_id: contactId,
        status: item?.status ?? 'open',
        reminder: reminderPayload(reminder),
        updated_at: new Date().toISOString(),
      }
      const { error: err } = item
        ? await supabase.from(tables.demands).update(payload).eq('id', item.id)
        : await supabase.from(tables.demands).insert(payload)
      if (err) throw new Error(err.message)
      await recomputeMatches(user.id)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement impossible')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!item || !user?.id) return
    await cancelItemNotification('demand', item.id)
    await supabase.from(tables.demands).delete().eq('id', item.id)
    await recomputeMatches(user.id)
    onSaved()
  }

  return (
    <FormPanel
      title={item ? 'Modifier la demande' : 'Nouvelle demande'}
      onClose={onClose}
      onSave={() => void save()}
      onDelete={item ? () => void remove() : undefined}
      busy={busy}
    >
      <Field label="TITRE" placeholder="Cherche terrain Cocody / Bingerville" value={title} onChangeText={setTitle} />
      <Text style={{ ...fonts.bold, fontSize: 10, color: colors.indigo, letterSpacing: 1.4, marginLeft: 4 }}>
        CATÉGORIE
      </Text>
      <XStack flexWrap="wrap" gap={8}>
        {CATEGORIES.map((cat) => (
          <Pressable key={cat.id} onPress={() => setCategory(cat.id)}>
            <YStack
              backgroundColor={category === cat.id ? colors.indigo : colors.card}
              borderRadius={14}
              paddingHorizontal={12}
              paddingVertical={8}
            >
              <Text style={{ ...fonts.semibold, fontSize: 12, color: category === cat.id ? colors.white : colors.black }}>
                {cat.emoji} {cat.label}
              </Text>
            </YStack>
          </Pressable>
        ))}
      </XStack>
      <Field label="ZONE" placeholder="Cocody / Bingerville" value={location} onChangeText={setLocation} />
      <Field label="BUDGET MIN" placeholder="30000000" keyboardType="numeric" value={min} onChangeText={setMin} />
      <Field label="BUDGET MAX" placeholder="50000000" keyboardType="numeric" value={max} onChangeText={setMax} />
      <Field label="TAILLE MIN" placeholder="1000" keyboardType="numeric" value={sizeMin} onChangeText={setSizeMin} />
      <Field label="NOTES" placeholder="Détails du client" value={notes} onChangeText={setNotes} />
      <ReminderPick
        value={reminder}
        onChange={setReminder}
        emptyStart="Tous les jours à 9h tant que la demande est ouverte"
      />
      <ContactAttach
        person={person}
        onChange={setPerson}
        carnet={appContacts.map((contact) => ({
          id: contact.id,
          name: contact.name,
          phone: contact.phone,
          fromApp: true,
        }))}
        label="Rattacher un client"
        hint="Carnet DealPro ou répertoire — le client est lié à cette demande"
      />
      {error ? <Text style={{ ...fonts.medium, color: colors.danger, fontSize: 13 }}>{error}</Text> : null}
    </FormPanel>
  )
}
