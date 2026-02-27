import { useEffect, useMemo, useState } from 'react'
import DOMPurify from 'dompurify'
import { Link, useParams } from 'react-router-dom'
import { ChevronDown, ChevronLeft } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useProducts } from '../hooks/useProducts'
import type { ShippingOption, Variant } from '../types'
import { formatPrice } from '../utils/format'
import { resolveImageUrl } from '../utils/image'

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

const normalizeKey = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const tokenize = (value: string) =>
  normalizeKey(value)
    .split(' ')
    .filter((token) => token.length > 0)

const extractFileTokens = (url: string) => {
  try {
    const parsed = new URL(url)
    const filename = decodeURIComponent(parsed.pathname.split('/').pop() ?? '')
    if (!filename) return tokenize(parsed.pathname)
    return tokenize(filename)
  } catch {
    return tokenize(url)
  }
}

const findVariantImageMatch = (
  variant: VariantWithImage | null,
  images: string[],
) => {
  if (!variant || images.length === 0) return ''
  const candidate = [
    variant.option1_value,
    variant.option1_name,
    variant.sku,
  ]
    .filter(Boolean)
    .join(' ')
  const variantTokens = tokenize(candidate)
  if (variantTokens.length === 0) return ''

  let bestScore = 0
  let bestImage = ''
  images.forEach((image) => {
    const imageTokens = extractFileTokens(image)
    if (imageTokens.length === 0) return
    let score = 0
    variantTokens.forEach((token) => {
      if (imageTokens.includes(token)) score += 1
    })
    if (score > bestScore) {
      bestScore = score
      bestImage = image
    }
  })

  return bestScore > 0 ? bestImage : ''
}

