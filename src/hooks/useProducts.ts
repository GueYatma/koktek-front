import { useCallback, useEffect, useState } from 'react'
import { fetchTable, fetchTableRaw } from '../lib/nocoApi'
import { NOCO_TABLES } from '../lib/nocoConfig'
import type { Category, Product, Variant } from '../types'

type VariantWithImage = Variant & {
  image_url?: string
}

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

const toStringValue = (value: unknown) => {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  return ''
}

const toNumberValue = (value: unknown) => {
  if (typeof value === 'number') return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const extractId = (value: unknown): string => {
  if (Array.isArray(value) && value.length > 0) {
    return extractId(value[0])
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value)
  }
  if (value && typeof value === 'object' && 'id' in value) {
    return toStringValue((value as { id?: unknown }).id)
  }
  return ''
}

const createSlug = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

const normalizeImageUrl = (value: unknown): string => {
  if (!value) return ''
  if (typeof value === 'string') {
    return value.startsWith('http') ? value : ''
  }
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0]
    if (typeof first === 'string') {
      return first.startsWith('http') ? first : ''
    }
    if (first && typeof first === 'object') {
      const url = toStringValue(
        (first as Record<string, unknown>).url ??
          (first as Record<string, unknown>).path,
      )
      return url.startsWith('http') ? url : ''
    }
    return ''
  }
  if (typeof value === 'object') {
    const url = toStringValue(
      (value as Record<string, unknown>).url ??
        (value as Record<string, unknown>).path,
    )
    return url.startsWith('http') ? url : ''
  }
  return ''
}

const normalizeImageList = (value: unknown): string[] => {
  if (!value) return []
  if (Array.isArray(value)) {
    return value
      .flatMap((entry) => normalizeImageList(entry))
      .filter((url) => url.length > 0)
  }
  const url = normalizeImageUrl(value)
  return url ? [url] : []
}

const mapProduct = (row: Record<string, unknown>): Product => {
  const title = toStringValue(row.title ?? row.name)
  const slug = toStringValue(row.slug) || createSlug(title) || extractId(row.id)
  const productId = extractId(row.id ?? row.ID ?? row.Id) || slug

  const brand = toStringValue(
    row.brand ?? row.Brand ?? row.marque ?? row.Marque,
  ).trim()

  const status = toStringValue(row.status ?? row.Status ?? row.STATUS)
  const categories =
    row.categories ?? row.category ?? row.Category ?? row.category_name

  const images = normalizeImageList(
    row.images ??
      row.gallery ??
      row.image_urls ??
      row.imageUrls ??
      row.image_url ??
      row.imageUrl ??
      row.image ??
      row.Image,
  )

  const primaryImage =
    images[0] ||
    normalizeImageUrl(
      row.image_url ?? row.imageUrl ?? row.image ?? row.Image,
    )

  const rawVariants = Array.isArray(row.product_variants)
    ? row.product_variants
    : []
  const product_variants = rawVariants.map((variantRow) => {
    const variant = mapVariant(variantRow as Record<string, unknown>)
    if (!variant.product_id && productId) {
      return { ...variant, product_id: productId }
    }
    return variant
  })

  return {
    id: productId,
    title,
    slug,
    description: toStringValue(row.description),
    base_price: toNumberValue(
      row.base_price ?? row.basePrice ?? row.price ?? row.Price,
    ),
    retail_price: toNumberValue(
      row.retail_price ??
        row.retailPrice ??
        row.retail ??
        row.RetailPrice ??
        row.base_price ??
        row.basePrice ??
        row.price ??
        row.Price,
    ),
    status,
    category_id: extractId(
      row.nc_category_id ??
        row.ncCategoryId ??
        row.category_id ??
        row.categoryId ??
        row.category ??
        row.Category,
    ),
    categories,
    product_variants,
    image_url: primaryImage,
    images,
    brand: brand.length > 0 ? brand : 'Générique',
  }
}

const mapCategory = (row: Record<string, unknown>): Category => {
  const name = toStringValue(row.name ?? row.title)
  const slug = toStringValue(row.slug) || createSlug(name) || extractId(row.id)

  return {
    id:
      extractId(row.nc_category_id ?? row.ncCategoryId ?? row.id ?? row.ID ?? row.Id) ||
      slug,
    name,
    slug,
    image_url: normalizeImageUrl(
      row.image_url ?? row.imageUrl ?? row.image ?? row.Image,
    ),
  }
}

