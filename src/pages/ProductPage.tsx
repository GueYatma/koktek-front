import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import VariantSelector from '../components/VariantSelector'
import { useProducts } from '../hooks/useProducts'
import { formatPrice } from '../utils/format'

const ProductPage = () => {
  const { slug } = useParams()
  const { addItem } = useCart()
  const { loading, getProductBySlug, getVariantsByProductId } = useProducts()

  const product = useMemo(
    () => (slug ? getProductBySlug(slug) : undefined),
    [getProductBySlug, slug],
  )

  const variants = useMemo(
    () => (product ? getVariantsByProductId(product.id) : []),
    [getVariantsByProductId, product],
  )

  const [selectedVariantId, setSelectedVariantId] = useState('')
  const [selectedImage, setSelectedImage] = useState('')

  useEffect(() => {
    if (variants.length > 0) {
      setSelectedVariantId(variants[0].id)
    } else {
      setSelectedVariantId('')
    }
  }, [product?.id, variants])

  const selectedVariant = variants.find(
    (variant) => variant.id === selectedVariantId,
  )

  const images = useMemo(() => {
    if (!product) return []
    if (product.images && product.images.length > 0) {
      return product.images
    }
    return product.image_url ? [product.image_url] : []
  }, [product])

  useEffect(() => {
    if (images.length > 0) {
      setSelectedImage(images[0])
    } else {
      setSelectedImage('')
    }
  }, [images])

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
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-[32px] bg-gray-50 p-6">
            <img
              src={selectedImage || product.image_url}
              alt={product.title}
              className="h-[420px] w-full object-contain"
            />
          </div>
          {images.length > 1 && (
            <div className="flex flex-wrap gap-3">
              {images.map((image) => {
                const isActive = image === selectedImage
                return (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setSelectedImage(image)}
                    className={`h-20 w-20 overflow-hidden rounded-2xl border ${
                      isActive
                        ? 'border-gray-900'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img
                      src={image}
                      alt={product.title}
                      className="h-full w-full object-contain bg-gray-50 p-2"
                    />
                  </button>
                )
              })}
            </div>
          )}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
              Détails
            </p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li>Protection renforcée sur les angles</li>
              <li>Compatible charge MagSafe</li>
              <li>Finition premium anti-traces</li>
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
              Collection Koktek
            </p>
            <h1 className="mt-2 text-2xl font-medium text-gray-900">
              {product.title}
            </h1>
            <div
              className="mt-3 prose prose-sm text-gray-600"
              dangerouslySetInnerHTML={{
                __html: product.description || '',
              }}
            />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Prix</span>
              <span className="font-display text-2xl font-bold text-gray-900">
                {formatPrice(
                  selectedVariant?.price ?? product.retail_price,
                )}
              </span>
            </div>
            <div className="mt-4">
              <VariantSelector
                variants={variants}
                selectedVariantId={selectedVariantId}
                onSelect={(variant) => setSelectedVariantId(variant.id)}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (selectedVariant) {
                  addItem(product, selectedVariant, 1)
                }
              }}
              disabled={!selectedVariant}
              className={`mt-6 w-full rounded-xl px-4 py-3 text-sm font-semibold transition ${
                selectedVariant
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'cursor-not-allowed bg-gray-200 text-gray-400'
              }`}
            >
              Ajouter au panier
            </button>
            <p className="mt-3 text-xs text-gray-500">
              Livraison offerte dès 80€ d'achat.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-sm text-gray-600">
            <p className="font-semibold text-gray-900">Inclus</p>
            <p className="mt-2">
              Packaging premium, guide de pose et garantie Koktek 12 mois.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductPage
