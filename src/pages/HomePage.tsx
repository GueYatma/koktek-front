import { Link } from 'react-router-dom'
import { useProducts } from '../hooks/useProducts'
import ProductCard from '../components/ProductCard'

const HomePage = () => {
  const { categories, products, loading } = useProducts()
  const featuredProducts = products.slice(0, 4)
  const featuredCategories = categories.slice(0, 4)
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

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
              Collections
            </p>
            <h2 className="text-2xl font-semibold text-gray-900">
              Catégories premium
            </h2>
          </div>
          <Link
            to="/catalogue"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Tout voir
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featuredCategories.map((category) => (
            <Link
              key={category.id}
              to="/catalogue"
              className="group overflow-hidden rounded-3xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="h-36 overflow-hidden bg-gray-100">
                <img
                  src={category.image_url}
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
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default HomePage