function mapVariant(row: Record<string, unknown>): VariantWithImage {
  return {
    id: extractId(row.id ?? row.ID ?? row.Id),
    product_id: extractId(
      row.product_uuid ??
        row.productUuid ??
        row.product_id ??
        row.productId ??
        row.products ??
        row.Products ??
        row.product ??
        row.Product,
    ),
    sku: toStringValue(row.sku ?? row.SKU),
    option1_name: toStringValue(row.option1_name ?? row.optionName ?? row.option),
    option1_value: toStringValue(
      row.option1_value ?? row.optionValue ?? row.value,
    ),
    price: toNumberValue(row.price ?? row.Price ?? row.base_price),
    stock_quantity: toNumberValue(
      row.stock_quantity ?? row.stockQuantity ?? row.quantity,
    ),
    cj_vid: toStringValue(row.cj_vid ?? row.cjVid ?? row.vendor_id),
    image_url: normalizeImageUrl(
      row.image_url ?? row.imageUrl ?? row.image ?? row.Image,
    ),
  }
}

const fetchProducts = async (): Promise<{
  products: Product[]
  variants: Variant[]
}> => {
  const data = await fetchTableRaw<Record<string, unknown>>(
    NOCO_TABLES.products,
    {
      params: {
        'nested[product_variants]': 'true',
        'nested[product_variants][fields]': '*',
      },
    },
  )
  console.log('Raw API Data:', data)
  const rows = Array.isArray(data.list) ? data.list : []
  if (rows.length === 0) {
    return { products: [], variants: [] }
  }

  const mappedProducts = rows
    .map(mapProduct)
    .filter(
      (product) => (product.status ?? '').toLowerCase() === 'published',
    )
  const nestedVariants = rows.flatMap((row, index) => {
    const productId =
      mappedProducts[index]?.id ?? extractId(row.id ?? row.ID ?? row.Id)
    const nested = Array.isArray(row.product_variants)
      ? row.product_variants
      : []

    return nested.map((variantRow) => {
      const variant = mapVariant(variantRow as Record<string, unknown>)
      if (!variant.product_id && productId) {
        return { ...variant, product_id: productId }
      }
      return variant
    })
  })

  console.log('Mapped Products:', mappedProducts)
  console.log('Marques trouvées:', mappedProducts.map((product) => product.brand))
  // DEBUG: ne pas filtrer pour voir toutes les entrées retournées par l'API.
  return { products: mappedProducts, variants: nestedVariants }
}

const fetchCategories = async (): Promise<Category[]> => {
  const rows = await fetchTable<Record<string, unknown>>(NOCO_TABLES.categories)
  if (rows.length === 0) return []
  return rows
    .map(mapCategory)
    .filter((category) => category.id && category.name)
}

const fetchVariants = async (): Promise<Variant[]> => {
  const rows = await fetchTable<Record<string, unknown>>(NOCO_TABLES.variants)
  if (rows.length === 0) return []
  return rows
    .map(mapVariant)
    .filter((variant) => variant.id && variant.product_id)
}

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
    const baseUrl = import.meta.env.VITE_API_URL as string | undefined
    const token = import.meta.env.VITE_API_TOKEN as string | undefined
    const projectName = import.meta.env.VITE_PROJECT_NAME as string | undefined

    if (!baseUrl || !projectName) {
      console.warn('NocoDB env manquant pour meta tables')
      return
    }

    const endpoint = new URL(
      `/api/v1/db/meta/projects/${projectName}/tables`,
      baseUrl,
    )

    fetch(endpoint.toString(), {
      headers: {
        'xc-token': token ?? '',
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`NocoDB meta tables error: ${response.status}`)
        }
        return response.json()
      })
      .then((tables) => {
        console.log('AVAILABLE TABLES:', tables)
      })
      .catch((error) => {
        console.error('Erreur NocoDB meta tables', error)
      })
  }, [])

  useEffect(() => {
    let isMounted = true
    const timer = setTimeout(() => {
      const load = async () => {
        try {
          const [productPayload, categories, variants] = await Promise.all([
            fetchProducts(),
            fetchCategories(),
            fetchVariants(),
          ])

          if (!isMounted) return

          const mergedVariants =
            productPayload.variants.length > 0
              ? productPayload.variants
              : variants

          setState({
            categories: categories.length > 0 ? categories : mockCategories,
            products: productPayload.products,
            variants: mergedVariants.length > 0 ? mergedVariants : [],
          })
        } catch (error) {
          console.error('Erreur lors du chargement NocoDB', error)
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
      try {
        const rows = await fetchTable<Record<string, unknown>>(
          NOCO_TABLES.variants,
          { where: `(product_uuid,eq,${productId})` },
        )
        if (rows.length === 0) return []
        return rows
          .map(mapVariant)
          .filter((variant) => variant.id && variant.product_id)
      } catch (error) {
        console.error('Erreur lors du chargement des variantes', error)
        return []
      }
    },
    [],
  )

  return {
    ...state,
    loading,
    getProductBySlug,
    getCategoryById,
    getVariantsByProductId,
  }
}
