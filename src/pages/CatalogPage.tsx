import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { useProducts } from '../hooks/useProducts'

const GENERIC_BRAND = 'Générique'
const GENERIC_BRAND_LABEL = 'Autres marques'

const CatalogPage = () => {
  const { categories, products, loading } = useProducts()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedBrand, setSelectedBrand] = useState('all')
  const [searchParams] = useSearchParams()

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

  const brands = useMemo(
    () => {
      const uniqueBrands = [
        ...new Set(
          products
            .map((product) => product.brand)
            .map((brand) => brand.trim())
            .filter((brand) => brand.length > 0),
        ),
      ]

      const hasGeneric = uniqueBrands.includes(GENERIC_BRAND)
      const sortableBrands = uniqueBrands.filter(
        (brand) => brand !== GENERIC_BRAND,
      )

      sortableBrands.sort((a, b) => a.localeCompare(b, 'fr'))

      return [
        ...sortableBrands,
        ...(hasGeneric ? [GENERIC_BRAND] : []),
      ]
    },
    [products],
  )

  const filteredProducts = useMemo(() => {
    let nextProducts = products

    if (selectedCategory !== 'all') {
      const matchedCategory = categories.find(
        (category) =>
          category.slug === selectedCategory || category.id === selectedCategory,
      )

      if (!matchedCategory) {
        console.warn('Catégorie introuvable pour le slug:', selectedCategory)
        console.log(
          'Exemple IDs en base:',
          products.slice(0, 3).map((product) => product.category_id),
        )
        return []
      }

      nextProducts = nextProducts.filter(
        (product) => product.category_id === matchedCategory.id,
      )
    }

    if (selectedBrand !== 'all') {
      nextProducts = nextProducts.filter(
        (product) => product.brand === selectedBrand,
      )
    }

    return nextProducts
  }, [products, selectedCategory, categories, selectedBrand])

  useEffect(() => {
    const brandParam = searchParams.get('brand')
    if (brandParam) {
      setSelectedBrand(brandParam)
      setSelectedCategory('all')
    }
  }, [searchParams])

  return (
    <div className="mx-auto max-w-6xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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
      </div>

      <div className="mt-6">
        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
          Catégories
        </p>
        <div className="mt-3 -mx-1 overflow-x-auto pb-2">
          <div className="flex min-w-max flex-nowrap gap-2 px-1">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all')
                setSelectedBrand('all')
              }}
              className={
                selectedCategory === 'all'
                  ? 'rounded-full border border-gray-900 bg-gray-900 px-4 py-2 text-sm font-medium text-white'
                  : 'rounded-full border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200'
              }
            >
              Toutes les catégories
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(category.id)
                  setSelectedBrand('all')
                }}
                className={
                  selectedCategory === category.id
                    ? 'rounded-full border border-gray-900 bg-gray-900 px-4 py-2 text-sm font-medium text-white'
                    : 'rounded-full border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200'
                }
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
          Marques
        </p>
        <div className="mt-3 -mx-1 overflow-x-auto pb-2">
          <div className="flex min-w-max flex-nowrap gap-2 px-1">
            <button
              type="button"
              onClick={() => {
                setSelectedBrand('all')
                setSelectedCategory('all')
              }}
              className={
                selectedBrand === 'all'
                  ? 'rounded-full border border-gray-900 bg-gray-900 px-4 py-2 text-sm font-medium text-white'
                  : 'rounded-full border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200'
              }
            >
              Toutes les marques
            </button>
            {brands.map((brand) => (
              <button
                key={brand}
                type="button"
                onClick={() => {
                  setSelectedBrand(brand)
                  setSelectedCategory('all')
                }}
                className={
                  selectedBrand === brand
                    ? 'rounded-full border border-gray-900 bg-gray-900 px-4 py-2 text-sm font-medium text-white'
                    : 'rounded-full border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200'
                }
              >
                {brand === GENERIC_BRAND ? GENERIC_BRAND_LABEL : brand}
              </button>
            ))}
          </div>
        </div>
        {!loading && brands.length === 0 && (
          <span className="text-sm text-gray-500">
            Aucune marque disponible.
          </span>
        )}
      </div>

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-gray-500">Chargement...</p>
        ) : (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {filteredProducts.map((product) => (
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
        {!loading && filteredProducts.length === 0 && (
          <p className="mt-6 text-sm text-gray-500">Aucun produit trouvé.</p>
        )}
      </div>
    </div>
  )
}

export default CatalogPage
