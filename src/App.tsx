import { BottomNav, NAV_HIDDEN_SCREENS } from './components/BottomNav'
import { DriverStayOpen } from './components/DriverStayOpen'
import { InstallBanner } from './components/InstallApp'
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
import { TariffsScreen } from './screens/TariffsScreen'
import { WelcomeScreen } from './screens/WelcomeScreen'
import { PrivacyPage } from './screens/PrivacyPage'
import { TermsPage } from './screens/TermsPage'
import { hasValidConsent, legalPageFromPath } from './lib/privacy'
import { useStore } from './store'
import type { ScreenName } from './types'

export default function App() {
  const { ready, seenWelcome, screen, consent } = useStore()
  const legal = legalPageFromPath()
  if (legal === 'privacy') return <PrivacyPage />
  if (legal === 'terms') return <TermsPage />
  if (!ready) return null
  if (!seenWelcome || !hasValidConsent(consent)) return <WelcomeScreen />

  return (
    <div className="app-shell min-h-full">
      <div className="flex min-h-0 flex-1 flex-col">
        <ScreenView name={screen.name} />
      </div>
      <InstallBanner hidden={NAV_HIDDEN_SCREENS.includes(screen.name)} />
      <BottomNav />
      <DriverStayOpen />
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
    case 'tariffs':
      return <TariffsScreen />
    default:
      return <HomeScreen />
  }
}
