import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SITE_URL = process.env.SITE_URL || 'https://koktek.com'
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://directus.koktek.com'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const publicDir = path.join(rootDir, 'public')

const JOURNAL_PILLARS = [
  'auto-mobilite',
  'tech-productivite',
  'lifestyle-protection',
  'creation-mobile',
  'guides-achat',
]

const STATIC_ROUTES = [
  '/',
  '/catalogue',
  '/contact',
  '/blog',
  '/a-propos',
  '/livraison',
  '/mentions-legales',
  '/conditions-generales',
]

const toAbsoluteUrl = (route) => new URL(route, `${SITE_URL}/`).toString()

const escapeXml = (value) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

const fetchPublishedPosts = async () => {
  const endpoint = new URL('/items/blog_posts', `${DIRECTUS_URL}/`)
  endpoint.searchParams.set('filter[status][_eq]', 'published')
  endpoint.searchParams.set('fields', 'slug,published_at,date_created')
  endpoint.searchParams.set('sort', '-published_at')
  endpoint.searchParams.set('limit', '200')

  try {
    const response = await fetch(endpoint)
    if (!response.ok) {
      throw new Error(`Directus responded with ${response.status}`)
    }

    const payload = await response.json()
    return Array.isArray(payload?.data) ? payload.data : []
  } catch (error) {
    console.warn(`[sitemap] Impossible de recuperer les articles publies: ${error instanceof Error ? error.message : String(error)}`)
    return []
  }
}

const buildUrlEntries = async () => {
  const now = new Date().toISOString()
  const publishedPosts = await fetchPublishedPosts()

  const entries = [
    ...STATIC_ROUTES.map((route) => ({
      loc: toAbsoluteUrl(route),
      lastmod: now,
      changefreq: route === '/blog' ? 'daily' : 'weekly',
      priority: route === '/' ? '1.0' : route === '/blog' ? '0.9' : '0.7',
    })),
    ...JOURNAL_PILLARS.map((pillar) => ({
      loc: toAbsoluteUrl(`/blog/theme/${pillar}`),
      lastmod: now,
      changefreq: 'weekly',
      priority: '0.8',
    })),
    ...publishedPosts
      .filter((post) => typeof post?.slug === 'string' && post.slug.trim())
      .map((post) => ({
        loc: toAbsoluteUrl(`/blog/${post.slug}`),
        lastmod: post.published_at || post.date_created || now,
        changefreq: 'monthly',
        priority: '0.8',
      })),
  ]

  const deduped = new Map()
  entries.forEach((entry) => {
    deduped.set(entry.loc, entry)
  })

  return Array.from(deduped.values())
}

const buildSitemapXml = (entries) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) => `  <url>
    <loc>${escapeXml(entry.loc)}</loc>
    <lastmod>${escapeXml(entry.lastmod)}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`

const buildRobotsTxt = () => `User-agent: *
Allow: /

Sitemap: ${toAbsoluteUrl('/sitemap.xml')}
`

const main = async () => {
  await mkdir(publicDir, { recursive: true })
  const entries = await buildUrlEntries()
  await writeFile(path.join(publicDir, 'sitemap.xml'), buildSitemapXml(entries), 'utf8')
  await writeFile(path.join(publicDir, 'robots.txt'), buildRobotsTxt(), 'utf8')
  console.log(`[sitemap] ${entries.length} urls generees`)
}

await main()
