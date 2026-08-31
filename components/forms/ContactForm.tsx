import { useMemo, useState } from 'react'
import { Pressable } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'
import { Star } from 'lucide-react-native'
import { Field } from '@/components/Field'
import { FormPanel } from '@/components/FormPanel'
import { ContactAttach } from '@/components/ContactAttach'
import { useAuth } from '@/lib/auth'
import { tables } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import { normalizePhone } from '@/lib/analyze'
import { formatContactPlace, parseContactLocation } from '@/lib/location-path'
import { saveContactLocation } from '@/lib/places'
import type { Contact, ContactKind, DirectoryPerson } from '@/lib/types'
import { colors, fonts } from '@/lib/theme'

function splitPhones(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map(normalizePhone)
}

export function ContactForm({
  item,
  role = 'contact',
  onClose,
  onSaved,
}: {
  item: Contact | null
  role?: ContactKind
  onClose: () => void
  onSaved: () => void
}) {
  const { user } = useAuth()
  const kind: ContactKind = item?.kind || role
  const [person, setPerson] = useState<DirectoryPerson | null>(null)
  const [name, setName] = useState(item?.name || '')
  const [phones, setPhones] = useState((item?.phones?.length ? item.phones : item?.phone ? [item.phone] : []).join(', '))
  const [localisation, setLocalisation] = useState(item?.localisation || '')
  const [secteur, setSecteur] = useState(item?.secteur || '')
  const [specialite, setSpecialite] = useState(item?.specialite || '')
  const [whatsapp, setWhatsapp] = useState(item?.whatsapp || '')
  const [facebook, setFacebook] = useState(item?.facebook || '')
  const [instagram, setInstagram] = useState(item?.instagram || '')
  const [tiktok, setTiktok] = useState(item?.tiktok || '')
  const [notes, setNotes] = useState(item?.notes || '')
  const [rating, setRating] = useState<number | null>(item?.rating ?? null)
  const [tags, setTags] = useState<string[]>(item?.tags || [])
  const [tagDraft, setTagDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const placePreview = useMemo(
    () => formatContactPlace(parseContactLocation(localisation), localisation),
    [localisation]
  )

  const applyDirectory = (next: DirectoryPerson | null) => {
    setPerson(next)
    if (!next) return
    if (next.name) setName(next.name)
    if (next.phone) {
      const list = splitPhones(phones)
      const normalized = normalizePhone(next.phone)
      if (!list.includes(normalized)) setPhones([...list, normalized].join(', '))
    }
  }

  const save = async () => {
    if (!user?.id) return
    if (!name.trim()) {
      setError('Le nom est requis.')
      return
    }
    const phoneList = splitPhones(phones)
    if (!phoneList.length) {
      setError('Au moins un téléphone est requis.')
      return
    }
    setBusy(true)
    try {
      const location = await saveContactLocation(localisation)
      const payload = {
        name: name.trim(),
        phone: phoneList[0] || null,
        phones: phoneList,
        localisation: location.localisation,
        location_path: location.location_path,
        location_quartiers: location.location_quartiers,
        secteur: secteur.trim() || null,
        specialite: specialite.trim() || null,
        whatsapp: whatsapp.trim() || null,
        facebook: facebook.trim() || null,
        instagram: instagram.trim() || null,
        tiktok: tiktok.trim() || null,
        notes: notes.trim() || null,
        rating,
        tags,
        kind,
        device_contact_id: person?.id || item?.device_contact_id || null,
        updated_at: new Date().toISOString(),
      }
      if (item) {
        const { error: err } = await supabase.from(tables.contacts).update(payload).eq('id', item.id)
        if (err) throw new Error(err.message)
      } else {
        const { error: err } = await supabase.from(tables.contacts).insert({ ...payload, user_id: user.id })
        if (err) throw new Error(err.message)
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement impossible')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!item) return
    await supabase.from(tables.contacts).delete().eq('id', item.id)
    onSaved()
  }

  return (
    <FormPanel
      title={item ? (kind === 'client' ? 'Modifier le client' : 'Modifier le contact') : kind === 'client' ? 'Nouveau client' : 'Nouveau contact'}
      onClose={onClose}
      onSave={() => void save()}
      onDelete={item ? () => void remove() : undefined}
      busy={busy}
    >
      <ContactAttach
        person={person}
        onChange={applyDirectory}
        label="Depuis le répertoire"
        hint="Remplit nom et téléphone s’ils sont vides"
      />
      <Field label="NOM *" placeholder="Marie Kouassi" value={name} onChangeText={setName} />
      <Field
        label="TÉLÉPHONES *"
        placeholder="0755223322, 0122332233  (+225 auto)"
        value={phones}
        onChangeText={setPhones}
      />
      <Field label="LOCALISATION" placeholder="Cocody, Riviera 4" value={localisation} onChangeText={setLocalisation} />
      <Text style={{ ...fonts.medium, fontSize: 12, color: colors.muted, marginLeft: 4 }}>
        Virgule = commune puis quartier. Sans ville, c’est Abidjan.
      </Text>
      {placePreview ? (
        <Text style={{ ...fonts.semibold, fontSize: 13, color: colors.emerald, marginLeft: 4 }}>{placePreview}</Text>
      ) : null}
      <Field label="SECTEUR" placeholder="immo, auto, vivrier…" value={secteur} onChangeText={setSecteur} />
      <Field
        label="SPÉCIALITÉ"
        placeholder="Agent immobilier, vendeur de voitures…"
        value={specialite}
        onChangeText={setSpecialite}
      />
      <Field label="WHATSAPP" placeholder="lien ou numéro" autoCapitalize="none" value={whatsapp} onChangeText={setWhatsapp} />
      <Field label="FACEBOOK" placeholder="https://facebook.com/…" autoCapitalize="none" value={facebook} onChangeText={setFacebook} />
      <Field label="INSTAGRAM" placeholder="https://instagram.com/…" autoCapitalize="none" value={instagram} onChangeText={setInstagram} />
      <Field label="TIKTOK" placeholder="https://tiktok.com/…" autoCapitalize="none" value={tiktok} onChangeText={setTiktok} />
      <Text style={{ ...fonts.bold, fontSize: 10, color: colors.emerald, letterSpacing: 1.4, marginLeft: 4 }}>NOTE</Text>
      <XStack gap={6}>
        {[1, 2, 3, 4, 5].map((value) => (
          <Pressable key={value} onPress={() => setRating(rating === value ? null : value)} hitSlop={6}>
            <Star
              size={24}
              color={rating && rating >= value ? colors.orange : colors.border}
              fill={rating && rating >= value ? colors.orange : 'transparent'}
            />
          </Pressable>
        ))}
      </XStack>
      <Field
        label="TAGS"
        placeholder="fiable, exclusif… (valider ou virgule)"
        value={tagDraft}
        returnKeyType="done"
        onChangeText={(value) => {
          if (/[,;]/.test(value)) {
            const parts = value.split(/[,;]+/).map((item) => item.trim()).filter(Boolean)
            const last = value.match(/[,;]\s*$/) ? '' : parts.pop() || ''
            const next = [...tags]
            for (const part of parts) {
              if (!next.some((tag) => tag.toLowerCase() === part.toLowerCase())) next.push(part)
            }
            setTags(next)
            setTagDraft(last)
            return
          }
          setTagDraft(value)
        }}
        onSubmitEditing={() => {
          const next = tagDraft.trim()
          if (!next || tags.some((tag) => tag.toLowerCase() === next.toLowerCase())) return
          setTags([...tags, next])
          setTagDraft('')
        }}
      />
      {tags.length ? (
        <XStack flexWrap="wrap" gap={6}>
          {tags.map((tag) => (
            <Pressable key={tag} onPress={() => setTags(tags.filter((item) => item !== tag))}>
              <YStack backgroundColor={colors.emeraldSoft} borderRadius={10} paddingHorizontal={8} paddingVertical={4}>
                <Text style={{ ...fonts.semibold, fontSize: 11, color: colors.emerald }}>{tag} ×</Text>
              </YStack>
            </Pressable>
          ))}
        </XStack>
      ) : null}
      <Field label="REMARQUES" placeholder="Notes" value={notes} onChangeText={setNotes} multiline height={80} />
      {error ? <Text style={{ ...fonts.medium, color: colors.danger, fontSize: 13 }}>{error}</Text> : null}
    </FormPanel>
  )
}
