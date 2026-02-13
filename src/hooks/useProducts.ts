import { useCallback, useEffect, useState } from 'react'
import { MOCK_PRODUCTS } from '../data/mockProducts'
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

const mockVariants: Variant[] = [
  {
    id: 'var-lux-15-pro-noir',
    product_id: 'prod-case-lux-15-pro',
    sku: 'KOK-CLMP15P-NM',
    option1_name: 'Couleur',
    option1_value: 'Noir Minuit',
    price: 39.9,
    stock_quantity: 42,
    cj_vid: 'cj-1001',
  },
  {
    id: 'var-lux-15-pro-sable',
    product_id: 'prod-case-lux-15-pro',
    sku: 'KOK-CLMP15P-SD',
    option1_name: 'Couleur',
    option1_value: 'Sable Doré',
    price: 41.9,
    stock_quantity: 30,
    cj_vid: 'cj-1002',
  },
  {
    id: 'var-lux-15-pro-bleu',
    product_id: 'prod-case-lux-15-pro',
    sku: 'KOK-CLMP15P-BP',
    option1_name: 'Couleur',
    option1_value: 'Bleu Profond',
    price: 41.9,
    stock_quantity: 18,
    cj_vid: 'cj-1003',
  },
  {
    id: 'var-clear-15-transparent',
    product_id: 'prod-case-clear-15',
    sku: 'KOK-CTAC15-TR',
    option1_name: 'Finition',
    option1_value: 'Transparent',
    price: 29.9,
    stock_quantity: 56,
    cj_vid: 'cj-2001',
  },
  {
    id: 'var-clear-15-fume',
    product_id: 'prod-case-clear-15',
    sku: 'KOK-CTAC15-FM',
    option1_name: 'Finition',
    option1_value: 'Fumé',
    price: 31.9,
    stock_quantity: 40,
    cj_vid: 'cj-2002',
  },
  {
    id: 'var-vegan-15-pro-max-foret',
    product_id: 'prod-case-vegan-15-pro-max',
    sku: 'KOK-CCV15PM-VF',
    option1_name: 'Couleur',
    option1_value: 'Vert Forêt',
    price: 49.9,
    stock_quantity: 22,
    cj_vid: 'cj-3001',
  },
  {
    id: 'var-vegan-15-pro-max-cognac',
    product_id: 'prod-case-vegan-15-pro-max',
    sku: 'KOK-CCV15PM-CO',
    option1_name: 'Couleur',
    option1_value: 'Cognac',
    price: 52.9,
    stock_quantity: 15,
    cj_vid: 'cj-3002',
  },
  {
    id: 'var-glass-9h-15',
    product_id: 'prod-glass-9h',
    sku: 'KOK-VT9H-15',
    option1_name: 'Modèle',
    option1_value: 'iPhone 15 / 15 Pro',
    price: 19.9,
    stock_quantity: 80,
    cj_vid: 'cj-4001',
  },
  {
    id: 'var-glass-9h-15-pro-max',
    product_id: 'prod-glass-9h',
    sku: 'KOK-VT9H-15PM',
    option1_name: 'Modèle',
    option1_value: 'iPhone 15 Pro Max',
    price: 21.9,
    stock_quantity: 62,
    cj_vid: 'cj-4002',
  },
  {
    id: 'var-magsafe-20w-blanc',
    product_id: 'prod-magsafe-20w',
    sku: 'KOK-MSF20W-WH',
    option1_name: 'Couleur',
    option1_value: 'Blanc Perle',
    price: 59,
    stock_quantity: 27,
    cj_vid: 'cj-5001',
  },
  {
    id: 'var-magsafe-20w-noir',
    product_id: 'prod-magsafe-20w',
    sku: 'KOK-MSF20W-BK',
    option1_name: 'Couleur',
    option1_value: 'Noir Graphite',
    price: 59,
    stock_quantity: 24,
    cj_vid: 'cj-5002',
  },
  {
    id: 'var-usbc-braided-1m',
    product_id: 'prod-usbc-braided',
    sku: 'KOK-USBC-1M',
    option1_name: 'Longueur',
    option1_value: '1 m',
    price: 24.9,
    stock_quantity: 75,
    cj_vid: 'cj-6001',
  },
  {
    id: 'var-usbc-braided-2m',
    product_id: 'prod-usbc-braided',
    sku: 'KOK-USBC-2M',
    option1_name: 'Longueur',
    option1_value: '2 m',
    price: 29.9,
    stock_quantity: 50,
    cj_vid: 'cj-6002',
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
    const timer = setTimeout(() => {
      setState({
        categories: mockCategories,
        products: MOCK_PRODUCTS,
        variants: mockVariants,
      })
      setLoading(false)
    }, 250)

    return () => clearTimeout(timer)
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
    (productId: string) =>
      state.variants.filter((variant) => variant.product_id === productId),
    [state.variants],
  )

  return {
    ...state,
    loading,
    getProductBySlug,
    getCategoryById,
    getVariantsByProductId,
  }
}
