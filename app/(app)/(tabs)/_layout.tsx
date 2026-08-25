import { FloatingTabBar } from '@/components/FloatingTabBar'
import { Tabs } from 'expo-router'

export default function TabLayout() {
  return (
    <Tabs tabBar={(props) => <FloatingTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Chasse' }} />
      <Tabs.Screen name="offers" options={{ title: 'Offres' }} />
      <Tabs.Screen name="demands" options={{ title: 'Demandes' }} />
      <Tabs.Screen name="contacts" options={{ title: 'Contacts' }} />
      <Tabs.Screen name="clients" options={{ href: null }} />
      <Tabs.Screen name="rendez-vous" options={{ href: null }} />
    </Tabs>
  )
}
