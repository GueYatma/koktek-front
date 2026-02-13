import { useMemo, useState } from 'react'
import ProductCard from '../components/ProductCard'
import { useProducts } from '../hooks/useProducts'

const CatalogPage = () => {
  const { categories, products, loading } = useProducts()
  const [selectedCategory, setSelectedCategory] = useState('all')

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'all') return products
    return products.filter((product) => product.category_id === selectedCategory)
  }, [products, selectedCategory])

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
            Catalogue
          </p>
          <h1 className="text-3xl font-semibold text-gray-900">
            Accessoires premium
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Une collection pensée pour chaque modèle d'iPhone.
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
          <label
            htmlFor="category-filter"
            className="text-xs uppercase tracking-[0.2em] text-gray-500"
          >
            Filtrer
          </label>
          <select
            id="category-filter"
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className="mt-2 block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
          >
            <option value="all">Toutes les catégories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-10">
        {loading ? (
          <p className="text-sm text-gray-500">Chargement...</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        {!loading && filteredProducts.length === 0 && (
          <p className="mt-6 text-sm text-gray-500">Aucun produit trouvé.</p>
        )}
      </div>
    </div>
  )
}

export default CatalogPage