const ProductPage = () => {
  const { slug } = useParams()
  const { addItem } = useCart()
  const { loading, getProductBySlug, getVariantsByProductId } = useProducts()

  const product = useMemo(
    () => (slug ? getProductBySlug(slug) : undefined),
    [getProductBySlug, slug],
  )
  const productId = product?.id

  const [variants, setVariants] = useState<VariantWithImage[]>([])
  const [selectedVariant, setSelectedVariant] =
    useState<VariantWithImage | null>(null)
  const [selectedImage, setSelectedImage] = useState('')
  const [selectedShippingIndex, setSelectedShippingIndex] = useState(0)

  useEffect(() => {
    let isActive = true

    const loadVariants = async () => {
      if (!productId) {
        if (isActive) {
          setVariants([])
          setSelectedVariant(null)
        }
        return
      }

      const loadedVariants = await getVariantsByProductId(productId)
      if (!isActive) return
      setVariants(loadedVariants)
      setSelectedVariant(loadedVariants[0] ?? null)
    }

    void loadVariants()

    return () => {
      isActive = false
    }
  }, [getVariantsByProductId, productId])

  const images = useMemo(() => {
    if (!product) return []
    const productImages =
      product.images && product.images.length > 0
        ? product.images
        : product.image_url
          ? [product.image_url]
          : []
    return productImages
      .map((image) => resolveImageUrl(image, ''))
      .filter((image) => image.length > 0)
  }, [product])

  const fallbackImage =
    images[0] || resolveImageUrl(product?.image_url ?? '')
  const variantImageRaw = selectedVariant?.image_url ?? ''
  const variantImage =
    variantImageRaw.trim().length > 0
      ? resolveImageUrl(variantImageRaw, '')
      : ''
  const variantImageMatch = useMemo(
    () => findVariantImageMatch(selectedVariant, images),
    [selectedVariant, images],
  )

  useEffect(() => {
    if (!selectedVariant) {
      setSelectedImage('')
      return
    }
    if (variantImageMatch) {
      setSelectedImage(variantImageMatch)
      return
    }
    if (variantImageRaw.trim().length > 0) {
      setSelectedImage('')
    }
  }, [selectedVariant, variantImageMatch, variantImageRaw])
  const safeSelectedImage = images.includes(selectedImage)
    ? selectedImage
    : ''
  const displayImage = safeSelectedImage || variantImage || fallbackImage

  const displayPrice = product?.prix_calcule ?? product?.retail_price ?? 0
  const selectedVariantLabel =
    cleanVariantName(selectedVariant?.option1_value ?? '', product?.title) ||
    selectedVariant?.option1_value ||
    'Standard'
  const expertStarsRaw = product?.expert_stars
  const expertReview = product?.expert_review?.trim() ?? ''
  const expertStarsScore = useMemo(() => {
    let parsed =
      typeof expertStarsRaw === 'number'
        ? expertStarsRaw
        : Number(expertStarsRaw)
    if (!Number.isFinite(parsed) && typeof expertStarsRaw === 'string') {
      const match = expertStarsRaw.match(/([0-9]+([.,][0-9]+)?)/)
      if (match) {
        parsed = parseFloat(match[1].replace(',', '.'))
      }
    }
    return Number.isFinite(parsed) ? Math.max(0, Math.min(5, parsed)) : 5
  }, [expertStarsRaw])

  const renderExpertStars = (score: number) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      if (score >= i) {
        stars.push(
          <svg key={i} className="h-5 w-5 fill-current text-yellow-400" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )
      } else if (score >= i - 0.5) {
        stars.push(
          <svg key={i} className="h-5 w-5" viewBox="0 0 20 20">
            <defs>
              <linearGradient id={`half-star-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="50%" stopColor="#facc15" />
                <stop offset="50%" stopColor="#e5e7eb" />
              </linearGradient>
            </defs>
            <path fill={`url(#half-star-${i})`} d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )
      } else {
        stars.push(
          <svg key={i} className="h-5 w-5 fill-current text-gray-200" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )
      }
    }
    return <div className="flex items-center gap-1">{stars}</div>
  }
  const shippingOptions = useMemo<ShippingOption[]>(
    () => product?.shipping_options?.list ?? [],
    [product?.shipping_options?.list],
  )
  const shippingLabels = [
    'Option 1 - Eco',
    'Option 2 - Standard',
    'Option 3 - Express',
  ]
  const sanitizedDescription = useMemo(
    () => DOMPurify.sanitize(product?.description ?? ''),
    [product?.description],
  )

  useEffect(() => {
    setSelectedShippingIndex(0)
  }, [product?.id])

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
    <div className="mx-auto max-w-6xl px-4 pb-32 pt-10 sm:px-6 sm:pt-12 lg:px-8">
      <div className="mb-4 flex items-center justify-between">
        <Link
          to="/catalogue"
          className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-gray-900 hover:text-gray-900"
        >
          <ChevronLeft className="h-4 w-4" />
          Retour au catalogue
        </Link>
      </div>

      <div className="mb-6 space-y-2 md:hidden">
        <p className="text-xs uppercase tracking-[0.35em] text-gray-500">
          Collection Koktek
        </p>
        <h1 className="text-2xl font-semibold text-gray-900">
          {product.title}
        </h1>
        <p className="text-xl font-semibold text-gray-900">
          {formatPrice(displayPrice)}
        </p>
      </div>

      <div className="grid gap-12 md:grid-cols-[3fr_2fr]">
        <div className="order-1 md:sticky md:top-24 md:self-start">
          <div className="animate-float aspect-square w-full max-w-lg mx-auto overflow-hidden rounded-3xl bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)]">
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
                    className={`aspect-square overflow-hidden rounded-2xl border bg-white transition-shadow ${
                      isActive
                        ? 'border-gray-900 shadow-xl ring-2 ring-gray-900 ring-offset-2 ring-offset-white'
                        : 'border-gray-200 shadow-sm hover:border-gray-400'
                    }`}
                  >
                    <img
                      src={image}
                      alt={product.title}
                      className="h-full w-full object-cover"
                    />
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="order-2 space-y-8">
          <div className="space-y-4">
            <div className="hidden space-y-4 md:block">
              <p className="text-xs uppercase tracking-[0.35em] text-gray-500">
                Collection Koktek
              </p>
              <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl md:text-4xl">
                {product.title}
              </h1>
              <p className="text-xl font-semibold text-gray-900 sm:text-2xl md:text-3xl">
                {formatPrice(displayPrice)}
              </p>
            </div>
            <div
              className="text-left text-sm leading-relaxed text-gray-600 [&_p]:mb-4 [&_p:last-child]:mb-0 [&_ul]:mb-4 [&_ol]:mb-4 [&_li]:mb-1"
              dangerouslySetInnerHTML={{
                __html: sanitizedDescription,
              }}
            />
          </div>

          <div className="space-y-4 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
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
                      aria-pressed={isSelected}
                      aria-label={`Sélectionner le modèle ${label}`}
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
                  aria-label="Choisir un modèle"
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

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  if (selectedVariant) {
                    addItem(product, selectedVariant, 1, shippingOptions[selectedShippingIndex])
                  }
                }}
                disabled={!selectedVariant}
                className={`hidden w-full rounded-2xl px-4 py-4 text-sm font-semibold uppercase tracking-[0.2em] transition active:scale-95 md:block ${
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
          </div>

          <div className="space-y-3">
            {(expertReview || expertStarsRaw) && (
              <details className="group rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-gray-900">
                  Avis de l&apos;expert
                  <ChevronDown className="h-4 w-4 text-gray-500 transition group-open:rotate-180" />
                </summary>
                <div className="mt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center">
                          {renderExpertStars(expertStarsScore)}
                          <span className="ml-2 text-xl font-bold text-gray-900">
                            {expertStarsScore.toFixed(1)}
                          </span>
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                          Note IA
                        </span>
                      </div>
                    </div>
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                      IA certifiée
                    </span>
                  </div>
                  <div className="mt-4 h-px w-full bg-gradient-to-r from-amber-100/80 via-transparent to-amber-100/80" />
                  <p className="mt-4 text-sm text-gray-600">
                    {expertReview || 'Analyse en cours de finalisation.'}
                  </p>
                </div>
              </details>
            )}

            {shippingOptions.length > 0 && (
              <details className="group rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-gray-900">
                  Options de livraison
                  <ChevronDown className="h-4 w-4 text-gray-500 transition group-open:rotate-180" />
                </summary>
                <div className="mt-4">
                  <p className="text-xs text-gray-500">Sélectionnez votre option</p>
                  <div className="mt-3 grid gap-3">
                    {shippingOptions.slice(0, 3).map((option, index) => {
                      const isSelected = selectedShippingIndex === index
                      const priceValue = Number(option.price ?? 0)
                      const daysValue = Number(option.days ?? 0)
                      return (
                        <button
                          key={`${index}-${option.name ?? 'shipping'}`}
                          type="button"
                          onClick={() => setSelectedShippingIndex(index)}
                          className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                            isSelected
                              ? 'border-gray-900 bg-gray-900 text-white shadow-lg'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`mt-1 flex h-4 w-4 items-center justify-center rounded-full border ${
                                isSelected
                                  ? 'border-white bg-white'
                                  : 'border-gray-300 bg-white'
                              }`}
                            >
                              {isSelected ? (
                                <span className="h-2 w-2 rounded-full bg-gray-900" />
                              ) : null}
                            </span>
                            <div>
                              <p className="text-sm font-semibold">
                                {shippingLabels[index] ?? `Option ${index + 1}`}
                              </p>
                              <p
                                className={`mt-1 text-xs ${
                                  isSelected ? 'text-gray-200' : 'text-gray-500'
                                }`}
                              >
                                {daysValue > 0
                                  ? `Livraison en ${daysValue} jours`
                                  : 'Délai communiqué après validation'}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-semibold">
                            {formatPrice(priceValue)}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </details>
            )}

            <details className="group rounded-3xl border border-gray-200 bg-gray-50 p-5 text-sm text-gray-600 shadow-sm sm:p-6">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-gray-900">
                Inclus
                <ChevronDown className="h-4 w-4 text-gray-500 transition group-open:rotate-180" />
              </summary>
              <p className="mt-4">
                Packaging premium, guide de pose et garantie Koktek 12 mois.
              </p>
            </details>
          </div>
        </div>
      </div>

      <div className="fixed bottom-[calc(64px+env(safe-area-inset-bottom))] left-0 right-0 z-40 md:hidden">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white/95 px-3 py-3 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.55)] backdrop-blur">
            <div className="flex-1">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                {selectedVariantLabel}
              </p>
              <p className="text-base font-semibold text-gray-900">
                {formatPrice(displayPrice)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (selectedVariant) {
                  addItem(product, selectedVariant, 1, shippingOptions[selectedShippingIndex])
                }
              }}
              disabled={!selectedVariant}
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition active:scale-95 ${
                selectedVariant
                  ? 'bg-black text-white hover:bg-gray-900'
                  : 'cursor-not-allowed bg-gray-200 text-gray-400'
              }`}
            >
              Ajouter au panier
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductPage
