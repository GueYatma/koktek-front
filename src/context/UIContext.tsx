/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

type UIContextValue = {
  isContactOpen: boolean
  openContact: () => void
  closeContact: () => void
  toggleContact: () => void
  isProfileOpen: boolean
  activeProfileTab: 'profile' | 'orders'
  openProfile: (tab?: 'profile' | 'orders') => void
  closeProfile: () => void
  toggleProfile: () => void
}

const UIContext = createContext<UIContextValue | null>(null)

export const UIProvider = ({ children }: { children: ReactNode }) => {
  const [isContactOpen, setIsContactOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [activeProfileTab, setActiveProfileTab] = useState<'profile' | 'orders'>('profile')

  const value = useMemo(
    () => ({
      isContactOpen,
      openContact: () => setIsContactOpen(true),
      closeContact: () => setIsContactOpen(false),
      toggleContact: () => setIsContactOpen((prev) => !prev),
      isProfileOpen,
      activeProfileTab,
      openProfile: (tab?: 'profile' | 'orders') => {
        if (tab) setActiveProfileTab(tab)
        setIsProfileOpen(true)
      },
      closeProfile: () => setIsProfileOpen(false),
      toggleProfile: () => setIsProfileOpen((prev) => !prev),
    }),
    [isContactOpen, isProfileOpen, activeProfileTab],
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
