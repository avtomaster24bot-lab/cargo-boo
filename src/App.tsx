import { BottomNav } from './components/BottomNav'
import { AddressScreen } from './screens/AddressScreen'
import { ChatScreen } from './screens/ChatScreen'
import { ConfirmScreen } from './screens/ConfirmScreen'
import { DriverHomeScreen } from './screens/DriverHomeScreen'
import { DriverOrderScreen } from './screens/DriverOrderScreen'
import { HistoryScreen } from './screens/HistoryScreen'
import { HomeScreen } from './screens/HomeScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { RatingScreen } from './screens/RatingScreen'
import { SearchScreen } from './screens/SearchScreen'
import { TrackingScreen } from './screens/TrackingScreen'
import { WelcomeScreen } from './screens/WelcomeScreen'
import { useStore } from './store'
import type { ScreenName } from './types'

export default function App() {
  const { ready, seenWelcome, screen } = useStore()
  if (!ready) return null
  if (!seenWelcome) return <WelcomeScreen />

  return (
    <div className="app-shell min-h-full">
      <div className="flex min-h-0 flex-1 flex-col">
        <ScreenView name={screen.name} />
      </div>
      <BottomNav />
    </div>
  )
}

function ScreenView({ name }: { name: ScreenName }) {
  switch (name) {
    case 'home':
      return <HomeScreen />
    case 'address':
      return <AddressScreen />
    case 'confirm':
      return <ConfirmScreen />
    case 'search':
      return <SearchScreen />
    case 'tracking':
      return <TrackingScreen />
    case 'history':
      return <HistoryScreen />
    case 'profile':
      return <ProfileScreen />
    case 'driver':
      return <DriverHomeScreen />
    case 'driver-order':
      return <DriverOrderScreen />
    case 'chat':
      return <ChatScreen />
    case 'rating':
      return <RatingScreen />
    default:
      return <HomeScreen />
  }
}
