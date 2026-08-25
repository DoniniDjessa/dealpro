import { Field } from '@/components/Field'
import { LogoMark } from '@/components/Logo'
import { PrimaryButton } from '@/components/PrimaryButton'
import { colors, fonts } from '@/lib/theme'
import { useAuth } from '@/lib/auth'
import { AtSign, Eye, EyeOff, Lock, Mail } from 'lucide-react-native'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Text, YStack } from 'tamagui'

export default function LoginScreen() {
  const { signIn, signUp } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [email, setEmail] = useState('')
  const [pseudo, setPseudo] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const canSubmit =
    mode === 'in' ? Boolean(identifier.trim() && password) : Boolean(pseudo.trim() && email.trim() && password)

  const submit = async () => {
    setBusy(true)
    setError(null)
    const { error: err } =
      mode === 'in' ? await signIn(identifier, password) : await signUp(email, password, pseudo)
    if (err) setError(err)
    setBusy(false)
  }

  return (
    <YStack flex={1} backgroundColor={colors.bg}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.circleTop} />
          <View style={styles.circleBottom} />
          <YStack flex={1} justifyContent="center" padding={28} gap={28}>
            <YStack alignItems="center" gap={12}>
              <LogoMark size={96} />
              <Text style={{ ...fonts.extra, fontSize: 34, color: colors.black, letterSpacing: -0.6 }}>DealPro</Text>
              <View style={styles.tag}>
                <Text style={{ ...fonts.medium, fontSize: 12, color: colors.indigo }}>Chasse · Match · Commission</Text>
              </View>
            </YStack>
            <YStack gap={16}>
              {mode === 'up' ? (
                <Field
                  label="PSEUDO"
                  icon={AtSign}
                  placeholder="ton_pseudo"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={pseudo}
                  onChangeText={setPseudo}
                />
              ) : null}
              {mode === 'in' ? (
                <Field
                  label="EMAIL OU PSEUDO"
                  icon={Mail}
                  placeholder="email ou pseudo"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  value={identifier}
                  onChangeText={setIdentifier}
                />
              ) : (
                <Field
                  label="EMAIL"
                  icon={Mail}
                  placeholder="votre@email.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              )}
              <Field
                label="MOT DE PASSE"
                icon={Lock}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
                right={
                  <Pressable onPress={() => setShowPassword((v) => !v)} style={{ paddingRight: 16 }}>
                    {showPassword ? <EyeOff size={18} color={colors.indigo} /> : <Eye size={18} color={colors.muted} />}
                  </Pressable>
                }
              />
              {error ? <Text style={{ ...fonts.medium, color: colors.danger, fontSize: 13 }}>{error}</Text> : null}
              <YStack marginTop={8}>
                <PrimaryButton
                  label={mode === 'in' ? 'Se connecter' : 'Créer mon carnet'}
                  onPress={submit}
                  loading={busy}
                  disabled={busy || !canSubmit}
                />
              </YStack>
              <Pressable
                onPress={() => {
                  setError(null)
                  setMode(mode === 'in' ? 'up' : 'in')
                }}
              >
                <Text textAlign="center" style={{ ...fonts.semibold, color: colors.violet, fontSize: 14 }}>
                  {mode === 'in' ? "Pas encore de compte ? Inscription" : 'Déjà un compte ? Connexion'}
                </Text>
              </Pressable>
            </YStack>
          </YStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </YStack>
  )
}

const styles = StyleSheet.create({
  circleTop: {
    position: 'absolute',
    top: -140,
    left: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: colors.emerald,
    opacity: 0.08,
  },
  circleBottom: {
    position: 'absolute',
    bottom: -120,
    right: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.orange,
    opacity: 0.16,
  },
  tag: {
    backgroundColor: colors.emeraldSoft,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
})
