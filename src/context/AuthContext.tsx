import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type AuthUser = {
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  addressLine1?: string
  addressLine2?: string
  zip?: string
  city?: string
  country?: string
}

type AuthContextValue = {
  user: AuthUser | null
  login: (email: string) => Promise<void>
  register: (email: string) => Promise<void>
  logout: () => void
  updateProfile: (data: Partial<AuthUser>) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)
const STORAGE_KEY = 'koktek_customer_profile_v1'

const readStoredUser = (): AuthUser | null => {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    if (typeof parsed.email !== 'string' || !parsed.email.trim()) return null
    return parsed as AuthUser
  } catch {
    return null
  }
}

const writeStoredUser = (user: AuthUser | null) => {
  if (typeof window === 'undefined') return
  if (!user) {
    window.localStorage.removeItem(STORAGE_KEY)
    return
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser())

  const login = useCallback(async (email: string) => {
    const nextUser: AuthUser = { email }
    setUser(nextUser)
    writeStoredUser(nextUser)
  }, [])

  const register = useCallback(async (email: string) => {
    const nextUser: AuthUser = { email }
    setUser(nextUser)
    writeStoredUser(nextUser)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    writeStoredUser(null)
  }, [])

  const updateProfile = useCallback((data: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) {
        if (!data.email) return prev
        const nextUser = { email: data.email, ...data }
        writeStoredUser(nextUser)
        return nextUser
      }
      const nextUser = { ...prev, ...data }
      writeStoredUser(nextUser)
      return nextUser
    })
  }, [])

  const value = useMemo(
    () => ({
      user,
      login,
      register,
      logout,
      updateProfile,
    }),
    [user, login, register, logout, updateProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth doit etre utilise dans AuthProvider')
  }
  return context
}
