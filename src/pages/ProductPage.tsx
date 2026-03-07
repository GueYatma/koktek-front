import { useEffect, useMemo, useRef, useState } from 'react'
import DOMPurify from 'dompurify'
import { Link, useParams } from 'react-router-dom'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useProducts } from '../hooks/useProducts'
import type { ShippingOption, Variant } from '../types'
import { formatPrice } from '../utils/format'
import { resolveImageUrl } from '../utils/image'
import BackButton from '../components/BackButton'


const ProductPage = () => {
  const { slug } = useParams()
  const { addItem } = useCart()
  const { loading, getProductBySlug, getVariantsByProductId } = useProducts()

  const product = useMemo(
    () => (slug ? getProductBySlug(slug) : undefined),
    [getProductBySlug, slug],
  )
  const productId = product?.id

  const [variants, setVariants] = useState<Variant[]>([])
  const [selectedVariant, setSelectedVariant] =
    useState<Variant | null>(null)
  const [selectedImage, setSelectedImage] = useState('')
  const [selectedShippingIndex, setSelectedShippingIndex] = useState(0)

  const mainImageRef = useRef<HTMLDivElement>(null)
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleScrollToImage = () => {
    if (window.innerWidth >= 768 || !mainImageRef.current) return

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    scrollTimeoutRef.current = setTimeout(() => {
      const selectorEl = document.getElementById('variant-selector')
      if (!mainImageRef.current || !selectorEl) return

      const selectorRect = selectorEl.getBoundingClientRect()
      // Scroll until the bottom of the selector is just above the bottom menu (approx 75px from bottom edge)
      const y = window.scrollY + selectorRect.bottom - (window.innerHeight - 75)

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      window.scrollTo({
        top: Math.max(0, y),
        behavior: prefersReducedMotion ? 'instant' : 'smooth',
      })
    }, 150)
  }

  const handleVariantSelect = (variant: Variant) => {
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

  useEffect(() => {
    // Réinitialise la sélection manuelle si la variante change, pour afficher sa propre image
    setSelectedImage('')
  }, [selectedVariant])
  const safeSelectedImage = images.includes(selectedImage)
    ? selectedImage
    : ''
  const displayImage = safeSelectedImage || variantImage || fallbackImage

  const handleNextImage = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (images.length <= 1) return;
    const currentIndex = images.indexOf(displayImage);
    const nextIndex = (currentIndex + 1) % images.length;
    setSelectedImage(images[nextIndex]);
  };

  const handlePrevImage = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (images.length <= 1) return;
    const currentIndex = images.indexOf(displayImage);
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    setSelectedImage(images[prevIndex]);
  };

  const displayPrice = product?.prix_calcule ?? product?.retail_price ?? 0

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
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-3 sm:px-6 sm:pt-12 lg:px-8">
      <div className="sticky top-16 z-40 md:static md:top-auto md:z-auto mb-4 md:mb-8 flex items-center justify-between -mx-2 md:mx-0 px-2 md:px-0">
        <BackButton fallback="/catalogue" />
      </div>

      <div className="mb-6 space-y-2 md:hidden">
        <p className="text-xs uppercase tracking-[0.35em] text-gray-500 dark:text-gray-400">
          Collection Koktek
        </p>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {product.title}
        </h1>
      </div>

      <div className="flex flex-col gap-6 md:grid md:gap-12 md:grid-cols-[3fr_2fr]">
        <div className="contents md:block md:sticky md:top-24 md:self-start">
          <div ref={mainImageRef} className="order-1 md:order-none animate-float aspect-square w-full max-w-lg mx-auto overflow-hidden rounded-3xl bg-white dark:bg-gray-800 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] relative group">
            <img
              src={displayImage}
              alt={product.title}
              className="h-full w-full object-cover cursor-pointer"
              onClick={handleNextImage}
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/60 text-gray-800 shadow-sm backdrop-blur-md transition-all hover:bg-white/90 active:scale-95 md:opacity-0 md:group-hover:opacity-100"
                  aria-label="Image précédente"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/60 text-gray-800 shadow-sm backdrop-blur-md transition-all hover:bg-white/90 active:scale-95 md:opacity-0 md:group-hover:opacity-100"
                  aria-label="Image suivante"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="order-5 md:order-none mt-2 md:mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4">
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

        <div className="contents md:flex md:flex-col md:gap-8">
          <div className="order-1 hidden space-y-4 md:block">
            <p className="text-xs uppercase tracking-[0.35em] text-gray-500 dark:text-gray-400">
              Collection Koktek
            </p>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl md:text-4xl">
              {product.title}
            </h1>
            <p className="text-xl font-semibold text-gray-900 dark:text-gray-200 sm:text-2xl md:text-3xl">
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

          <div className="order-2 md:order-3 space-y-4 rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm sm:p-6" id="variant-selector">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                Modèle
              </p>
              <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
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
                          ? 'border-black bg-black text-white dark:border-gray-200 dark:bg-gray-200 dark:text-gray-900'
                          : 'border-gray-300 bg-white text-gray-900 hover:border-black hover:bg-black hover:text-white dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:border-gray-100'
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
                  className="h-12 w-full appearance-none rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 px-4 pr-10 text-sm font-semibold text-gray-900 dark:text-gray-100 transition focus:border-black dark:focus:border-gray-400 focus:outline-none"
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

            <div className="mt-6 md:mt-5 flex border-t border-gray-100 md:border-0 pt-6 md:pt-0 gap-4 sm:gap-6 justify-between items-center">
              {/* Mobile Pricing (Left Column) */}
              <div className="md:hidden flex flex-col justify-center items-center shrink-0 w-[100px] sm:w-[120px]">
                <p className="text-2xl sm:text-[32px] leading-none font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-1.5">
                  {formatPrice(displayPrice)}
                </p>
                <span className="text-[11px] sm:text-xs text-gray-500 font-medium">Prix</span>
              </div>

              {/* Right Column: Button + Info container */}
              <div className="flex flex-col flex-1 items-center justify-center min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedVariant) {
                      addItem(product, selectedVariant, 1, shippingOptions[selectedShippingIndex])
                    }
                  }}
                  disabled={!selectedVariant}
                  className={`w-full max-w-[280px] rounded-2xl px-4 py-3.5 sm:px-6 sm:py-4 text-xs sm:text-sm font-semibold uppercase tracking-[0.1em] sm:tracking-[0.2em] transition active:scale-95 ${
                    selectedVariant
                      ? 'bg-black text-white shadow-lg hover:bg-gray-900'
                      : 'cursor-not-allowed bg-gray-200 text-gray-400'
                  }`}
                >
                  Ajouter au panier
                </button>
                <p className="text-[11px] sm:text-xs text-gray-500 mt-2 text-center">
                  Livraison offerte dès 80€ d'achat.
                </p>
              </div>
            </div>
          </div>

          <div className="order-4 space-y-3">
            {(expertReview || expertStarsRaw) && (
              <details className="group rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm sm:p-6">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-gray-900 dark:text-gray-100">
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
              <details className="group rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm sm:p-6">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-gray-900 dark:text-gray-100">
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
                              ? 'border-gray-900 bg-gray-900 text-white shadow-lg dark:border-gray-200 dark:bg-gray-200 dark:text-gray-900'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-200'
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

            <details className="group rounded-3xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-5 text-sm text-gray-600 dark:text-gray-300 shadow-sm sm:p-6">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-gray-900 dark:text-gray-100">
                Retour et remboursement
                <ChevronDown className="h-4 w-4 text-gray-500 transition group-open:rotate-180" />
              </summary>
              <div className="mt-4 space-y-4 leading-relaxed">
                <p className="font-medium text-gray-800">
                  Vous disposez de 14 jours à compter de la date de livraison pour demander un retour.
                </p>
                
                <div>
                  <p className="mb-2 font-semibold text-gray-900">Pour être éligible au retour :</p>
                  <ul className="space-y-1.5 pl-2">
                    <li className="flex items-start gap-2">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gray-400" />
                      L'article doit être neuf, non utilisé et non dégradé.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gray-400" />
                      Il doit être renvoyé dans son emballage d'origine avec toutes les informations de livraison présentes.
                    </li>
                  </ul>
                </div>

                <div>
                  <p className="mb-2 font-semibold text-gray-900">Modes de retour :</p>
                  <ul className="space-y-1.5 pl-2">
                    <li className="flex items-start gap-2">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gray-400" />
                      Retour possible directement à notre stand.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gray-400" />
                      Retour possible par voie postale à l'adresse indiquée dans nos Conditions Générales de Vente (adresse disponible dans les Mentions légales).
                    </li>
                  </ul>
                </div>

                <div className="rounded-xl bg-gray-100 p-3 italic text-gray-700">
                  Les remboursements suivent le même canal que le paiement initial (carte → carte, espèces → espèces).
                </div>
              </div>
            </details>
          </div>
          
          {/* Bottom Return CTA */}
          <div className="order-6 mt-4 md:mt-8 flex justify-center md:items-start pb-4 md:pb-0 w-full">
            <BackButton fallback="/catalogue" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductPage
