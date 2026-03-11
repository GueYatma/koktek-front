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

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const formatInlineMarkup = (value: string) =>
  escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')

const splitLongParagraph = (value: string): string[] => {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (!normalized) return []

  const sentences = normalized.split(/(?<=[.!?])\s+/).filter(Boolean)
  if (sentences.length < 2) return [normalized]

  const chunks: string[] = []
  let current = ''
  let currentSentenceCount = 0

  sentences.forEach((sentence) => {
    const nextValue = current ? `${current} ${sentence}` : sentence
    const shouldFlush = current && (nextValue.length > 240 || currentSentenceCount >= 2)

    if (shouldFlush) {
      chunks.push(current.trim())
      current = sentence
      currentSentenceCount = 1
      return
    }

    current = nextValue
    currentSentenceCount += 1
  })

  if (current) {
    chunks.push(current.trim())
  }

  return chunks
}

const autoStructurePlainText = (value: string): string => {
  const normalized = value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|section|article|blockquote|figure|figcaption|li|ul|ol|h[1-6])>/gi, '\n')
    .replace(/<(li|ul|ol)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+-\s+(?=[A-ZÀ-ÖØ-Þ0-9])/g, '\n- ')
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  if (!normalized) return ''

  const blocks = normalized
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)

  const htmlParts: string[] = []

  blocks.forEach((block) => {
    const lines = block
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    if (lines.length === 0) return

    const bulletLines = lines.filter((line) => /^[-*•]\s+/.test(line))
    if (bulletLines.length === lines.length) {
      htmlParts.push(
        `<ul>${bulletLines
          .map((line) => `<li>${formatInlineMarkup(line.replace(/^[-*•]\s+/, ''))}</li>`)
          .join('')}</ul>`,
      )
      return
    }

    const singleLine = lines.join(' ').replace(/\s+/g, ' ').trim()
    const wordCount = singleLine.split(/\s+/).filter(Boolean).length
    const isMarkdownHeading = /^#{2,3}\s+/.test(singleLine)
    const isQuestionHeading = singleLine.endsWith('?') && wordCount <= 14 && singleLine.length <= 120
    const isColonHeading = singleLine.endsWith(':') && wordCount <= 14 && singleLine.length <= 120
    const isShortHeading =
      singleLine.length <= 110 &&
      !/[.!]$/.test(singleLine) &&
      (wordCount <= 10 || isQuestionHeading || isColonHeading)

    if (isMarkdownHeading || isShortHeading) {
      const level = singleLine.startsWith('###') ? 'h3' : 'h2'
      const headingText = singleLine.replace(/^#{2,3}\s+/, '').replace(/:$/, '').trim()
      htmlParts.push(`<${level}>${formatInlineMarkup(headingText)}</${level}>`)
      return
    }

    const paragraphSource = lines.join(' ').replace(/\s+/g, ' ').trim()
    splitLongParagraph(paragraphSource).forEach((paragraph) => {
      htmlParts.push(`<p>${formatInlineMarkup(paragraph)}</p>`)
    })
  })

  return htmlParts.join('')
}

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
  const structuredBlocks = doc.body.querySelectorAll('p, h1, h2, h3, h4, h5, h6, ul, ol, blockquote, figure, table, pre, hr')
  const structuralHighlights = doc.body.querySelectorAll('h2, h3, h4, ul, ol, blockquote, figure, table, pre')
  const paragraphCount = doc.body.querySelectorAll('p').length
  const bodyText = stripHtml(doc.body.innerHTML)
  const shouldAutostructure =
    bodyText.length > 220 &&
    (structuredBlocks.length === 0 || (structuralHighlights.length === 0 && paragraphCount <= 1))

  if (shouldAutostructure) {
    doc.body.innerHTML = autoStructurePlainText(doc.body.innerHTML)
  }

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
