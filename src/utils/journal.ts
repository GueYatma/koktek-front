export type ArticleTocItem = {
  id: string
  text: string
  level: 2 | 3
}

export type PreparedArticleContent = {
  html: string
  toc: ArticleTocItem[]
}

export type JournalPillarKey =
  | 'auto-mobilite'
  | 'tech-productivite'
  | 'lifestyle-protection'
  | 'creation-mobile'
  | 'guides-achat'

export type JournalPillarMeta = {
  key: JournalPillarKey
  label: string
  eyebrow: string
  description: string
  accentClass: string
}

export const JOURNAL_PILLARS: JournalPillarMeta[] = [
  {
    key: 'auto-mobilite',
    label: 'Auto & Mobilité',
    eyebrow: 'Trajets & recharge',
    description: 'Trajets, support voiture, recharge nomade et usages mobiles vraiment utiles.',
    accentClass: 'from-[#1d3d63] to-[#2d6a8f]',
  },
  {
    key: 'tech-productivite',
    label: 'Tech & Productivité',
    eyebrow: 'Desk & efficacité',
    description: 'Bureau, batterie, organisation mobile et accessoires qui servent vraiment.',
    accentClass: 'from-[#734d17] to-[#c7771f]',
  },
  {
    key: 'lifestyle-protection',
    label: 'Lifestyle & Protection',
    eyebrow: 'Usage quotidien',
    description: 'Voyage, sport, photo mobile et réflexes simples pour mieux protéger ses appareils.',
    accentClass: 'from-[#2e4d43] to-[#628d7b]',
  },
  {
    key: 'creation-mobile',
    label: 'Création Mobile',
    eyebrow: 'Photo & contenu',
    description: 'Création de contenu, capture mobile, lumière et autonomie pour produire mieux.',
    accentClass: 'from-[#5a2557] to-[#9b4d96]',
  },
  {
    key: 'guides-achat',
    label: 'Guides d’Achat',
    eyebrow: 'Choisir sans bruit',
    description: 'Comparatifs, repères d’achat et critères concrets pour mieux choisir.',
    accentClass: 'from-[#29474b] to-[#4f8a8f]',
  },
]

const ARTICLE_TYPE_LABELS: Record<string, string> = {
  guide: 'Guide',
  checklist: 'Checklist',
  comparatif: 'Comparatif',
  decryptage: 'Décryptage',
  selection: 'Sélection',
  faq: 'FAQ',
}

export const getJournalArticleTypeLabel = (value?: string | null): string | null => {
  const slug = normalizePillarSlug(value)
  if (!slug) return value ?? null
  return ARTICLE_TYPE_LABELS[slug] ?? value ?? null
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

export const normalizePillarSlug = (value?: string | null): string | null => {
  if (!value) return null
  return slugifyHeading(value)
}

export const getJournalPillarMeta = (value?: string | null): JournalPillarMeta | null => {
  const slug = normalizePillarSlug(value)
  if (!slug) return null
  return JOURNAL_PILLARS.find((pillar) => pillar.key === slug) ?? null
}

export const getJournalStoryLabel = (value: {
  pillar?: string | null
  category?: string | null
  article_type?: string | null
}) => {
  const articleType = normalizePillarSlug(value.article_type ?? undefined)

  return (
    getJournalPillarMeta(value.pillar)?.label ??
    value.category ??
    (articleType ? ARTICLE_TYPE_LABELS[articleType] ?? value.article_type : value.article_type) ??
    'Guide pratique'
  )
}

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
