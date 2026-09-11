import { useState } from 'react'
import { useSession } from './context/SessionContext.jsx'
import logo from './assets/reform-logo.png'
import Home from './pages/Home.jsx'
import Assessment from './pages/Assessment.jsx'
import { LanguageToggle, useLanguage } from './i18n.jsx'
import { useAuth } from './context/AuthContext.jsx'

export default function App() {
  const { session, close } = useSession()
  const { t } = useLanguage()
  const { profile, signOut } = useAuth()
  const [view, setView] = useState('home') // 'home' | 'assessment'

  const openAssessment = () => setView('assessment')
  const exitAssessment = () => { close(); setView('home') }

  return (
    <div className="app-root">
      <header className="app-header">
        <img src={logo} alt="REFORM" className="app-logo" />
        <div className="app-header-meta">
          <span className="app-title">{t('toolkit')}</span>
          {session && view === 'assessment' && (
            <span className="app-subject">
              {session.profile?.name || 'Unnamed'} · ID {session.profile?.prisonerId || '—'}
            </span>
          )}
        </div>
        <LanguageToggle />
        <div className="user-chip">
          <span><strong>{profile?.display_name || profile?.access_id}</strong><small>{(profile?.role || '').replaceAll('_', ' ')}</small></span>
          <button className="btn-ghost" onClick={signOut}>Sign out</button>
        </div>
      </header>
      <main className="app-main">
        {view === 'home'
          ? <Home onOpen={openAssessment} />
          : <Assessment onExit={exitAssessment} />}
      </main>
    </div>
  )
}
