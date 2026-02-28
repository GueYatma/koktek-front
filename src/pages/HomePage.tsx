import { useEffect, useMemo, useState } from 'react'
import { BadgeCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useProducts } from '../hooks/useProducts'
import { resolveImageUrl } from '../utils/image'
import ProductCard from '../components/ProductCard'

const BRAND_SHOWCASE = [
  {
    name: 'Apple',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg',
    query: 'Apple',
  },
  {
    name: 'Samsung',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Samsung_Logo.svg/1024px-Samsung_Logo.svg.png',
    query: 'Samsung',
  },
  {
    name: 'Xiaomi',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/Xiaomi_logo_%282021-%29.svg',
    query: 'Xiaomi',
  },
  {
    name: 'Redmi',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Redmi_Logo.svg/1024px-Redmi_Logo.svg.png',
    query: 'Redmi',
  },
  {
    name: 'Huawei',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Huawei_Logo.svg/1024px-Huawei_Logo.svg.png',
    query: 'Huawei',
  },
  {
    name: 'Honor',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Honor_Logo_%282020%29.svg/1024px-Honor_Logo_%282020%29.svg.png',
    query: 'Honor',
  },
  {
    name: 'Google',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
    query: 'Google',
  },
  {
    name: 'Oppo',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/OPPO_Logo.svg',
    query: 'Oppo',
  },
  {
    name: 'Sony',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Sony_logo.svg/1024px-Sony_logo.svg.png',
    query: 'Sony',
  },
  {
    name: 'Autres',
    logo: '',
    query: 'Autres',
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
    const picked: typeof products = []
    const seen = new Set<string>()
    products.forEach((product) => {
      if (picked.length >= 6) return
      const categoryName = resolveCategoryName(product)
      if (!categoryName) return
      const key = normalizeCategoryKey(categoryName)
      if (seen.has(key)) return
      seen.add(key)
      picked.push(product)
    })
    return picked
  }, [products])
  const heroCandidates = useMemo(() => {
    const fromProducts = products
      .map((product) => resolveImageUrl(product.image_url ?? '', ''))
      .filter((url) => url.length > 0)
    const unique = Array.from(new Set(fromProducts))
    return unique.length > 0 ? unique : HERO_FALLBACKS
  }, [products])

  useEffect(() => {
    const interval = window.setInterval(() => {
      setHeroTick((prev) => prev + 1)
    }, 30_000)
    return () => window.clearInterval(interval)
  }, [])

  const heroIndex =
    heroCandidates.length > 0 ? heroTick % heroCandidates.length : 0
  const hourIndex = useMemo(() => new Date().getHours(), [heroTick])
  const heroImage = heroCandidates[heroIndex] ?? HERO_FALLBACKS[0]

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
          <div className="relative lg:justify-self-end">
            <div className="rounded-[22px] border border-white/70 bg-white/80 p-2.5 shadow-[0_18px_50px_-35px_rgba(15,23,42,0.55)] lg:max-w-xs">
              <div className="relative overflow-hidden rounded-[22px] bg-gray-200">
                <img
                  src={heroImage}
                  alt="Collection Koktek"
                  className="aspect-[4/5] w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              </div>
            </div>
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
            const categoryImage =
              categoryImages.length > 0
                ? categoryImages[hourIndex % categoryImages.length]
                : heroImage
            return (
              <Link
                key={category.id}
                to={`/catalogue?category=${encodeURIComponent(category.name)}`}
                className="group overflow-hidden rounded-3xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="h-36 overflow-hidden bg-gray-100">
                  <img
                    src={categoryImage}
                    alt={category.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <p className="text-sm font-semibold text-gray-900">
                    {category.name}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Sélection curée Koktek
                  </p>
                </div>
              </Link>
            )
          })}
          {!loading && featuredCategories.length === 0 && (
            <p className="text-sm text-gray-500">Aucune catégorie.</p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
            Vos appareils
          </p>
          <h2 className="text-2xl font-semibold text-gray-900">
            Rechercher par marque
          </h2>
        </div>
        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {BRAND_SHOWCASE.map((brand) => (
            <Link
              key={brand.name}
              to={`/catalogue?brand=${encodeURIComponent(brand.query)}`}
              className="group flex aspect-square items-center justify-center rounded-2xl border border-gray-100 bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-1 hover:border-gray-200 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)] sm:rounded-3xl sm:p-4"
              title={brand.name}
            >
              {brand.logo ? (
                <img
                  src={brand.logo}
                  alt={brand.name}
                  className="h-6 w-auto max-w-[80%] object-contain opacity-70 transition-opacity duration-200 group-hover:opacity-100 sm:h-8"
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
