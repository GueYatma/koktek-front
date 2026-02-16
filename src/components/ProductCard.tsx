import { Link } from 'react-router-dom'
import type { Product } from '../types'
import { formatPrice } from '../utils/format'

type ProductCardProps = {
  product: Product
  categoryName?: string
}

const ProductCard = ({ product, categoryName }: ProductCardProps) => {
  return (
    <Link
      to={`/produit/${product.slug}`}
      className="block overflow-hidden rounded-3xl border border-gray-200 bg-white"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-50 p-4">
        <img
          src={product.image_url}
          alt={product.title}
          className="h-full w-full object-contain"
        />
      </div>
      <div className="space-y-2 p-4">
        {categoryName && (
          <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500">
            {categoryName}
          </p>
        )}
        <h3 className="font-display text-sm font-medium text-gray-800 line-clamp-2">
          {product.title}
        </h3>
        <p className="font-display text-base font-bold text-black">
          {formatPrice(product.retail_price)}
        </p>
      </div>
    </Link>
  )
}

export default ProductCard
