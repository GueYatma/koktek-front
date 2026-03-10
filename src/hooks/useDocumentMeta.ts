import { useEffect } from 'react'

type MetaOptions = {
  title?: string
  description?: string
  image?: string
  type?: string
}

const DEFAULT_TITLE = 'KOKTEK – Accessoires smartphone'
const DEFAULT_DESC  = 'Coques, chargeurs, protections écran et accessoires smartphone au meilleur prix.'

const setMeta = (name: string, content: string) => {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  el.content = content
}

const setOg = (property: string, content: string) => {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('property', property)
    document.head.appendChild(el)
  }
  el.content = content
}

/** Injecte dynamiquement title + meta description + Open Graph dans <head>. */
export const useDocumentMeta = ({ title, description, image, type = 'website' }: MetaOptions) => {
  useEffect(() => {
    const resolvedTitle = title ? `${title} | KOKTEK` : DEFAULT_TITLE
    const resolvedDesc  = description || DEFAULT_DESC

    document.title = resolvedTitle
    setMeta('description', resolvedDesc)

    setOg('og:title',       resolvedTitle)
    setOg('og:description', resolvedDesc)
    setOg('og:type',        type)
    if (image) setOg('og:image', image)
    setOg('og:site_name',   'KOKTEK')
    setOg('og:locale',      'fr_FR')

    return () => {
      // Restore on unmount
      document.title = DEFAULT_TITLE
    }
  }, [title, description, image, type])
}
