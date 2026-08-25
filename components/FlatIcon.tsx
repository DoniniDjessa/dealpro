import { Image } from 'expo-image'
import { colors } from '@/lib/theme'

const icons = {
  calendar: require('@/assets/icons/calendar.png'),
  todo: require('@/assets/icons/todo.png'),
  wallet: require('@/assets/icons/wallet.png'),
  users: require('@/assets/icons/users.png'),
  image: require('@/assets/icons/image.png'),
  pin: require('@/assets/icons/pin.png'),
  archive: require('@/assets/icons/archive.png'),
  clock: require('@/assets/icons/clock.png'),
  flag: require('@/assets/icons/flag.png'),
  tag: require('@/assets/icons/tag.png'),
  check: require('@/assets/icons/check.png'),
  house: require('@/assets/icons/house.png'),
  building: require('@/assets/icons/building.png'),
  land: require('@/assets/icons/land.png'),
  car: require('@/assets/icons/car.png'),
} as const

export type FlatIconName = keyof typeof icons

export function FlatIcon({
  name,
  size = 24,
  color,
}: {
  name: FlatIconName
  size?: number
  color?: string
}) {
  return (
    <Image
      source={icons[name]}
      style={{ width: size, height: size, tintColor: color }}
      contentFit="contain"
    />
  )
}
