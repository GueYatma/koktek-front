import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { UIProvider } from './context/UIContext'
import { AuthProvider } from './context/AuthContext'
import './index.css'

const setFavicon = () => {
  const link = document.querySelector("link[rel='icon']") as
    | HTMLLinkElement
    | null
  if (!link) return
  const isLocal =
    import.meta.env.DEV || window.location.hostname === 'localhost'
  link.href = isLocal ? '/favicon-local.svg' : '/favicon.svg'
}

setFavicon()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <UIProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </UIProvider>
  </React.StrictMode>,
)
