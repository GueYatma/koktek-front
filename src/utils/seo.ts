const DEFAULT_SITE_URL = 'https://koktek.com'

export const getSiteUrl = () => {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin
  }

  return DEFAULT_SITE_URL
}

export const toAbsoluteSiteUrl = (path = '/') => new URL(path, `${getSiteUrl()}/`).toString()

export const toAbsoluteUrl = (value?: string | null) => {
  if (!value) return undefined

  try {
    return new URL(value).toString()
  } catch {
    return new URL(value, `${getSiteUrl()}/`).toString()
  }
}

export const buildBreadcrumbJsonLd = (items: Array<{ name: string; url: string }>) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
})
