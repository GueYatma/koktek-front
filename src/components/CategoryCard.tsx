import { useState, useEffect, useMemo, memo } from 'react'
import { Link } from 'react-router-dom'

type CategoryCardProps = {
  categoryName: string
  images: string[]
  fallbackImage: string
}

function shuffleArray(array: string[]) {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

const CategoryCard = memo(({ categoryName, images, fallbackImage }: CategoryCardProps) => {
  const shuffledImages = useMemo(() => {
    // Deduplicate images
    const uniqueImages = Array.from(new Set(images))
    if (uniqueImages.length === 0) return [fallbackImage]
    return shuffleArray(uniqueImages)
  }, [images, fallbackImage])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [renderList, setRenderList] = useState<string[]>([shuffledImages[0]])

  useEffect(() => {
    if (shuffledImages.length <= 1) return

    const intervalId = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % shuffledImages.length
        setRenderList([shuffledImages[prevIndex], shuffledImages[nextIndex]])
        return nextIndex
      })
    }, 600000) // 10 minutes = 600000ms

    return () => clearInterval(intervalId)
  }, [shuffledImages])

  const nextIndex = (currentIndex + 1) % shuffledImages.length
  const nextImageToPreload = shuffledImages[nextIndex]

  return (
    <Link
      to={`/catalogue?category=${encodeURIComponent(categoryName)}`}
      className="group overflow-hidden rounded-3xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
    >
      <div className="relative h-36 overflow-hidden bg-gray-100">
        {renderList.map((imgSrc, idx) => (
          <img
            key={imgSrc}
            src={imgSrc}
            alt={categoryName}
            className={`absolute inset-0 h-full w-full object-cover transition duration-[1500ms] group-hover:scale-105 ${
              idx === 1 ? 'animate-in fade-in duration-[1500ms]' : ''
            }`}
          />
        ))}
        {/* Preload the upcoming image so it's ready for the next tick */}
        {shuffledImages.length > 1 && (
          <img src={nextImageToPreload} className="hidden" aria-hidden="true" alt="preload" />
        )}
      </div>
      <div className="p-4">
        <p className="text-sm font-semibold text-gray-900">
          {categoryName}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Sélection curée Koktek
        </p>
      </div>
    </Link>
  )
})

export default CategoryCard
