import { SidebarMenu } from '@/components/SidebarMenu'
import { FormDrawerProvider } from '@/components/FormDrawer'
import { NotificationSync } from '@/components/NotificationSync'
import { ShareCapture } from '@/components/ShareCapture'
import { FilterProvider } from '@/lib/filter'
import { Drawer } from 'expo-router/drawer'
import { colors } from '@/lib/theme'

export default function AppDrawer() {
  return (
    <FilterProvider>
      <FormDrawerProvider>
        <NotificationSync />
        <ShareCapture />
        <Drawer
          drawerContent={(props) => <SidebarMenu {...props} />}
          screenOptions={{
            headerShown: false,
            drawerType: 'front',
            overlayColor: 'rgba(0,0,0,0.25)',
            drawerStyle: { width: 320, backgroundColor: colors.bg },
          }}
        >
          <Drawer.Screen name="(tabs)" options={{ title: 'DealPro' }} />
        </Drawer>
      </FormDrawerProvider>
    </FilterProvider>
  )
}
