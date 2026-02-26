import { Link } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import type { Product } from '../types'
import { resolveImageUrl } from '../utils/image'
import { formatPrice } from '../utils/format'

type ProductCardProps = {
  product: Product
  categoryName?: string
}

const ProductCard = ({ product, categoryName }: ProductCardProps) => {
  const finalPrice = product.retail_price
  return (
    <Link
      to={`/produit/${product.slug}`}
      className="group block overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[5px_5px_20px_rgba(0,0,0,0.1)]"
    >
      <img
        src={resolveImageUrl(product.image_url)}
        alt={product.title}
        className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-64"
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
        <div className="flex items-center justify-between pt-1">
          <p className="font-display text-base font-bold text-black">
            {formatPrice(finalPrice)}
          </p>
          <div 
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 text-gray-500 opacity-70 transition-all duration-300 group-hover:scale-110 group-hover:bg-black group-hover:text-white group-hover:opacity-100 group-hover:shadow-[3px_3px_12px_rgba(0,0,0,0.25)]"
            title="Ajouter au panier"
          >
            <ShoppingBag className="h-[18px] w-[18px]" />
          </div>
        </div>
      </div>
    </Link>
  )
}

export default ProductCard
