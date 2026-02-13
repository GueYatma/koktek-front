import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { CartItem, Product, Variant } from '../types'

const STORAGE_KEY = 'koktek_cart_v1'

type CartContextValue = {
  items: CartItem[]
  itemCount: number
  total: number
  addItem: (product: Product, variant: Variant, quantity?: number) => void
  removeItem: (variantId: string) => void
  updateQuantity: (variantId: string, quantity: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

const readStorage = (): CartItem[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item) =>
        item &&
        typeof item === 'object' &&
        item.product &&
        item.variant &&
        typeof item.quantity === 'number',
    )
  } catch {
    return []
  }
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => readStorage())

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addItem = useCallback(
    (product: Product, variant: Variant, quantity = 1) => {
      setItems((prev) => {
        const existingIndex = prev.findIndex(
          (item) => item.variant.id === variant.id,
        )
        if (existingIndex >= 0) {
          const next = [...prev]
          const current = next[existingIndex]
          next[existingIndex] = {
            ...current,
            quantity: current.quantity + quantity,
          }
          return next
        }
        return [...prev, { product, variant, quantity }]
      })
    },
    [],
  )

  const removeItem = useCallback((variantId: string) => {
    setItems((prev) => prev.filter((item) => item.variant.id !== variantId))
  }, [])

  const updateQuantity = useCallback((variantId: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.variant.id === variantId ? { ...item, quantity } : item,
        )
        .filter((item) => item.quantity > 0),
    )
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const total = useMemo(
    () =>
      items.reduce((sum, item) => sum + item.variant.price * item.quantity, 0),
    [items],
  )

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  )

  const value = useMemo(
    () => ({
      items,
      itemCount,
      total,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    }),
    [items, itemCount, total, addItem, removeItem, updateQuantity, clearCart],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart doit être utilisé dans CartProvider')
  }
  return context
}
