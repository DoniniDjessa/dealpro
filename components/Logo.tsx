import { useEffect, useRef } from 'react'
import { Animated, Easing, Text, View } from 'react-native'
import { Image } from 'expo-image'
import * as SplashScreen from 'expo-splash-screen'
import { colors, fonts } from '@/lib/theme'

export function LogoMark({ size = 56 }: { size?: number }) {
  return (
    <Image
      source={require('@/assets/images/icon.png')}
      style={{ width: size, height: size, borderRadius: size * 0.22, backgroundColor: '#111111' }}
      contentFit="cover"
      cachePolicy="none"
    />
  )
}

export function LogoLockup() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
      <LogoMark size={40} />
      <View>
        <Text style={{ ...fonts.extra, fontSize: 18, color: colors.black }}>DealPro</Text>
        <Text style={{ ...fonts.medium, fontSize: 12, color: colors.muted }}>Chasse · Match · Commission</Text>
      </View>
    </View>
  )
}

export function LogoLoader({ size = 72, label = 'Chargement…' }: { size?: number; label?: string }) {
  const pulse = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1400,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    )
    loop.start()
    return () => loop.stop()
  }, [pulse])

  const scale = pulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.92, 1.06, 0.92] })
  const ring = pulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.18, 0.55, 0.18] })
  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.28] })

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <View style={{ width: size + 28, height: size + 28, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View
          style={{
            position: 'absolute',
            width: size + 20,
            height: size + 20,
            borderRadius: (size + 20) / 2,
            borderWidth: 2,
            borderColor: colors.emerald,
            opacity: ring,
            transform: [{ scale: ringScale }],
          }}
        />
        <Animated.View style={{ transform: [{ scale }] }}>
          <LogoMark size={size} />
        </Animated.View>
      </View>
      {label ? <Text style={{ fontSize: 13, color: colors.muted, fontWeight: '600' }}>{label}</Text> : null}
    </View>
  )
}

export function BootScreen() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => undefined)
  }, [])

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <LogoLoader />
    </View>
  )
}
