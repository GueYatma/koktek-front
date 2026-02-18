import { Link } from 'react-router-dom'
import type { Product } from '../types'
import { resolveImageUrl } from '../utils/image'
import { formatPrice } from '../utils/format'

type ProductCardProps = {
  product: Product
  categoryName?: string
}

const ProductCard = ({ product, categoryName }: ProductCardProps) => {
  const finalPrice =
    product.product_variants && product.product_variants.length > 0
      ? product.product_variants[0].price
      : product.base_price
  return (
    <Link
      to={`/produit/${product.slug}`}
      className="block overflow-hidden rounded-2xl border border-gray-200 bg-white"
    >
      <img
        src={resolveImageUrl(product.image_url)}
        alt={product.title}
        className="h-40 w-full object-cover sm:h-64"
        loading="lazy"
        decoding="async"
      />
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
          {formatPrice(finalPrice)}
        </p>
      </div>
    </Link>
  )
}

export default ProductCard
