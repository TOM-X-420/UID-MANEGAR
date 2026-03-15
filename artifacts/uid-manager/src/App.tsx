import { LanguageProvider } from './i18n'
import UIDManager from './components/UIDManager'

export default function App() {
  return (
    <LanguageProvider>
      <UIDManager />
    </LanguageProvider>
  )
}
