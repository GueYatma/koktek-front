import { useEffect } from 'react'

type MetaOptions = {
  title?: string
  description?: string
  image?: string
  type?: string
  url?: string
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

const removeNode = (selector: string) => {
  document.querySelector(selector)?.remove()
}

const setCanonical = (href: string) => {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.href = href
}

/** Injecte dynamiquement title + meta description + Open Graph dans <head>. */
export const useDocumentMeta = ({ title, description, image, type = 'website', url }: MetaOptions) => {
  useEffect(() => {
    const resolvedTitle = title
      ? (title.includes('KOKTEK') ? title : `${title} | KOKTEK`)
      : DEFAULT_TITLE
    const resolvedDesc  = description || DEFAULT_DESC
    const resolvedUrl = url || window.location.href

    document.title = resolvedTitle
    setMeta('description', resolvedDesc)
    setCanonical(resolvedUrl)

    setOg('og:title',       resolvedTitle)
    setOg('og:description', resolvedDesc)
    setOg('og:type',        type)
    setOg('og:url',         resolvedUrl)
    if (image) {
      setOg('og:image', image)
      setMeta('twitter:image', image)
    } else {
      removeNode('meta[property="og:image"]')
      removeNode('meta[name="twitter:image"]')
    }
    setOg('og:site_name',   'KOKTEK')
    setOg('og:locale',      'fr_FR')

    setMeta('twitter:card', image ? 'summary_large_image' : 'summary')
    setMeta('twitter:title', resolvedTitle)
    setMeta('twitter:description', resolvedDesc)

    return () => {
      // Restore on unmount
      document.title = DEFAULT_TITLE
    }
  }, [title, description, image, type, url])
}
