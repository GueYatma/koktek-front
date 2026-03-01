import { useEffect, useMemo, useRef, useState } from 'react'
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

  const mainImageRef = useRef<HTMLDivElement>(null)
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleScrollToImage = () => {
    if (window.innerWidth >= 768 || !mainImageRef.current) return

    // Debounce to prevent scroll spam jank
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    scrollTimeoutRef.current = setTimeout(() => {
      // 1. Dynamic offset based on the actual header
      const header = document.querySelector('header')
      const headerHeight = header ? header.getBoundingClientRect().height : 60
      // safe-area-inset-top padding + a small visual gap
      const offset = headerHeight + 16

      const y = mainImageRef.current!.getBoundingClientRect().top + window.scrollY - offset

      // 2. Accessibility: check prefers-reduced-motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      window.scrollTo({
        top: y,
        behavior: prefersReducedMotion ? 'instant' : 'smooth',
      })
    }, 150) // 150ms debounce
  }

  const handleVariantSelect = (variant: VariantWithImage) => {
    setSelectedVariant(variant)
    handleScrollToImage()
  }

  const handleImageSelect = (image: string) => {
    setSelectedImage(image)
    handleScrollToImage()
  }

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
    selectedVariant?.option1_value || 'Standard'
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
      <div className="mb-8 flex items-center justify-between">
        <Link
          to="/catalogue"
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200/80 bg-gray-50/80 px-4 py-2.5 text-[13px] font-semibold text-gray-600 transition hover:border-gray-300 hover:bg-gray-100 hover:text-gray-900 active:scale-95"
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
      </div>

      <div className="grid gap-12 md:grid-cols-[3fr_2fr]">
        <div className="order-1 md:sticky md:top-24 md:self-start">
          <div ref={mainImageRef} className="animate-float aspect-square w-full max-w-lg mx-auto overflow-hidden rounded-3xl bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)]">
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
                    onClick={() => handleImageSelect(image)}
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

        <div className="order-2 flex flex-col gap-8">
          <div className="order-1 hidden space-y-4 md:block">
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

          <div className="order-3 md:order-2">
            <div
              className="text-left text-sm leading-relaxed text-gray-600 [&_p]:mb-4 [&_p:last-child]:mb-0 [&_ul]:mb-4 [&_ol]:mb-4 [&_li]:mb-1"
              dangerouslySetInnerHTML={{
                __html: sanitizedDescription,
              }}
            />
          </div>

          <div className="order-2 md:order-3 space-y-4 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6" id="variant-selector">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
                Modèle
              </p>
              <p className="mt-2 text-lg font-semibold text-gray-900">
                {selectedVariant?.option1_value || 'Standard'}
              </p>
            </div>

            {variants.length > 0 && variants.length < 6 ? (
              <div className="flex flex-wrap gap-2">
                {variants.map((variant) => {
                  const isSelected = variant.id === selectedVariant?.id
                  const label = variant.option1_value || variant.sku
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => handleVariantSelect(variant)}
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
                    if (next) handleVariantSelect(next)
                  }}
                  aria-label="Choisir un modèle"
                  className="h-12 w-full appearance-none rounded-2xl border-2 border-gray-200 bg-white px-4 pr-10 text-sm font-semibold text-gray-900 transition focus:border-black focus:outline-none"
                >
                  {variants.map((variant) => {
                    const label = variant.option1_value || variant.sku
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

            <div className="md:hidden mt-6 border-t border-gray-100 pt-5">
              <p className="text-3xl font-bold text-gray-900">{formatPrice(displayPrice)}</p>
            </div>

            <div className="space-y-3 mt-5">
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

          <div className="order-4 space-y-3">
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
                      const daysValue = option.days // string like "8-15j" or number
                      const optionName = option.name ?? `Option ${index + 1}`
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
                                {optionName}
                              </p>
                              <p
                                className={`mt-1 text-xs ${
                                  isSelected ? 'text-gray-200' : 'text-gray-500'
                                }`}
                              >
                                {daysValue != null && String(daysValue).trim().length > 0
                                  ? `Livraison en ${daysValue}`
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
                Retour et remboursement
                <ChevronDown className="h-4 w-4 text-gray-500 transition group-open:rotate-180" />
              </summary>
              <div className="mt-4 space-y-3 leading-relaxed">
                <p>
                  Vous disposez de <strong className="font-semibold text-gray-800">14 jours à compter de la date de livraison</strong> pour retourner votre article.
                </p>
                <div>
                  <p className="mb-1 font-medium text-gray-800">Pour être éligible au retour :</p>
                  <ul className="ml-1 list-inside list-disc space-y-0.5">
                    <li>L'article doit être <strong className="font-semibold text-gray-800">neuf</strong>, <strong className="font-semibold text-gray-800">non utilisé</strong> et <strong className="font-semibold text-gray-800">non dégradé</strong>.</li>
                    <li>Il doit être renvoyé <strong className="font-semibold text-gray-800">dans son emballage d'origine</strong> avec toutes les informations de livraison présentes.</li>
                  </ul>
                </div>
                <div>
                  <p className="mb-1 font-medium text-gray-800">Modes de retour :</p>
                  <ul className="ml-1 list-inside list-disc space-y-0.5">
                    <li>Retour possible directement à notre stand.</li>
                    <li>Retour possible par voie postale à l'adresse indiquée dans nos Conditions Générales de Vente (adresse disponible dans les Mentions légales).</li>
                  </ul>
                </div>
                <p>
                  Les remboursements suivent le même canal que le paiement initial (carte → carte, espèces → espèces).
                </p>
              </div>
            </details>

            {/* Bottom Return CTA */}
            <div className="mt-8 flex flex-col items-start pb-4 md:pb-0">
              <Link
                to="/catalogue"
                className="inline-flex w-auto items-center justify-center gap-1.5 rounded-xl border border-gray-200/80 bg-gray-50/80 px-4 py-2.5 text-[13px] font-semibold text-gray-600 transition hover:border-gray-300 hover:bg-gray-100 hover:text-gray-900 active:scale-95"
              >
                <ChevronLeft className="h-4 w-4" />
                Retour au catalogue
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-[calc(80px+env(safe-area-inset-bottom))] left-0 right-0 z-40 md:hidden px-4 pointer-events-none">
        <div className="mx-auto max-w-6xl pointer-events-auto">
          <button
            type="button"
            onClick={() => {
              if (selectedVariant) {
                addItem(product, selectedVariant, 1, shippingOptions[selectedShippingIndex])
              }
            }}
            disabled={!selectedVariant}
            className={`flex w-full items-center justify-between gap-3 rounded-2xl px-5 py-3.5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.6)] backdrop-blur-md transition-all active:scale-95 ${
              selectedVariant
                ? 'bg-gray-900/95 border border-gray-700 text-white'
                : 'cursor-not-allowed bg-gray-200/90 border border-gray-300 text-gray-500'
            }`}
          >
            <div className="flex flex-col items-start text-left">
              <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-400 mb-0.5">
                Ajouter au panier
              </span>
              <span className="text-sm font-bold truncate max-w-[200px]">
                {selectedVariantLabel}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-8 w-px bg-gray-700"></span>
              <span className="text-lg font-bold tracking-tight">
                {formatPrice(displayPrice)}
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductPage
