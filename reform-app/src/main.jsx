import React from 'react'
import { createRoot } from 'react-dom/client'
import './theme.css'
import './app.css'
import App from './App.jsx'
import { SessionProvider } from './context/SessionContext.jsx'
import { LanguageProvider } from './i18n.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import AccessGate from './components/AccessGate.jsx'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <AccessGate>
          <SessionProvider>
            <App />
          </SessionProvider>
        </AccessGate>
      </AuthProvider>
    </LanguageProvider>
  </React.StrictMode>,
)
