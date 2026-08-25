import { useEffect, useMemo, useState } from 'react'
import { Pressable } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'
import * as Location from 'expo-location'
import { Field } from '@/components/Field'
import { FormPanel } from '@/components/FormPanel'
import { ContactAttach } from '@/components/ContactAttach'
import { QuickContactSave } from '@/components/QuickContactSave'
import { useAuth } from '@/lib/auth'
import { tables } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import { createNamedContacts, recomputeMatches, upsertContact } from '@/lib/crm'
import { TextAnalyzer, normalizePhone, phonesMatch, titleFromDescription } from '@/lib/analyze'
import { parseAmount } from '@/lib/format'
import { reliabilityFor } from '@/lib/match'
import { useCategoryFilter } from '@/lib/filter'
import { useContacts } from '@/lib/hooks'
import { CATEGORIES, PIPELINE_META, VERIFICATION_META, categoryMeta, normalizeCategory } from '@/lib/taxonomy'
import type { OfferDraft } from '@/lib/share'
import type { Category, DirectoryPerson, Offer, Pipeline, Source, Verification } from '@/lib/types'
import { colors, fonts } from '@/lib/theme'

function splitPhones(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map(normalizePhone)
}

export function OpportunityForm({
  item,
  draft,
  onClose,
  onSaved,
}: {
  item: Offer | null
  draft?: OfferDraft | null
  onClose: () => void
  onSaved: () => void
}) {
  const { user } = useAuth()
  const { items: appContacts, reload: reloadContacts } = useContacts()
  const { category: filterCategory } = useCategoryFilter()
  const [raw, setRaw] = useState(item?.raw_text || item?.description || draft?.raw || '')
  const [link, setLink] = useState(item?.source_url || item?.links?.[0]?.url || draft?.link || '')
  const [title, setTitle] = useState(item?.title || '')
  const [category, setCategory] = useState<Category>(
    normalizeCategory(item?.category || draft?.category || filterCategory || 'immobilier')
  )
  const [price, setPrice] = useState(item?.price ? String(item.price) : '')
  const [location, setLocation] = useState(item?.location || '')
  const [rooms, setRooms] = useState(item?.rooms ? String(item.rooms) : '')
  const [sizeLabel, setSizeLabel] = useState(item?.size_label || '')
  const [visite, setVisite] = useState(item?.visite ? String(item.visite) : '')
  const [phone, setPhone] = useState(item?.phones?.length ? item.phones.join(', ') : item?.phone || '')
  const [important, setImportant] = useState(Boolean(item?.important))
  const [verification, setVerification] = useState<Verification>(item?.verification || 'unverified')
  const [pipeline, setPipeline] = useState<Pipeline>(item?.pipeline || 'captured')
  const [person, setPerson] = useState<DirectoryPerson | null>(null)
  const [phonesTouched, setPhonesTouched] = useState(Boolean(item?.phone || item?.phones?.length))
  const [personTouched, setPersonTouched] = useState(Boolean(item?.contact_id))
  const [quickOpen, setQuickOpen] = useState(false)
  const [quickBusy, setQuickBusy] = useState(false)
  const [map, setMap] = useState({
    lat: item?.map_lat ?? null,
    lng: item?.map_lng ?? null,
    label: item?.map_label || '',
  })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const listedPhones = useMemo(() => splitPhones(phone), [phone])
  const unmatchedPhones = useMemo(
    () =>
      listedPhones.filter(
        (numero) =>
          !appContacts.some((contact) =>
            [contact.phone, ...(contact.phones || [])].filter(Boolean).some((known) => phonesMatch(numero, String(known)))
          )
      ),
    [listedPhones, appContacts]
  )

  useEffect(() => {
    if (!item?.contact_id) return
    const linked = appContacts.find((contact) => contact.id === item.contact_id)
    if (!linked) return
    setPerson((current) => {
      if (current && current.id !== linked.id && personTouched) return current
      return { id: linked.id, name: linked.name, phone: linked.phone, fromApp: true }
    })
  }, [appContacts, item?.contact_id, personTouched])

  useEffect(() => {
    if (draft?.raw || draft?.link) return
    const blob = `${raw} ${link}`.trim()
    if (!blob) return
    const timer = setTimeout(() => {
      const analysis = TextAnalyzer.analyzeText(blob, category)
      if (!phonesTouched && analysis.telephones.length) {
        setPhone(analysis.telephones.join(', '))
      }
      if (!item && !price && analysis.prix) setPrice(String(analysis.prix))
      if (!item && !rooms && analysis.nbPieces) setRooms(String(analysis.nbPieces))
      if (!item && !location && analysis.location) setLocation(analysis.location)
      if (!item && !visite && analysis.visite) setVisite(String(analysis.visite))

      const pool = phonesTouched ? splitPhones(phone) : analysis.telephones
      if (personTouched) return
      const matched = appContacts.find((contact) => {
        const list = [contact.phone, ...(contact.phones || [])].filter(Boolean) as string[]
        return pool.some((numero) => list.some((known) => phonesMatch(numero, known)))
      })
      setPerson(matched ? { id: matched.id, name: matched.name, phone: matched.phone, fromApp: true } : null)
    }, 350)
    return () => clearTimeout(timer)
  }, [raw, link, category, phonesTouched, personTouched, appContacts, phone])

  const applyAnalysis = (force: boolean) => {
    const blob = `${raw} ${link}`.trim()
    if (!blob) return
    const analysis = TextAnalyzer.analyzeText(blob, category)
    if (force || !title.trim()) setTitle(titleFromDescription(raw))
    if (force || !price) {
      if (analysis.prix) setPrice(String(analysis.prix))
    }
    if (force || !rooms) {
      if (analysis.nbPieces) setRooms(String(analysis.nbPieces))
    }
    if (force || !location) {
      if (analysis.location) setLocation(analysis.location)
    }
    if (force || !visite) {
      if (analysis.visite) setVisite(String(analysis.visite))
    }
    if (force || !phonesTouched) {
      if (analysis.telephones.length) {
        setPhone(analysis.telephones.join(', '))
        setPhonesTouched(true)
      }
    }
    if (!personTouched) {
      const pool = analysis.telephones.length ? analysis.telephones : listedPhones
      const matched = appContacts.find((contact) => {
        const list = [contact.phone, ...(contact.phones || [])].filter(Boolean) as string[]
        return pool.some((numero) => list.some((known) => phonesMatch(numero, known)))
      })
      setPerson(matched ? { id: matched.id, name: matched.name, phone: matched.phone, fromApp: true } : person)
    }
  }

  const grabGps = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      setError('Autorise la localisation pour taguer le bien.')
      return
    }
    const pos = await Location.getCurrentPositionAsync({})
    setMap((current) => ({
      ...current,
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      label: current.label || `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
    }))
  }

  const applyPerson = (next: DirectoryPerson | null) => {
    setPersonTouched(true)
    setPerson(next ? { ...next, fromApp: Boolean(next.fromApp) } : null)
  }

  const saveQuickContacts = async (groups: { name: string; phones: string[] }[]) => {
    if (!user?.id) return
    setQuickBusy(true)
    setError(null)
    try {
      const created = await createNamedContacts(user.id, groups)
      await reloadContacts()
      const first = created[0]
      if (first) {
        setPerson({ id: first.id, name: first.name, phone: first.phone, fromApp: true })
        setPersonTouched(true)
      }
      setQuickOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Contacts non enregistrés')
    } finally {
      setQuickBusy(false)
    }
  }

  const save = async () => {
    if (!user?.id) return
    if (!raw.trim()) {
      setError('La description est requise.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const analysis = TextAnalyzer.analyzeText(`${raw} ${link}`.trim(), category)
      const amount = parseAmount(price) || analysis.prix || 0
      const phones = listedPhones.length ? listedPhones : analysis.telephones
      const primaryPhone = phones[0] || null

      let contactId: string | null = null
      if (person?.fromApp) contactId = person.id
      else if (person) {
        const contact = await upsertContact(user.id, person)
        contactId = contact.id
      }

      const links = analysis.liens.length
        ? analysis.liens
        : link.trim()
          ? [{ url: link.trim(), type: 'autre' }]
          : item?.links || []
      const source: Source = link.trim() ? 'link' : 'paste'
      const payload = {
        user_id: user.id,
        title: title.trim() || titleFromDescription(raw),
        category,
        price: amount,
        currency: 'XOF',
        commission_rate: item?.commission_rate ?? 0.03,
        location: location.trim() || analysis.location || null,
        size_label: sizeLabel.trim() || null,
        size_value: parseAmount(sizeLabel) || null,
        rooms: rooms ? Number(rooms) || analysis.nbPieces || null : analysis.nbPieces || null,
        visite: visite ? parseAmount(visite) : analysis.visite || null,
        visite_text: analysis.visiteTexte || null,
        phones,
        links,
        tags: analysis.tags.length ? analysis.tags : item?.tags || [],
        is_new: analysis.isNouveaute || item?.is_new || false,
        description: raw.trim(),
        raw_text: raw.trim(),
        source_url: link.trim() || links[0]?.url || null,
        source,
        phone: primaryPhone,
        contact_id: contactId,
        verification,
        pipeline,
        map_lat: map.lat,
        map_lng: map.lng,
        map_label: map.label.trim() || location.trim() || null,
        last_touched_at: new Date().toISOString(),
        important,
        updated_at: new Date().toISOString(),
        extracted: analysis,
      }
      const reliability = reliabilityFor({ ...(item as Offer), ...payload } as Offer)
      const { error: err } = item
        ? await supabase.from(tables.offers).update({ ...payload, reliability }).eq('id', item.id)
        : await supabase.from(tables.offers).insert({ ...payload, reliability })
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
    await supabase.from(tables.offers).delete().eq('id', item.id)
    await recomputeMatches(user.id)
    onSaved()
  }

  return (
    <FormPanel
      title={item ? 'Modifier l’offre' : 'Capturer une opportunité'}
      onClose={onClose}
      onSave={() => void save()}
      onDelete={item ? () => void remove() : undefined}
      busy={busy}
      saveLabel={item ? 'Enregistrer' : 'Analyser et ajouter'}
    >
      {draft?.raw || draft?.link ? (
        <YStack backgroundColor={colors.emeraldSoft} borderRadius={16} padding={14} gap={4}>
          <Text style={{ ...fonts.semibold, fontSize: 13, color: colors.emerald }}>
            Reçu par partage
          </Text>
          <Text style={{ ...fonts.medium, fontSize: 12, color: colors.darkEmerald }}>
            Lien et texte uniquement. L’analyse remplira prix, contacts et le reste à l’enregistrement.
          </Text>
        </YStack>
      ) : null}
      <Field
        label="DESCRIPTION *"
        placeholder="Colle ici l’annonce complète : prix, contacts, pièces…"
        value={raw}
        onChangeText={setRaw}
        multiline
        height={120}
      />
      {item ? (
        <Pressable onPress={() => applyAnalysis(true)}>
          <YStack height={44} borderRadius={14} backgroundColor={colors.emeraldSoft} alignItems="center" justifyContent="center">
            <Text style={{ ...fonts.semibold, fontSize: 13, color: colors.emerald }}>Réanalyser le texte</Text>
          </YStack>
        </Pressable>
      ) : null}
      <Field
        label="LIEN"
        placeholder="https://facebook.com/posts/…  (optionnel)"
        autoCapitalize="none"
        value={link}
        onChangeText={setLink}
      />
      <Text style={{ ...fonts.medium, fontSize: 12, color: colors.muted }}>
        Les téléphones remplissent ce champ. Un numéro déjà dans le carnet apparaît dans Contact. Rien n’est créé tout seul.
      </Text>

      <Text style={{ ...fonts.bold, fontSize: 10, color: colors.emerald, letterSpacing: 1.4, marginLeft: 4 }}>
        CATÉGORIE
      </Text>
      {item ? (
        <XStack flexWrap="wrap" gap={8}>
          {CATEGORIES.map((cat) => (
            <Pressable key={cat.id} onPress={() => setCategory(cat.id)}>
              <YStack
                backgroundColor={category === cat.id ? colors.emerald : colors.card}
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
      ) : (
        <YStack
          alignSelf="flex-start"
          backgroundColor={colors.emeraldSoft}
          borderRadius={14}
          paddingHorizontal={12}
          paddingVertical={8}
        >
          <Text style={{ ...fonts.semibold, fontSize: 13, color: colors.emerald }}>
            {categoryMeta(category).emoji} {categoryMeta(category).label}
          </Text>
        </YStack>
      )}
      <Field label="TITRE" placeholder="Généré depuis la description si vide" value={title} onChangeText={setTitle} />
      <Field label="PRIX (FCFA)" placeholder="extrait auto" keyboardType="numeric" value={price} onChangeText={setPrice} />
      <Field label="NB PIÈCES" placeholder="3" keyboardType="numeric" value={rooms} onChangeText={setRooms} />
      <Field label="LOCALISATION" placeholder="Bingerville, Cocody…" value={location} onChangeText={setLocation} />
      <Field
        label="MAP / ADRESSE"
        placeholder="Libellé du point GPS"
        value={map.label}
        onChangeText={(value) => setMap((current) => ({ ...current, label: value }))}
      />
      <Pressable onPress={() => void grabGps()}>
        <YStack height={44} borderRadius={14} backgroundColor={colors.emeraldSoft} alignItems="center" justifyContent="center">
          <Text style={{ ...fonts.semibold, fontSize: 13, color: colors.emerald }}>
            {map.lat ? 'Position GPS enregistrée' : 'Prendre la position GPS'}
          </Text>
        </YStack>
      </Pressable>
      <Field label="SUPERFICIE" placeholder="1500 m²" value={sizeLabel} onChangeText={setSizeLabel} />
      <Field label="FRAIS DE VISITE" placeholder="5000" keyboardType="numeric" value={visite} onChangeText={setVisite} />
      <Pressable onPress={() => setImportant((value) => !value)}>
        <XStack
          height={48}
          borderRadius={14}
          paddingHorizontal={14}
          alignItems="center"
          justifyContent="space-between"
          backgroundColor={important ? colors.orangeSoft : colors.card}
          borderWidth={1}
          borderColor={important ? colors.orange : colors.border}
        >
          <Text style={{ ...fonts.semibold, fontSize: 14, color: important ? colors.orange : colors.black }}>
            Opportunité importante
          </Text>
          <Text style={{ ...fonts.bold, fontSize: 12, color: important ? colors.orange : colors.muted }}>
            {important ? 'Oui' : 'Non'}
          </Text>
        </XStack>
      </Pressable>
      <Field
        label="TÉLÉPHONES"
        placeholder="extraits de la description"
        value={phone}
        onChangeText={(value) => {
          setPhonesTouched(true)
          setPhone(value)
        }}
      />
      {unmatchedPhones.length ? (
        <Pressable onPress={() => setQuickOpen(true)}>
          <YStack height={44} borderRadius={14} backgroundColor={colors.orangeSoft} alignItems="center" justifyContent="center">
            <Text style={{ ...fonts.semibold, fontSize: 13, color: colors.orange }}>
              Enregistrer {unmatchedPhones.length} numéro{unmatchedPhones.length > 1 ? 's' : ''} dans le carnet
            </Text>
          </YStack>
        </Pressable>
      ) : null}
      <ContactAttach
        person={person}
        onChange={applyPerson}
        label="Contact du carnet"
        hint={person?.fromApp ? 'Reconnu automatiquement' : 'Relier depuis le répertoire, ou enregistrer les numéros extraits'}
      />
      <Text style={{ ...fonts.bold, fontSize: 10, color: colors.emerald, letterSpacing: 1.4, marginLeft: 4 }}>
        VÉRIFICATION
      </Text>
      <XStack flexWrap="wrap" gap={8}>
        {(Object.keys(VERIFICATION_META) as Verification[]).map((key) => (
          <Pressable key={key} onPress={() => setVerification(key)}>
            <YStack
              backgroundColor={verification === key ? colors.emerald : colors.card}
              borderRadius={14}
              paddingHorizontal={10}
              paddingVertical={8}
            >
              <Text style={{ ...fonts.semibold, fontSize: 12, color: verification === key ? colors.white : colors.black }}>
                {VERIFICATION_META[key].label}
              </Text>
            </YStack>
          </Pressable>
        ))}
      </XStack>
      <Text style={{ ...fonts.bold, fontSize: 10, color: colors.emerald, letterSpacing: 1.4, marginLeft: 4 }}>
        PIPELINE
      </Text>
      <XStack flexWrap="wrap" gap={8}>
        {(Object.keys(PIPELINE_META) as Pipeline[]).map((key) => (
          <Pressable key={key} onPress={() => setPipeline(key)}>
            <YStack
              backgroundColor={pipeline === key ? colors.emerald : colors.card}
              borderRadius={14}
              paddingHorizontal={10}
              paddingVertical={8}
            >
              <Text style={{ ...fonts.semibold, fontSize: 12, color: pipeline === key ? colors.white : colors.black }}>
                {PIPELINE_META[key].label}
              </Text>
            </YStack>
          </Pressable>
        ))}
      </XStack>
      {error ? <Text style={{ ...fonts.medium, color: colors.danger, fontSize: 13 }}>{error}</Text> : null}
      <QuickContactSave
        visible={quickOpen}
        phones={unmatchedPhones}
        busy={quickBusy}
        onClose={() => setQuickOpen(false)}
        onSave={(groups) => void saveQuickContacts(groups)}
      />
    </FormPanel>
  )
}
