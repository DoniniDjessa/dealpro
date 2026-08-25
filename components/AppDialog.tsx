import { colors, fonts } from '@/lib/theme'
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { Modal, Pressable } from 'react-native'
import { Text, YStack } from 'tamagui'

export type DialogAction = {
  label: string
  tone?: 'cancel' | 'primary' | 'danger'
  onPress?: () => void
}

type DialogState = {
  title: string
  message?: string
  actions: DialogAction[]
}

type AppDialogValue = {
  show: (state: DialogState) => void
  confirm: (options: {
    title: string
    message?: string
    confirmLabel?: string
    destructive?: boolean
  }) => Promise<boolean>
}

const AppDialogContext = createContext<AppDialogValue | null>(null)

export function useAppDialog() {
  const ctx = useContext(AppDialogContext)
  if (!ctx) throw new Error('useAppDialog must be used within AppDialogProvider')
  return ctx
}

export function AppDialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DialogState | null>(null)
  const resolver = useRef<((value: boolean) => void) | null>(null)

  const close = useCallback((accepted = false) => {
    resolver.current?.(accepted)
    resolver.current = null
    setState(null)
  }, [])

  const show = useCallback((next: DialogState) => {
    resolver.current?.(false)
    resolver.current = null
    setState(next)
  }, [])

  const confirm = useCallback(
    ({
      title,
      message,
      confirmLabel = 'Confirmer',
      destructive,
    }: {
      title: string
      message?: string
      confirmLabel?: string
      destructive?: boolean
    }) =>
      new Promise<boolean>((resolve) => {
        resolver.current?.(false)
        resolver.current = resolve
        setState({
          title,
          message,
          actions: [
            { label: 'Annuler', tone: 'cancel', onPress: () => resolve(false) },
            {
              label: confirmLabel,
              tone: destructive ? 'danger' : 'primary',
              onPress: () => resolve(true),
            },
          ],
        })
      }),
    []
  )

  const value = useMemo(() => ({ show, confirm }), [show, confirm])

  return (
    <AppDialogContext.Provider value={value}>
      {children}
      <Modal visible={Boolean(state)} transparent animationType="fade" onRequestClose={() => close(false)}>
        <Pressable
          onPress={() => close(false)}
          style={{ flex: 1, backgroundColor: 'rgba(6, 78, 59, 0.42)', justifyContent: 'center', padding: 24 }}
        >
          <Pressable onPress={() => undefined}>
            <YStack backgroundColor={colors.card} borderRadius={24} padding={22} gap={14}>
              <Text style={{ ...fonts.extra, fontSize: 20, color: colors.black }}>{state?.title}</Text>
              {state?.message ? (
                <Text style={{ ...fonts.medium, fontSize: 14, color: colors.muted, lineHeight: 21 }}>
                  {state.message}
                </Text>
              ) : null}
              <YStack gap={8} marginTop={6}>
                {state?.actions.map((action) => (
                  <Pressable
                    key={action.label}
                    onPress={() => {
                      action.onPress?.()
                      resolver.current = null
                      setState(null)
                    }}
                  >
                    <YStack
                      height={48}
                      borderRadius={16}
                      alignItems="center"
                      justifyContent="center"
                      backgroundColor={
                        action.tone === 'danger'
                          ? '#FEE2E2'
                          : action.tone === 'primary'
                            ? colors.emerald
                            : colors.gray
                      }
                    >
                      <Text
                        style={{
                          ...fonts.semibold,
                          color:
                            action.tone === 'danger'
                              ? colors.danger
                              : action.tone === 'primary'
                                ? colors.white
                                : colors.black,
                        }}
                      >
                        {action.label}
                      </Text>
                    </YStack>
                  </Pressable>
                ))}
              </YStack>
            </YStack>
          </Pressable>
        </Pressable>
      </Modal>
    </AppDialogContext.Provider>
  )
}
