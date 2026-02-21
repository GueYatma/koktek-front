import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { CartItem, Product, Variant } from '../types'
import { getAllProducts } from '../lib/directusApi'
import {
  addCartItem,
  createCart,
  getCartItems,
  removeCartItem,
  updateCartItem,
  type CartItemRecord,
} from '../lib/commerceApi'

const STORAGE_KEY = 'koktek_cart_v1'
const CART_ID_KEY = 'koktek_cart_id_v1' // Stocke l'identifiant du panier Directus.

type CartContextValue = {
  items: CartItem[]
  cartId: string | null
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

const readCartId = (): string | null => {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(CART_ID_KEY) // Lecture du cart_id côté client.
}

const writeCartId = (cartId: string) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CART_ID_KEY, cartId) // Persistance du cart_id Directus.
}

const normalizeId = (value: unknown): string => {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value)
  }
  if (value && typeof value === 'object' && 'id' in value) {
    const nestedId = (value as { id?: unknown }).id
    if (typeof nestedId === 'string' || typeof nestedId === 'number') {
      return String(nestedId)
    }
  }
  return ''
}

const buildItemKey = (variantId?: string | null, productId?: string) => {
  if (variantId) return variantId
  if (productId) return `product:${productId}`
  return ''
}

const mapRemoteItems = (
  records: CartItemRecord[],
  products: Product[],
  variants: Variant[],
) => {
  const productsById = new Map(products.map((product) => [product.id, product]))
  const variantsById = new Map(variants.map((variant) => [variant.id, variant]))
  const mappedItems: CartItem[] = []
  const idMap: Record<string, string> = {}

  records.forEach((record) => {
    const productId = normalizeId(record.product_id as unknown)
    const variantId = normalizeId(record.variant_id as unknown)
    const variant = variantId ? variantsById.get(variantId) : undefined
    const product =
      productsById.get(productId) ??
      (variant ? productsById.get(variant.product_id) : undefined)

    if (!product) return

    const resolvedVariant: Variant =
      variant ??
      ({
        id: variantId || product.id,
        product_id: product.id,
        sku: '',
        option1_name: '',
        option1_value: '',
        price: Number(record.unit_price ?? product.base_price ?? 0),
        stock_quantity: 0,
        cj_vid: '',
      } satisfies Variant)

    const quantity = Number(record.quantity)
    if (!Number.isFinite(quantity) || quantity <= 0) return

    mappedItems.push({
      product,
      variant: resolvedVariant,
      quantity,
    })

    const key = buildItemKey(variantId, product.id)
    if (key) {
      idMap[key] = record.id
    }
  })

  return { mappedItems, idMap }
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => readStorage())
  const [cartId, setCartId] = useState<string | null>(() => readCartId())
  const [cartItemIdsByVariant, setCartItemIdsByVariant] = useState<
    Record<string, string>
  >({})

  const cartItemIdsRef = useRef<Record<string, string>>(cartItemIdsByVariant)
  const cartPromiseRef = useRef<Promise<string> | null>(null)
  const catalogRef = useRef<{ products: Product[]; variants: Variant[] } | null>(
    null,
  )

  useEffect(() => {
    cartItemIdsRef.current = cartItemIdsByVariant // Garde l'index des items pour la sync Directus.
  }, [cartItemIdsByVariant])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const loadCatalog = useCallback(async () => {
    if (catalogRef.current) return catalogRef.current
    const { products, variants } = await getAllProducts() // Charge le catalogue pour enrichir les items Directus.
    catalogRef.current = { products, variants }
    return catalogRef.current
  }, [])

  const ensureCartId = useCallback(async () => {
    if (cartId) return cartId
    if (cartPromiseRef.current) {
      return cartPromiseRef.current // Évite de créer plusieurs paniers en parallèle.
    }

    cartPromiseRef.current = (async () => {
      const cart = await createCart({ status: 'open', currency: 'EUR' }) // Crée un panier côté Directus.
      setCartId(cart.id)
      writeCartId(cart.id)
      return cart.id
    })()

    try {
      return await cartPromiseRef.current
    } finally {
      cartPromiseRef.current = null
    }
  }, [cartId])

  useEffect(() => {
    if (!cartId) return
    let isActive = true

    const syncFromDirectus = async () => {
      try {
        const [records, catalog] = await Promise.all([
          getCartItems(cartId), // Récupère les items du panier depuis Directus.
          loadCatalog(), // Assure le mapping vers Product/Variant.
        ])

        if (!isActive) return

        const { mappedItems, idMap } = mapRemoteItems(
          records,
          catalog.products,
          catalog.variants,
        )

        setItems(mappedItems) // Met à jour l'état local avec la source Directus.
        setCartItemIdsByVariant(idMap) // Stocke l'id Directus de chaque ligne.
      } catch (error) {
        console.error('Erreur sync panier Directus', error)
      }
    }

    void syncFromDirectus()

    return () => {
      isActive = false
    }
  }, [cartId, loadCatalog])

  const addItem = useCallback(
    (product: Product, variant: Variant, quantity = 1) => {
      let nextQuantity = quantity

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
          }
          nextQuantity = updatedQuantity
          return next
        }
        return [...prev, { product, variant, quantity }]
      })

      void (async () => {
        try {
          const activeCartId = await ensureCartId() // Assure un cart_id avant la sync.
          if (!activeCartId) return

          const key = buildItemKey(variant.id, product.id)
          const existingId = cartItemIdsRef.current[key]

          if (existingId) {
            await updateCartItem(existingId, { quantity: nextQuantity }) // Sync quantité Directus.
            return
          }

          const created = await addCartItem({
            cart_id: activeCartId,
            product_id: product.id,
            variant_id: variant.id,
            quantity: nextQuantity,
            unit_price: variant.price,
            currency: 'EUR',
          })

          if (key) {
            setCartItemIdsByVariant((prev) => ({
              ...prev,
              [key]: created.id, // Stocke l'id Directus de la nouvelle ligne.
            }))
          }
        } catch (error) {
          console.error('Erreur ajout panier Directus', error)
        }
      })()
    },
    [ensureCartId],
  )

  const removeItem = useCallback(
    (variantId: string) => {
      setItems((prev) => prev.filter((item) => item.variant.id !== variantId))

      void (async () => {
        try {
          const activeCartId = await ensureCartId() // Assure un cart_id avant suppression.
          if (!activeCartId) return

          const key = buildItemKey(variantId)
          const existingId = cartItemIdsRef.current[key]

          if (!existingId) return

          await removeCartItem(existingId) // Supprime la ligne dans Directus.

          setCartItemIdsByVariant((prev) => {
            const next = { ...prev }
            delete next[key] // Retire la référence locale après suppression.
            return next
          })
        } catch (error) {
          console.error('Erreur suppression panier Directus', error)
        }
      })()
    },
    [ensureCartId],
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

      void (async () => {
        try {
          const activeCartId = await ensureCartId() // Assure un cart_id avant update.
          if (!activeCartId) return

          const key = buildItemKey(variantId)
          const existingId = cartItemIdsRef.current[key]

          if (!existingId) return

          if (quantity <= 0) {
            await removeCartItem(existingId) // Supprime si quantité nulle.
            setCartItemIdsByVariant((prev) => {
              const next = { ...prev }
              delete next[key]
              return next
            })
            return
          }

          await updateCartItem(existingId, { quantity }) // Sync quantité Directus.
        } catch (error) {
          console.error('Erreur mise à jour panier Directus', error)
        }
      })()
    },
    [ensureCartId],
  )

  const clearCart = useCallback(() => {
    setItems([])
    setCartItemIdsByVariant({})
    setCartId(null)
    cartPromiseRef.current = null

    if (typeof window === 'undefined') return
    window.localStorage.removeItem(STORAGE_KEY)
    window.localStorage.removeItem(CART_ID_KEY)
  }, [])

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
      cartId,
      itemCount,
      total,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    }),
    [
      items,
      cartId,
      itemCount,
      total,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
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
