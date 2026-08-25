import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Animated, Dimensions, Pressable, StyleSheet } from 'react-native'
import { colors } from '@/lib/theme'
import { OpportunityForm } from '@/components/forms/OpportunityForm'
import { DemandForm } from '@/components/forms/DemandForm'
import { ContactForm } from '@/components/forms/ContactForm'
import { SettingsForm } from '@/components/forms/SettingsForm'
import { AppointmentForm } from '@/components/forms/AppointmentForm'
import { OfferDetail } from '@/components/OfferDetail'
import type { FormDraft } from '@/lib/share'
import type { Appointment, Contact, Demand, FormKind, Offer } from '@/lib/types'

export type FormItem = Offer | Demand | Contact | Appointment

type FormDrawerValue = {
  kind: FormKind | null
  item: FormItem | null
  draft: FormDraft | null
  nonce: number
  openForm: (kind: FormKind, item?: FormItem | null, draft?: FormDraft | null) => void
  closeForm: (saved?: boolean) => void
  notifyChange: () => void
}

const FormDrawerContext = createContext<FormDrawerValue | null>(null)

export function useFormDrawer() {
  const ctx = useContext(FormDrawerContext)
  if (!ctx) throw new Error('useFormDrawer must be used within FormDrawerProvider')
  return ctx
}

export function useFormNonce() {
  return useContext(FormDrawerContext)?.nonce ?? 0
}

export function FormDrawerProvider({ children }: { children: ReactNode }) {
  const [kind, setKind] = useState<FormKind | null>(null)
  const [item, setItem] = useState<FormItem | null>(null)
  const [draft, setDraft] = useState<FormDraft | null>(null)
  const [nonce, setNonce] = useState(0)

  const openForm = useCallback((next: FormKind, nextItem?: FormItem | null, nextDraft?: FormDraft | null) => {
    setItem(nextItem ?? null)
    setDraft(nextDraft ?? null)
    setKind(next)
  }, [])
  const closeForm = useCallback((saved?: boolean) => {
    setKind(null)
    setItem(null)
    setDraft(null)
    if (saved) setNonce((n) => n + 1)
  }, [])
  const notifyChange = useCallback(() => setNonce((n) => n + 1), [])

  const value = useMemo(
    () => ({ kind, item, draft, nonce, openForm, closeForm, notifyChange }),
    [kind, item, draft, nonce, openForm, closeForm, notifyChange]
  )

  return (
    <FormDrawerContext.Provider value={value}>
      {children}
      <FormDrawerPanel />
    </FormDrawerContext.Provider>
  )
}

function FormDrawerPanel() {
  const { kind, item, draft, closeForm } = useFormDrawer()
  const open = kind !== null
  const width = Math.min(360, Dimensions.get('window').width * 0.92)
  const translateX = useRef(new Animated.Value(width)).current
  const overlay = useRef(new Animated.Value(0)).current
  const formKey = `${kind ?? 'none'}-${item?.id ?? 'new'}-${draft?.link ?? ''}-${draft?.contact?.id ?? ''}-${draft?.raw?.slice(0, 24) ?? ''}`

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: open ? 0 : width,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(overlay, {
        toValue: open ? 1 : 0,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start()
  }, [open, overlay, translateX, width])

  return (
    <>
      <Animated.View pointerEvents={open ? 'auto' : 'none'} style={[styles.overlay, { opacity: overlay }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => closeForm()} />
      </Animated.View>
      <Animated.View
        pointerEvents={open ? 'auto' : 'none'}
        style={[styles.panel, { width, backgroundColor: colors.bg, transform: [{ translateX }] }]}
      >
        {kind === 'offer' && item ? <OfferDetail key={formKey} item={item as Offer} onClose={() => closeForm()} /> : null}
        {kind === 'offer' && !item ? (
          <OpportunityForm
            key={formKey}
            item={null}
            draft={draft}
            onClose={() => closeForm()}
            onSaved={() => closeForm(true)}
          />
        ) : null}
        {kind === 'offer-edit' ? (
          <OpportunityForm key={formKey} item={item as Offer | null} onClose={() => closeForm()} onSaved={() => closeForm(true)} />
        ) : null}
        {kind === 'demand' ? (
          <DemandForm
            key={formKey}
            item={item as Demand | null}
            draft={draft}
            onClose={() => closeForm()}
            onSaved={() => closeForm(true)}
          />
        ) : null}
        {kind === 'contact' || kind === 'client' ? (
          <ContactForm
            key={formKey}
            item={item as Contact | null}
            role={kind === 'client' ? 'client' : (item as Contact | null)?.kind || 'contact'}
            onClose={() => closeForm()}
            onSaved={() => closeForm(true)}
          />
        ) : null}
        {kind === 'settings' ? <SettingsForm onClose={() => closeForm()} onSaved={() => closeForm(true)} /> : null}
        {kind === 'appointment' ? (
          <AppointmentForm
            key={formKey}
            item={item as Appointment | null}
            onClose={() => closeForm()}
            onSaved={() => closeForm(true)}
          />
        ) : null}
      </Animated.View>
    </>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    zIndex: 40,
  },
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: 41,
    elevation: 16,
  },
})
