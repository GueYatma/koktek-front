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
  birthdate?: string
  gender?: 'Homme' | 'Femme'
  phone?: string
  addressLine1?: string
  addressLine2?: string
  zip?: string
  city?: string
  country?: string
}

type AuthContextValue = {
  user: AuthUser | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
  updateProfile: (data: Partial<AuthUser>) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null)

  const login = useCallback(async (email: string, _password: string) => {
    setUser({
      email,
      firstName: 'Camille',
      lastName: 'Durand',
      birthdate: '1992-04-15',
      gender: 'Femme',
      phone: '06 12 34 56 78',
      addressLine1: '12 Avenue des Champs-Elysees',
      addressLine2: 'Batiment B',
      zip: '75008',
      city: 'Paris',
      country: 'France',
    })
  }, [])

  const register = useCallback(async (email: string, _password: string) => {
    setUser({
      email,
      firstName: '',
      lastName: '',
      birthdate: '',
      gender: 'Homme',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      zip: '',
      city: '',
      country: 'France',
    })
  }, [])

  const logout = useCallback(() => {
    setUser(null)
  }, [])

  const updateProfile = useCallback((data: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : prev))
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
