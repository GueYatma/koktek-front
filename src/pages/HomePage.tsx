import { useEffect, useMemo, useState } from 'react'
import { BadgeCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useProducts } from '../hooks/useProducts'
import { resolveImageUrl } from '../utils/image'
import { formatPrice } from '../utils/format'
import ProductCard from '../components/ProductCard'
import CategoryCard from '../components/CategoryCard'

const BRAND_SHOWCASE = [
  {
    name: 'Apple',
    logo: '/logos/apple.svg',
    query: 'Apple',
  },
  {
    name: 'Samsung',
    logo: '/logos/samsung.svg',
    query: 'Samsung',
  },
  {
    name: 'Xiaomi',
    logo: '/logos/xiaomi.svg',
    query: 'Xiaomi',
  },
  {
    name: 'Redmi',
    logo: '/logos/redmi.svg',
    query: 'Redmi',
  },
  {
    name: 'Huawei',
    logo: '/logos/huawei.svg',
    query: 'Huawei',
  },
  {
    name: 'Honor',
    logo: '/logos/honor.svg',
    query: 'Honor',
  },
  {
    name: 'Google',
    logo: '/logos/google.svg',
    query: 'Google',
  },
  {
    name: 'Oppo',
    logo: '/logos/oppo.svg',
    query: 'Oppo',
  },
  {
    name: 'Sony',
    logo: '/logos/sony.svg',
    query: 'Sony',
  },
]

const HERO_FALLBACKS = [
  'https://images.unsplash.com/photo-1510557880182-3f8e6db3c525?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1523475472560-d2df97ec485c?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1600&auto=format&fit=crop',
]

