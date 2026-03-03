import { Link } from 'react-router-dom'
import type { Product } from '../types'
import { resolveImageUrl } from '../utils/image'
import { formatPrice } from '../utils/format'

type ProductCardProps = {
  product: Product
  categoryName?: string
}

const ProductCard = ({ product, categoryName }: ProductCardProps) => {
  const finalPrice = product.prix_calcule ?? product.retail_price
  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition md:hover:border-gray-300 dark:md:hover:border-gray-500">
      <Link to={`/produit/${product.slug}`} className="block">
        <img
          src={resolveImageUrl(product.image_url)}
          alt={product.title}
          className="h-28 w-full object-cover sm:h-36 md:h-44"
          loading="lazy"
          decoding="async"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        {categoryName && (
          <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 dark:text-gray-500">
            {categoryName}
          </p>
        )}
        <Link
          to={`/produit/${product.slug}`}
          className="font-display text-xs font-medium text-gray-800 dark:text-gray-200 line-clamp-2 sm:text-sm"
        >
          {product.title}
        </Link>
        <div className="mt-auto flex items-center justify-between">
          <p className="font-display text-sm font-semibold text-gray-900 dark:text-gray-100">
            {formatPrice(finalPrice)}
          </p>
          <Link
            to={`/produit/${product.slug}`}
            className="rounded-full border border-gray-200 dark:border-gray-600 px-3 py-1 text-[11px] font-semibold text-gray-700 dark:text-gray-300 transition hover:border-gray-900 hover:text-gray-900 dark:hover:border-gray-300 dark:hover:text-white"
          >
            Choisir
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ProductCard
