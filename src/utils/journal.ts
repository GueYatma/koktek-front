export type ArticleTocItem = {
  id: string
  text: string
  level: 2 | 3
}

export type PreparedArticleContent = {
  html: string
  toc: ArticleTocItem[]
}

const slugifyHeading = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const stripHtml = (value: string) =>
  value
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export const estimateReadingTime = (value?: string | null): number | null => {
  if (!value) return null
  const text = stripHtml(value)
  if (!text) return null
  const wordCount = text.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(wordCount / 220))
}

export const prepareArticleContent = (sanitizedHtml?: string | null): PreparedArticleContent => {
  if (!sanitizedHtml) return { html: '', toc: [] }
  if (typeof DOMParser === 'undefined') {
    return { html: sanitizedHtml, toc: [] }
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(sanitizedHtml, 'text/html')
  const toc: ArticleTocItem[] = []
  const usedIds = new Set<string>()

  doc.body.querySelectorAll('h2, h3').forEach((heading, index) => {
    const text = heading.textContent?.trim()
    if (!text) return

    const baseId = slugifyHeading(text) || `section-${index + 1}`
    let nextId = baseId
    let suffix = 2

    while (usedIds.has(nextId)) {
      nextId = `${baseId}-${suffix}`
      suffix += 1
    }

    usedIds.add(nextId)
    heading.id = nextId

    toc.push({
      id: nextId,
      text,
      level: heading.tagName === 'H3' ? 3 : 2,
    })
  })

  return {
    html: doc.body.innerHTML,
    toc,
  }
}
