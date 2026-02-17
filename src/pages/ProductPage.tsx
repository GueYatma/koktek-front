import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useProducts } from '../hooks/useProducts'
import type { Variant } from '../types'

type VariantWithImage = Variant & {
  image_url?: string
}

const MODEL_KEYWORDS = [
  'iphone',
  'samsung',
  'pixel',
  'xiaomi',
  'redmi',
  'huawei',
  'honor',
  'oppo',
  'sony',
]

const cleanVariantName = (variantName: string, productTitle?: string) => {
  const raw = variantName.trim()
  if (!raw) return ''

  const lower = raw.toLowerCase()
  let matchIndex = -1

  for (const keyword of MODEL_KEYWORDS) {
    const idx = lower.indexOf(keyword)
    if (idx !== -1 && (matchIndex === -1 || idx < matchIndex)) {
      matchIndex = idx
    }
  }

  let cleaned =
    matchIndex !== -1
      ? raw.slice(matchIndex).trim()
      : raw

  if (matchIndex === -1 && productTitle) {
    const title = productTitle.trim()
    if (title) {
      const titleLower = title.toLowerCase()
      if (lower.startsWith(titleLower)) {
        cleaned = raw.slice(title.length).trim()
        cleaned = cleaned.replace(/^[-–—:|]+/, '').trim()
      }
    }
  }

  if (!cleaned) return raw

  cleaned = cleaned
    .replace(/([a-zA-Z])(\d)/g, '$1 $2')
    .replace(/(\d)([a-zA-Z])/g, '$1 $2')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()

  return cleaned || raw
}

const ProductPage = () => {
  const { slug } = useParams()
  const { addItem } = useCart()
  const { loading, getProductBySlug, getVariantsByProductId } = useProducts()

  const product = useMemo(
    () => (slug ? getProductBySlug(slug) : undefined),
    [getProductBySlug, slug],
  )

  const [variants, setVariants] = useState<VariantWithImage[]>([])
  const [selectedVariant, setSelectedVariant] =
    useState<VariantWithImage | null>(null)
  const [selectedImage, setSelectedImage] = useState('')

  useEffect(() => {
    let isActive = true

    const loadVariants = async () => {
      if (!product) {
        if (isActive) {
          setVariants([])
          setSelectedVariant(null)
        }
        return
      }

      const loadedVariants = await getVariantsByProductId(product.id)
      if (!isActive) return
      setVariants(loadedVariants)
      setSelectedVariant(loadedVariants[0] ?? null)
    }

    void loadVariants()

    return () => {
      isActive = false
    }
  }, [getVariantsByProductId, product?.id])

  const images = useMemo(() => {
    if (!product) return []
    const productImages =
      product.images && product.images.length > 0
        ? product.images
        : product.image_url
          ? [product.image_url]
          : []
    return productImages
  }, [product])

  useEffect(() => {
    if (images.length > 0) {
      setSelectedImage(images[0]!)
    } else {
      setSelectedImage('')
    }
  }, [images])

  const fallbackImage = images[0] || product?.image_url || ''
  const variantImage =
    selectedVariant?.image_url && selectedVariant.image_url.trim().length > 0
      ? selectedVariant.image_url
      : ''
  const displayImage = variantImage || selectedImage || fallbackImage

  const variantPrice = Number(selectedVariant?.price)
  const displayPrice =
    Number.isFinite(variantPrice) && variantPrice > 0
      ? variantPrice
      : product?.base_price ?? 0

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="text-sm text-gray-500">Chargement...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Produit introuvable
        </h1>
        <p className="mt-3 text-sm text-gray-500">
          Ce produit n'existe pas ou a été retiré de la boutique.
        </p>
        <Link
          to="/catalogue"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white"
        >
          Retour au catalogue
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-12 md:grid-cols-[3fr_2fr]">
        <div className="md:sticky md:top-24 md:self-start">
          <div className="animate-float h-[420px] overflow-hidden rounded-3xl bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] sm:h-[520px]">
            <img
              src={displayImage}
              alt={product.title}
              className="h-full w-full object-cover"
            />
          </div>
          {images.length > 1 && (
            <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {images.map((image) => {
                const isActive = image === displayImage
                return (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setSelectedImage(image)}
                    className={`overflow-hidden rounded-2xl border bg-white p-2 transition ${
                      isActive
                        ? 'border-gray-900 shadow-md'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img
                      src={image}
                      alt={product.title}
                      className="h-20 w-full object-contain"
                    />
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="space-y-10">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.35em] text-gray-500">
              Collection Koktek
            </p>
            <h1 className="text-4xl font-bold text-gray-900">
              {product.title}
            </h1>
            <p className="text-3xl font-semibold text-gray-900">
              {displayPrice} €
            </p>
            <div
              className="prose prose-base max-w-none text-gray-600"
              dangerouslySetInnerHTML={{
                __html: product.description || '',
              }}
            />
          </div>

          <div className="space-y-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
                Modèle
              </p>
              <p className="mt-2 text-lg font-semibold text-gray-900">
                {cleanVariantName(
                  selectedVariant?.option1_value ?? '',
                  product.title,
                ) || 'Standard'}
              </p>
            </div>

            {variants.length > 0 && variants.length < 6 ? (
              <div className="flex flex-wrap gap-2">
                {variants.map((variant) => {
                  const isSelected = variant.id === selectedVariant?.id
                  const label =
                    cleanVariantName(variant.option1_value ?? '', product.title) ||
                    variant.option1_value
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => setSelectedVariant(variant)}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        isSelected
                          ? 'border-black bg-black text-white'
                          : 'border-gray-300 bg-white text-gray-900 hover:border-black hover:bg-black hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            ) : variants.length >= 6 ? (
              <div className="relative">
                <select
                  value={selectedVariant?.id ?? ''}
                  onChange={(event) => {
                    const next = variants.find(
                      (variant) => variant.id === event.target.value,
                    )
                    if (next) setSelectedVariant(next)
                  }}
                  className="h-12 w-full appearance-none rounded-2xl border-2 border-gray-200 bg-white px-4 pr-10 text-sm font-semibold text-gray-900 transition focus:border-black focus:outline-none"
                >
                  {variants.map((variant) => {
                    const label =
                      cleanVariantName(variant.option1_value ?? '', product.title) ||
                      variant.option1_value
                    return (
                      <option key={variant.id} value={variant.id}>
                        {label}
                      </option>
                    )
                  })}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Aucune variante disponible.
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                if (selectedVariant) {
                  addItem(product, selectedVariant, 1)
                }
              }}
              disabled={!selectedVariant}
              className={`w-full rounded-2xl px-4 py-4 text-sm font-semibold uppercase tracking-[0.2em] transition active:scale-95 ${
                selectedVariant
                  ? 'bg-black text-white hover:bg-gray-900'
                  : 'cursor-not-allowed bg-gray-200 text-gray-400'
              }`}
            >
              Ajouter au panier
            </button>

            <p className="text-xs text-gray-500">
              Livraison offerte dès 80€ d'achat.
            </p>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
            <p className="text-sm font-semibold text-gray-900">Inclus</p>
            <p className="mt-3">
              Packaging premium, guide de pose et garantie Koktek 12 mois.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductPage
