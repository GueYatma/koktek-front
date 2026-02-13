import { Link } from 'react-router-dom'
import type { Product } from '../types'
import { formatPrice } from '../utils/format'

type ProductCardProps = {
  product: Product
}

const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <div className="group overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative h-56 overflow-hidden bg-gray-100">
        <img
          src={product.image_url}
          alt={product.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="space-y-3 p-5">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {product.title}
          </h3>
          <p className="text-sm text-gray-500">
            À partir de {formatPrice(product.base_price)}
          </p>
        </div>
        <Link
          to={`/produit/${product.slug}`}
          className="inline-flex items-center justify-center rounded-xl border border-gray-900 px-4 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-900 hover:text-white"
        >
          Voir
        </Link>
      </div>
    </div>
  )
}

export default ProductCard
