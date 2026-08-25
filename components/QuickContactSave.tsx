import { useState } from 'react'
import { Modal, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text, XStack, YStack } from 'tamagui'
import { Field } from '@/components/Field'
import { PrimaryButton } from '@/components/PrimaryButton'
import { colors, fonts } from '@/lib/theme'

export function QuickContactSave({
  visible,
  phones,
  onClose,
  onSave,
  busy,
}: {
  visible: boolean
  phones: string[]
  onClose: () => void
  onSave: (groups: { name: string; phones: string[] }[]) => void
  busy?: boolean
}) {
  const insets = useSafeAreaInsets()
  const many = phones.length > 1
  const [mode, setMode] = useState<'one' | 'many'>(many ? 'one' : 'one')
  const [sharedName, setSharedName] = useState('')
  const [names, setNames] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  const submit = () => {
    if (mode === 'one' || !many) {
      if (!sharedName.trim()) {
        setError('Indique le nom du contact.')
        return
      }
      onSave([{ name: sharedName.trim(), phones }])
      return
    }
    const groups = new Map<string, string[]>()
    for (const phone of phones) {
      const name = (names[phone] || '').trim()
      if (!name) {
        setError('Chaque numéro doit avoir un nom.')
        return
      }
      const list = groups.get(name) ?? []
      list.push(phone)
      groups.set(name, list)
    }
    onSave([...groups.entries()].map(([name, list]) => ({ name, phones: list })))
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <YStack flex={1} backgroundColor={colors.bg} paddingTop={insets.top + 12} paddingHorizontal={20}>
        <XStack alignItems="center" justifyContent="space-between" marginBottom={16}>
          <YStack flex={1} paddingRight={12}>
            <Text style={{ ...fonts.extra, fontSize: 22, color: colors.black }}>Enregistrer dans le carnet</Text>
            <Text style={{ ...fonts.medium, fontSize: 13, color: colors.muted, marginTop: 4 }}>
              Les numéros extraits ne sont pas sauvés tant que tu ne nommes pas le contact.
            </Text>
          </YStack>
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={{ ...fonts.semibold, color: colors.muted }}>Fermer</Text>
          </Pressable>
        </XStack>

        {many ? (
          <XStack gap={8} marginBottom={16}>
            <Pressable onPress={() => setMode('one')} style={{ flex: 1 }}>
              <YStack
                height={44}
                borderRadius={14}
                alignItems="center"
                justifyContent="center"
                backgroundColor={mode === 'one' ? colors.emerald : colors.card}
                borderWidth={1}
                borderColor={mode === 'one' ? colors.emerald : colors.border}
              >
                <Text style={{ ...fonts.semibold, fontSize: 13, color: mode === 'one' ? colors.white : colors.black }}>
                  Une personne
                </Text>
              </YStack>
            </Pressable>
            <Pressable onPress={() => setMode('many')} style={{ flex: 1 }}>
              <YStack
                height={44}
                borderRadius={14}
                alignItems="center"
                justifyContent="center"
                backgroundColor={mode === 'many' ? colors.emerald : colors.card}
                borderWidth={1}
                borderColor={mode === 'many' ? colors.emerald : colors.border}
              >
                <Text style={{ ...fonts.semibold, fontSize: 13, color: mode === 'many' ? colors.white : colors.black }}>
                  Plusieurs personnes
                </Text>
              </YStack>
            </Pressable>
          </XStack>
        ) : null}

        {mode === 'one' || !many ? (
          <YStack gap={12}>
            <Field label="NOM *" placeholder="Marie Kouassi" value={sharedName} onChangeText={setSharedName} />
            {phones.map((phone) => (
              <YStack key={phone} backgroundColor={colors.card} borderRadius={14} padding={12} borderWidth={1} borderColor={colors.border}>
                <Text style={{ ...fonts.medium, fontSize: 14, color: colors.black }}>{phone}</Text>
              </YStack>
            ))}
          </YStack>
        ) : (
          <YStack gap={14}>
            {phones.map((phone) => (
              <Field
                key={phone}
                label={phone}
                placeholder="Nom de cette personne"
                value={names[phone] || ''}
                onChangeText={(value) => setNames((current) => ({ ...current, [phone]: value }))}
              />
            ))}
            <Text style={{ ...fonts.medium, fontSize: 12, color: colors.muted }}>
              Le même nom sur deux numéros les regroupe sur un seul contact.
            </Text>
          </YStack>
        )}

        {error ? (
          <Text style={{ ...fonts.medium, color: colors.danger, fontSize: 13, marginTop: 12 }}>{error}</Text>
        ) : null}

        <YStack marginTop="auto" paddingBottom={Math.max(insets.bottom, 16) + 8} paddingTop={16}>
          <PrimaryButton
            label={busy ? 'Enregistrement…' : 'Ajouter au carnet'}
            onPress={submit}
            loading={busy}
            disabled={busy}
          />
        </YStack>
      </YStack>
    </Modal>
  )
}
