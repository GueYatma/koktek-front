import { useCallback, useEffect, useState } from 'react'
import { getAllProducts } from '../lib/directusApi'
import type { Category, Product, Variant } from '../types'

const mockCategories: Category[] = [
  {
    id: 'cat-iphone-cases',
    name: 'Coques iPhone',
    slug: 'coques-iphone',
    image_url:
      'https://images.unsplash.com/photo-1523464862212-d6631d073194?q=80&w=1600&auto=format&fit=crop',
  },
  {
    id: 'cat-screen',
    name: 'Verres Trempés',
    slug: 'verres-trempes',
    image_url:
      'https://images.unsplash.com/photo-1481277542470-605612bd2d61?q=80&w=1600&auto=format&fit=crop',
  },
  {
    id: 'cat-magsafe',
    name: 'Chargeurs MagSafe',
    slug: 'chargeurs-magsafe',
    image_url:
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1600&auto=format&fit=crop',
  },
  {
    id: 'cat-cables',
    name: 'Câbles',
    slug: 'cables',
    image_url:
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1600&auto=format&fit=crop',
  },
  {
    id: 'cat-car-mount',
    name: 'Support Voiture',
    slug: 'support-voiture',
    image_url:
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1600&auto=format&fit=crop',
  },
]

type ProductsState = {
  categories: Category[]
  products: Product[]
  variants: Variant[]
}

export const useProducts = () => {
  const [state, setState] = useState<ProductsState>({
    categories: [],
    products: [],
    variants: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const timer = setTimeout(() => {
      const load = async () => {
        try {
          const payload = await getAllProducts()

          if (!isMounted) return

          setState({
            categories:
              payload.categories.length > 0
                ? payload.categories
                : mockCategories,
            products: payload.products,
            variants: payload.variants,
          })
        } catch (error) {
          console.error('Erreur lors du chargement Directus', error)
          if (!isMounted) return
          setState({
            categories: mockCategories,
            products: [],
            variants: [],
          })
        } finally {
          if (isMounted) {
            setLoading(false)
          }
        }
      }

      void load()
    }, 250)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [])

  const getProductBySlug = useCallback(
    (slug: string) => state.products.find((product) => product.slug === slug),
    [state.products],
  )

  const getCategoryById = useCallback(
    (id: string) => state.categories.find((category) => category.id === id),
    [state.categories],
  )

  const getVariantsByProductId = useCallback(
    async (productId: string): Promise<Variant[]> => {
      if (!productId) return []
      const normalizedId = String(productId)
      const fromVariants = state.variants.filter(
        (variant) => String(variant.product_id) === normalizedId,
      )
      if (fromVariants.length > 0) return fromVariants

      const fallbackProduct = state.products.find(
        (product) => String(product.id) === normalizedId,
      )
      return Array.isArray(fallbackProduct?.product_variants)
        ? fallbackProduct.product_variants
        : []
    },
    [state.products, state.variants],
  )

  return {
    ...state,
    loading,
    getProductBySlug,
    getCategoryById,
    getVariantsByProductId,
  }
}
