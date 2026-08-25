import { Field } from '@/components/Field'
import { PrimaryButton } from '@/components/PrimaryButton'
import { parseAmount, formatFcfa } from '@/lib/format'
import { tables } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import { colors, fonts } from '@/lib/theme'
import { X } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { Modal, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text, XStack, YStack } from 'tamagui'

export function CashEntryModal({
  visible,
  userId,
  onClose,
  onSaved,
}: {
  visible: boolean
  userId: string | undefined
  onClose: () => void
  onSaved: () => void
}) {
  const insets = useSafeAreaInsets()
  const [sale, setSale] = useState('')
  const [received, setReceived] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const saleAmount = parseAmount(sale)
  const receivedAmount = parseAmount(received)
  const commission = useMemo(
    () => Math.max(0, saleAmount - receivedAmount),
    [saleAmount, receivedAmount]
  )

  const reset = () => {
    setSale('')
    setReceived('')
    setNote('')
    setError(null)
  }

  const save = async () => {
    if (!userId) return
    if (!saleAmount) {
      setError('Le montant de la vente est requis.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const { error: err } = await supabase.from(tables.cashEntries).insert({
        user_id: userId,
        sale_amount: saleAmount,
        received_amount: receivedAmount,
        commission,
        note: note.trim() || null,
        occurred_at: new Date().toISOString(),
      })
      if (err) throw new Error(err.message)
      reset()
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement impossible')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }}
      >
        <Pressable onPress={() => undefined}>
          <YStack
            backgroundColor={colors.bg}
            borderTopLeftRadius={24}
            borderTopRightRadius={24}
            padding={20}
            paddingBottom={insets.bottom + 20}
            gap={12}
          >
            <XStack alignItems="center" justifyContent="space-between">
              <Text style={{ ...fonts.extra, fontSize: 20, color: colors.black }}>Nouvelle entrée</Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <YStack
                  width={36}
                  height={36}
                  borderRadius={12}
                  backgroundColor={colors.card}
                  alignItems="center"
                  justifyContent="center"
                >
                  <X size={16} color={colors.black} />
                </YStack>
              </Pressable>
            </XStack>
            <Field
              label="MONTANT DE LA VENTE *"
              placeholder="25 000 000"
              keyboardType="numeric"
              value={sale}
              onChangeText={setSale}
            />
            <Field
              label="MONTANT REÇU"
              placeholder="750 000"
              keyboardType="numeric"
              value={received}
              onChangeText={setReceived}
            />
            <YStack
              backgroundColor={colors.emeraldSoft}
              borderRadius={16}
              padding={14}
            >
              <Text style={{ ...fonts.bold, fontSize: 10, color: colors.emerald, letterSpacing: 1.2 }}>
                COMMISSION
              </Text>
              <Text style={{ ...fonts.extra, fontSize: 22, color: colors.black, marginTop: 4 }}>
                {formatFcfa(commission)}
              </Text>
              <Text style={{ ...fonts.medium, fontSize: 11, color: colors.muted, marginTop: 2 }}>
                Vente − reçu
              </Text>
            </YStack>
            <Field label="NOTE" placeholder="Optionnel" value={note} onChangeText={setNote} />
            {error ? <Text style={{ ...fonts.medium, color: colors.danger, fontSize: 13 }}>{error}</Text> : null}
            <PrimaryButton label="Enregistrer" onPress={() => void save()} loading={busy} />
          </YStack>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
