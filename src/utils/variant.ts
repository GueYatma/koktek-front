type VariantValueSource = {
  option1_value?: string | null
  option1_value_factorized?: string | null
  option_value?: string | null
  optionValue?: string | null
  value?: string | null
}

export const resolveVariantValue = (
  variant?: VariantValueSource | null,
): string => {
  if (!variant) return ''
  const raw =
    variant.option1_value_factorized ??
    variant.option1_value ??
    variant.option_value ??
    variant.optionValue ??
    variant.value ??
    ''
  if (typeof raw === 'string') return raw.trim()
  if (raw === null || raw === undefined) return ''
  return String(raw).trim()
}
