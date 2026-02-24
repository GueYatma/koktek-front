/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { CartItem, Product, ShippingOption, Variant } from '../types'

const STORAGE_KEY = 'koktek_cart_v1'
const CART_ID_KEY = 'koktek_cart_id_v1' // Stocke l'identifiant du panier Directus.

type CartContextValue = {
  items: CartItem[]
  cartId: string | null
  itemCount: number
  total: number
  shippingTotal: number
  addItem: (product: Product, variant: Variant, quantity?: number, shippingOption?: ShippingOption) => void
  removeItem: (variantId: string) => void
  updateQuantity: (variantId: string, quantity: number) => void
  clearCart: () => void
  setCartId: (cartId: string | null) => void
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

const readCartId = (): string | null => {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(CART_ID_KEY) // Lecture du cart_id côté client.
}

const writeCartId = (cartId: string) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CART_ID_KEY, cartId) // Persistance du cart_id Directus.
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => readStorage())
  const [cartId, setCartIdState] = useState<string | null>(() => readCartId())

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const setCartId = useCallback((nextCartId: string | null) => {
    setCartIdState(nextCartId)
    if (typeof window === 'undefined') return
    if (nextCartId) {
      writeCartId(nextCartId)
    } else {
      window.localStorage.removeItem(CART_ID_KEY)
    }
  }, [])

  const addItem = useCallback(
    (product: Product, variant: Variant, quantity = 1, shippingOption?: ShippingOption) => {
      setItems((prev) => {
        const existingIndex = prev.findIndex(
          (item) => item.variant.id === variant.id,
        )
        if (existingIndex >= 0) {
          const next = [...prev]
          const current = next[existingIndex]
          const updatedQuantity = current.quantity + quantity
          next[existingIndex] = {
            ...current,
            quantity: updatedQuantity,
            shippingOption: shippingOption ?? current.shippingOption,
          }
          return next
        }
        return [...prev, { product, variant, quantity, shippingOption }]
      })
    },
    [],
  )

  const removeItem = useCallback(
    (variantId: string) => {
      setItems((prev) => prev.filter((item) => item.variant.id !== variantId))
    },
    [],
  )

  const updateQuantity = useCallback(
    (variantId: string, quantity: number) => {
      setItems((prev) =>
        prev
          .map((item) =>
            item.variant.id === variantId ? { ...item, quantity } : item,
          )
          .filter((item) => item.quantity > 0),
      )
    },
    [],
  )

  const clearCart = useCallback(() => {
    setItems([])
    setCartIdState(null)

    if (typeof window === 'undefined') return
    window.localStorage.removeItem(STORAGE_KEY)
    window.localStorage.removeItem(CART_ID_KEY)
  }, [])

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  )

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.product.retail_price * item.quantity, 0),
    [items]
  )

  const shippingTotal = useMemo(() => {
    if (items.length === 0) return 0;
    if (subtotal >= 50) return 0; // Règle 1 : Franco de port

    let maxShippingPrice = 0;
    items.forEach((item) => {
      const itemShipping = Number(item.shippingOption?.price) || 0;
      if (itemShipping > maxShippingPrice) {
        maxShippingPrice = itemShipping;
      }
    });

    // Règle 2 & 3 : Forfait max de 1 à 3 articles, puis +1€ par article supplémentaire
    if (itemCount <= 3) {
      return maxShippingPrice;
    } else {
      return maxShippingPrice + (itemCount - 3);
    }
  }, [items, subtotal, itemCount]);

  const total = useMemo(
    () => subtotal + shippingTotal,
    [subtotal, shippingTotal],
  )

  const value = useMemo(
    () => ({
      items,
      cartId,
      itemCount,
      total,
      shippingTotal,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      setCartId,
    }),
    [
      items,
      cartId,
      itemCount,
      total,
      shippingTotal,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      setCartId,
    ],
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
