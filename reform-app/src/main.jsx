import React from 'react'
import { createRoot } from 'react-dom/client'
import './theme.css'
import './app.css'
import App from './App.jsx'
import { SessionProvider } from './context/SessionContext.jsx'
import { LanguageProvider } from './i18n.jsx'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <SessionProvider>
        <App />
      </SessionProvider>
    </LanguageProvider>
  </React.StrictMode>,
)