const HomePage = () => {
  const { categories, products, loading } = useProducts()
  const [heroTick, setHeroTick] = useState(0)
  const [rotationTick, setRotationTick] = useState(0)
  const featuredCategories = categories
  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>()
    categories.forEach((category) => {
      const idKey = String(category.id)
      map.set(idKey, category.name)
      if (category.slug) {
        map.set(category.slug, category.name)
      }
    })
    return map
  }, [categories])

  const normalizeCategoryKey = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/&/g, ' ')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()

  const resolveCategoryName = (product: any) => {
    const byId = categoryNameById.get(String(product?.category_id ?? ''))
    if (byId) return byId
    const raw = product?.categories
    if (typeof raw === 'string') return raw
    if (Array.isArray(raw) && raw.length > 0) {
      const first = raw[0]
      if (typeof first === 'string') return first
      if (first && typeof first === 'object') {
        const candidate =
          (first as any).name || (first as any).title || (first as any).valeur
        if (typeof candidate === 'string') return candidate
      }
    }
    if (raw && typeof raw === 'object') {
      const candidate =
        (raw as any).name || (raw as any).title || (raw as any).valeur
      if (typeof candidate === 'string') return candidate
    }
    return ''
  }

  const productImagesByCategory = useMemo(() => {
    const map = new Map<string, string[]>()
    products.forEach((product) => {
      const categoryName = resolveCategoryName(product)
      if (!categoryName) return
      const key = normalizeCategoryKey(categoryName)
      const image = resolveImageUrl(product?.image_url ?? '', '')
      if (!image) return
      const list = map.get(key) ?? []
      if (!list.includes(image)) list.push(image)
      map.set(key, list)
    })
    return map
  }, [products, categoryNameById])

  const featuredProducts = useMemo(() => {
    if (products.length === 0) return []
    const windowSize = 8
    const offset = (rotationTick * windowSize) % products.length
    const looped = [...products, ...products]
    return looped.slice(offset, offset + windowSize)
  }, [products, rotationTick])
  // Setup full-catalog randomized Hero Product
  const [heroProduct, setHeroProduct] = useState<any | null>(null)
  
  useEffect(() => {
    if (products.length === 0) return

    const STORAGE_KEY = 'koktek:seen_hero_products'
    let seenIds: string[] = []
    try {
      seenIds = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    } catch (e) {
      // ignore
    }

    // Every 30 seconds we pick a new product from the entire catalog
    const pickNewHero = () => {
      // Filter out products without a valid image or a valid slug
      const availableProducts = products.filter(p => 
        resolveImageUrl(p.image_url ?? '', '') && 
        p.slug && 
        p.slug.trim().length > 0 &&
        p.status === 'published'
      )
      if (availableProducts.length === 0) return

      let candidates = availableProducts.filter(p => !seenIds.includes(String(p.id)))
      
      // If we've seen everything (or most things), reset the pool but keep the very last one
      if (candidates.length < 10 && availableProducts.length > 20) {
        const lastSeen = seenIds[seenIds.length - 1]
        seenIds = lastSeen ? [lastSeen] : []
        candidates = availableProducts.filter(p => String(p.id) !== lastSeen)
      }

      if (candidates.length === 0) candidates = availableProducts

      // Pick random
      const randomIndex = Math.floor(Math.random() * candidates.length)
      const selected = candidates[randomIndex]
      
      setHeroProduct(selected)

      // Update history (keep last 50)
      seenIds.push(String(selected.id))
      if (seenIds.length > 50) seenIds.shift()
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seenIds))
      } catch (e) {
        // ignore
      }
    }

    // Pick immediately if we don't have one
    if (!heroProduct) {
      pickNewHero()
    }

    const interval = window.setInterval(pickNewHero, 60000) // Rotate every 60s
    return () => window.clearInterval(interval)
  }, [products, heroProduct])

  const heroImage = heroProduct ? resolveImageUrl(heroProduct.image_url ?? '', '') : HERO_FALLBACKS[0]
  const heroTitle = heroProduct?.title || 'Collection Koktek'
  const heroCategory = heroProduct ? resolveCategoryName(heroProduct) : ''

  return (
    <div>
      <section className="relative overflow-hidden bg-[#f6f7fb]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.12),_transparent_55%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-6 px-4 pt-6 pb-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:py-8">
          <div className="space-y-2 text-center lg:text-left">
            <div className="mx-auto inline-flex w-full max-w-[320px] flex-wrap items-center justify-center gap-1.5 rounded-lg border border-gray-800 bg-gray-900/85 px-3 py-1.5 text-[12.5px] font-bold uppercase tracking-[0.16em] text-white shadow-[0_12px_26px_-18px_rgba(15,23,42,0.7)] animate-soft-float">
              <BadgeCheck className="h-4 w-4 text-white shrink-0" />
              <span className="whitespace-nowrap">COMMANDEZ EN LIGNE</span>
              <span className="whitespace-nowrap">ET PAYEZ EN ESPÈCES</span>
            </div>
            <h1 className="text-[28px] font-semibold leading-[1.12] text-gray-900 sm:text-[32px] sm:leading-[1.14]">
              Tous vos accessoires de smartphone au même endroit.
            </h1>
            <div className="rounded-2xl border border-gray-300 bg-gray-50/95 px-4 py-3 text-base text-gray-800 shadow-sm sm:px-5 sm:py-3.5 sm:text-lg">
              <p className="text-sm font-medium leading-snug text-gray-800 sm:text-base">
                Coques, chargeurs, vitres de protection, supports téléphone, écouteurs Bluetooth et bien d’autres.
                Une sélection claire, un catalogue riche et un service de proximité, de qualité et de confiance.
              </p>
            </div>
          </div>
          <div className="relative lg:justify-self-end mt-4 lg:mt-0">
            {heroProduct?.slug ? (
              <Link to={`/produit/${heroProduct.slug}`} className="group block focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-4 rounded-[22px]">
                <div className="relative rounded-[22px] border border-white/70 bg-white/80 p-2.5 shadow-[0_18px_50px_-35px_rgba(15,23,42,0.55)] lg:max-w-xs transition-transform duration-300 group-hover:-translate-y-1">
                  <div className="relative overflow-hidden rounded-[16px] bg-gray-100">
                    <img
                      key={heroImage} // Force re-render on image change for crossfade
                      src={heroImage}
                      alt={heroTitle}
                      className="aspect-[4/5] w-full object-cover animate-in fade-in duration-700"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12 text-white">
                      {heroCategory && (
                        <div className="mb-1.5 inline-block rounded-md bg-white/20 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
                          {heroCategory}
                        </div>
                      )}
                      <p className="font-semibold leading-tight line-clamp-2 text-white/95">
                        {heroTitle}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-lg font-bold text-white">
                          {heroProduct ? formatPrice(heroProduct.prix_calcule ?? heroProduct.retail_price ?? 0) : ''}
                        </span>
                        <div className="inline-flex items-center gap-1 text-[10px] font-medium tracking-wider text-white/70 transition-colors group-hover:text-white">
                          VOIR LE PRODUIT <span className="transition-transform group-hover:translate-x-1">→</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="rounded-[22px] border border-white/70 bg-white/80 p-2.5 shadow-[0_18px_50px_-35px_rgba(15,23,42,0.55)] lg:max-w-xs">
                <div className="relative overflow-hidden rounded-[16px] bg-gray-200 aspect-[4/5] w-full animate-pulse" />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
              Parcourir
            </p>
            <h2 className="text-2xl font-semibold text-gray-900">
              Catégories
            </h2>
          </div>
          <Link
            to="/catalogue"
            className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black active:scale-[0.99]"
          >
            Voir tout le catalogue
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {featuredCategories.map((category) => {
            const categoryKey = normalizeCategoryKey(category.name)
            const categoryImages = productImagesByCategory.get(categoryKey) ?? []
            
            return (
              <CategoryCard
                key={category.id}
                categoryName={category.name}
                images={categoryImages}
                fallbackImage={heroImage}
              />
            )
          })}
          {!loading && featuredCategories.length === 0 && (
            <p className="text-sm text-gray-500">Aucune catégorie.</p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
            Vos appareils
          </p>
          <h2 className="text-2xl font-semibold text-gray-900">
            Rechercher par marque
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3 lg:grid-cols-10 lg:gap-3">
          {BRAND_SHOWCASE.map((brand) => (
            <Link
              key={brand.name}
              to={`/catalogue?brand=${encodeURIComponent(brand.query)}`}
              className="group flex aspect-square items-center justify-center rounded-xl border border-gray-200 bg-white p-2.5 shadow-[0_10px_28px_-18px_rgba(0,0,0,0.35)] transition-all duration-150 hover:-translate-y-1 hover:border-gray-300 hover:shadow-[0_14px_32px_-14px_rgba(0,0,0,0.32)] sm:rounded-2xl sm:p-3 lg:rounded-xl"
              title={brand.name}
            >
              {brand.logo ? (
                <img
                  src={brand.logo}
                  alt={brand.name}
                  className="h-7 w-auto max-w-[82%] object-contain opacity-80 transition-opacity duration-150 group-hover:opacity-100 sm:h-8 lg:h-9"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-gray-400 transition-colors group-hover:text-gray-600 sm:h-7 sm:w-7"
                  >
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 transition-colors group-hover:text-gray-600 sm:text-[10px]">
                    Autres
                  </span>
                </div>
              )}
            </Link>
          ))}
          <Link
            to="/catalogue"
            className="group hidden aspect-square items-center justify-center rounded-xl border border-gray-200 bg-white p-2.5 shadow-[0_10px_28px_-18px_rgba(0,0,0,0.35)] transition-all duration-150 hover:-translate-y-1 hover:border-gray-300 hover:shadow-[0_14px_32px_-14px_rgba(0,0,0,0.32)] sm:rounded-2xl sm:p-3 lg:flex lg:rounded-xl"
            title="Autres marques"
          >
            <div className="flex flex-col items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-7 w-7 text-gray-400 transition-colors group-hover:text-gray-600"
              >
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 transition-colors group-hover:text-gray-700">
                Autres
              </span>
            </div>
          </Link>
        </div>
      </section>

      <section className="bg-gray-100">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
              Sélection du moment
            </p>
            <h2 className="text-2xl font-semibold text-gray-900">
              Produits iconiques
            </h2>
          </div>
          {loading ? (
            <p className="text-sm text-gray-500">Chargement...</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  categoryName={categoryNameById.get(
                    String(product.category_id),
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default HomePage
