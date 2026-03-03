import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

type ThemeContextValue = {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggleTheme: () => {},
})

export const useTheme = () => useContext(ThemeContext)

/**
 * ThemeProvider
 * - Lit la préférence système (prefers-color-scheme: dark) AU PREMIER RENDU.
 * - Vérifie aussi si l'utilisateur avait déjà choisi manuellement via localStorage.
 * - Ajoute/supprime la classe `dark` sur <html> pour activer les variantes Tailwind.
 * - Expose `toggleTheme()` pour un éventuel bouton bascule.
 */
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // 1. Vérifier la préférence persistée
    const stored = localStorage.getItem('koktek:theme')
    if (stored === 'dark' || stored === 'light') return stored
    // 2. Fallback sur la préférence système
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
    return 'light'
  })

  // Applique la classe au chargement et à chaque changement
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('koktek:theme', theme)
  }, [theme])

  // Écoute les changements de préférence système (ex: l'utilisateur active le dark mode depuis l'OS)
  // mais seulement si aucune préférence manuelle n'a été enregistrée.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      const stored = localStorage.getItem('koktek:theme')
      if (!stored) {
        setTheme(e.matches ? 'dark' : 'light')
      }
    }
    mq.addEventListener('change', handleChange)
    return () => mq.removeEventListener('change', handleChange)
  }, [])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
