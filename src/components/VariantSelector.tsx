import type { Variant } from '../types'
import { resolveVariantValue } from '../utils/variant'

type VariantSelectorProps = {
  variants: Variant[]
  selectedVariantId: string
  onSelect: (variant: Variant) => void
}

const VariantSelector = ({
  variants,
  selectedVariantId,
  onSelect,
}: VariantSelectorProps) => {
  if (variants.length === 0) return null
  const optionName = variants[0]?.option1_name ?? 'Option'
  const selected = variants.find((variant) => variant.id === selectedVariantId)
  const selectedValue = resolveVariantValue(selected)

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.2em] text-gray-500">
          {optionName}
        </span>
        <span className="text-sm font-semibold text-gray-900">
          {selectedValue}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {variants.map((variant) => {
          const isSelected = variant.id === selectedVariantId
          const label = resolveVariantValue(variant)
          return (
            <button
              key={variant.id}
              type="button"
              onClick={() => onSelect(variant)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                isSelected
                  ? 'bg-gray-900 text-white'
                  : 'border border-gray-300 bg-white text-gray-700 hover:border-gray-900'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default VariantSelector
