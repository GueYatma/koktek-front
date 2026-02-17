import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useProducts } from '../hooks/useProducts'
import ProductCard from '../components/ProductCard'

const BRAND_SHOWCASE = [
  {
    name: 'Apple',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg',
    query: 'Apple',
  },
  {
    name: 'Samsung',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Samsung_Logo.svg/2560px-Samsung_Logo.svg.png',
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
    name: 'Google Pixel',
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
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Plus_symbol.svg/500px-Plus_symbol.svg.png',
    query: 'Autres',
  },
]

const BRAND_SUBTITLES: Record<string, string> = {
  Apple: 'Tout pour votre iPhone & iPad',
  Samsung: "L'univers Galaxy sublimé",
  Xiaomi: 'Innovation pour tous',
  Redmi: 'Performance accessible',
  Huawei: 'Design et puissance',
  Honor: 'Style et technologie',
  'Google Pixel': "L'expérience Android pure",
  Oppo: 'Innovation et design',
  Sony: "L'excellence Xperia",
  Autres: 'Et bien plus encore...',
}

const HomePage = () => {
  const { categories, products, loading } = useProducts()
  const [logoErrors, setLogoErrors] = useState<Record<string, boolean>>({})
  const featuredProducts = products
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
  const categoryPlaceholders = [
    'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1487014679447-9f8336841d58?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1600&auto=format&fit=crop',
  ]
  const heroImage =
    products[0]?.image_url ??
    'https://images.unsplash.com/photo-1510557880182-3f8e6db3c525?q=80&w=1600&auto=format&fit=crop'

  return (
    <div>
      <section className="relative overflow-hidden bg-gray-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.15),_transparent_60%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.4em] text-gray-500">
              Koktek premium
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-gray-900 sm:text-5xl">
              Protégez votre iPhone avec style.
            </h1>
            <p className="text-base text-gray-600 sm:text-lg">
              Des matières nobles, des finitions impeccables et une protection
              pensée pour votre quotidien.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/catalogue"
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Explorer le catalogue
              </Link>
              <Link
                to="/catalogue"
                className="inline-flex items-center justify-center rounded-xl border border-gray-900 px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-900 hover:text-white"
              >
                Découvrir les best-sellers
              </Link>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-gray-500">
              <div>
                <p className="font-semibold text-gray-900">+20 000</p>
                <p>Clients satisfaits</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">48h</p>
                <p>Livraison express</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">30 jours</p>
                <p>Retours gratuits</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-[32px] bg-white p-4 shadow-xl">
              <div className="overflow-hidden rounded-[28px] bg-gray-200">
                <img
                  src={heroImage}
                  alt="Collection Koktek"
                  className="h-[360px] w-full object-cover"
                />
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-lg lg:block">
              Finition mate, toucher velours
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
              Catégories
            </p>
            <h2 className="text-2xl font-semibold text-gray-900">
              Nos Catégories
            </h2>
          </div>
          <Link
            to="/catalogue"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Tout voir
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {featuredCategories.map((category, index) => (
            <Link
              key={category.id}
              to={`/catalogue?category=${encodeURIComponent(category.name)}`}
              className="group overflow-hidden rounded-3xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="h-36 overflow-hidden bg-gray-100">
                <img
                  src={
                    categoryPlaceholders[index % categoryPlaceholders.length]
                  }
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
          ))}
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
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {BRAND_SHOWCASE.map((brand) => (
            <Link
              key={brand.name}
              to={`/catalogue?brand=${encodeURIComponent(brand.query)}`}
              className="group overflow-hidden rounded-3xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex h-32 items-center justify-center bg-white px-6">
                {brand.logo && !logoErrors[brand.name] ? (
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="h-12 w-28 object-contain"
                    onError={() =>
                      setLogoErrors((prev) => ({ ...prev, [brand.name]: true }))
                    }
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-700">
                    <Plus className="h-8 w-8" />
                    <span className="text-sm font-semibold">{brand.name}</span>
                  </div>
                )}
              </div>
              <div className="border-t border-gray-200 px-4 py-3">
                <p className="text-xs text-gray-500">
                  {BRAND_SUBTITLES[brand.name] ?? ''}
                </p>
              </div>
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
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
