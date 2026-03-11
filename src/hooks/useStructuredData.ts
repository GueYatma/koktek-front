import { useEffect } from 'react'

type StructuredDataPayload = Record<string, unknown> | null | undefined

export const useStructuredData = (
  schema: StructuredDataPayload,
  id = 'page-structured-data',
) => {
  const serializedSchema = schema ? JSON.stringify(schema) : ''

  useEffect(() => {
    const existing = document.getElementById(id)

    if (!serializedSchema) {
      existing?.remove()
      return
    }

    const script = existing ?? document.createElement('script')
    script.id = id
    script.setAttribute('type', 'application/ld+json')
    script.textContent = serializedSchema

    if (!existing) {
      document.head.appendChild(script)
    }

    return () => {
      script.remove()
    }
  }, [id, serializedSchema])
}
