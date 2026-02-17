import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

type UIContextValue = {
  isContactOpen: boolean
  openContact: () => void
  closeContact: () => void
  toggleContact: () => void
}

const UIContext = createContext<UIContextValue | null>(null)

export const UIProvider = ({ children }: { children: ReactNode }) => {
  const [isContactOpen, setIsContactOpen] = useState(false)

  const value = useMemo(
    () => ({
      isContactOpen,
      openContact: () => setIsContactOpen(true),
      closeContact: () => setIsContactOpen(false),
      toggleContact: () => setIsContactOpen((prev) => !prev),
    }),
    [isContactOpen],
  )

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

export const useUI = () => {
  const context = useContext(UIContext)
  if (!context) {
    throw new Error('useUI doit être utilisé dans UIProvider')
  }
  return context
}
