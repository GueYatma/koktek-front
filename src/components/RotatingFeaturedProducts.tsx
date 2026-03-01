import { useState, useEffect, useMemo, memo } from 'react'
import ProductCard from './ProductCard'
import { resolveImageUrl } from '../utils/image'
import type { Product, Category } from '../types'

type RotatingFeaturedProductsProps = {
  products: Product[]
  categories: Category[]
  categoryNameById: Map<string, string>
  resolveCategoryName: (product: Product) => string
}

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

const RotatingFeaturedProducts = memo(({ products, categories, categoryNameById, resolveCategoryName }: RotatingFeaturedProductsProps) => {
  // 1. Group products by category ID/Name (using the exact 6 featured categories)
  const productsByCategory = useMemo(() => {
    const map = new Map<string, Product[]>()
    
    // Initialize map with known categories to ensure we have slots for them
    categories.forEach(cat => {
      map.set(cat.name, [])
    })

    products.forEach((product) => {
      const catName = resolveCategoryName(product)
      if (!catName) return
      
      // Only include products that belong to our top 6 categories
      if (map.has(catName)) {
        // Only include products with a valid image
        if (resolveImageUrl(product?.image_url ?? '', '')) {
          map.get(catName)!.push(product)
        }
      }
    })

    // Shuffle each category's array once on mount
    const shuffledMap = new Map<string, Product[]>()
    map.forEach((prods, catName) => {
      // Deduplicate by ID just in case
      const uniqueProds = Array.from(new Map(prods.map(p => [p.id, p])).values())
      shuffledMap.set(catName, shuffleArray(uniqueProds))
    })

    return shuffledMap
  }, [products, categories, resolveCategoryName])

  // 2. State for interval tick
  const [rotationTick, setRotationTick] = useState(0)

  useEffect(() => {
    const intervalId = setInterval(() => {
      setRotationTick(prev => prev + 1)
    }, 600000) // 10 minutes = 600000ms

    return () => clearInterval(intervalId)
  }, [rotationTick])

  // 3. Compute active products for current tick
  const getProductsForTick = (tick: number) => {
    const selected: Product[] = []
    
    categories.forEach(cat => {
      const catProducts = productsByCategory.get(cat.name) || []
      const len = catProducts.length
      
      if (len === 0) return
      if (len <= 2) {
        selected.push(...catProducts) // If barely enough, just show them
        return
      }

      // We need 2 per category. Offset advances by 2 every tick.
      const offset = (tick * 2) % len
      
      if (offset + 1 < len) {
        // Normal case: both products from main array
        selected.push(catProducts[offset], catProducts[offset + 1])
      } else {
        // Wrap-around case: last product + first product
        selected.push(catProducts[offset], catProducts[0])
      }
    })
    
    return selected
  }

  const currentProducts = useMemo(() => getProductsForTick(rotationTick), [productsByCategory, rotationTick, categories])
  const nextProducts = useMemo(() => getProductsForTick(rotationTick + 1), [productsByCategory, rotationTick, categories])

  if (currentProducts.length === 0) return null

  return (
    <div className="relative">
      {/* Current/Fading Grid */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {currentProducts.map((product) => (
          <div key={`${rotationTick}-${product.id}`} className="animate-in fade-in duration-[1500ms]">
            <ProductCard
              product={product}
              categoryName={categoryNameById.get(String(product.category_id))}
            />
          </div>
        ))}
      </div>

      {/* Preload Next Images invisibly to avoid flashes */}
      <div className="hidden" aria-hidden="true">
        {nextProducts.map(p => (
          <img key={`preload-${p.id}`} src={resolveImageUrl(p.image_url ?? '', '')} alt="" />
        ))}
      </div>
    </div>
  )
})

export default RotatingFeaturedProducts
