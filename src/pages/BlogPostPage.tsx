import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import DOMPurify from 'dompurify'
import { getBlogPost, type BlogPost, type BlogProduct } from '../lib/commerceApi'
import { resolveImageUrl } from '../utils/image'
import { formatPrice } from '../utils/format'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import BackButton from '../components/BackButton'
import { ArrowLeft, Calendar, Clock3, Tag } from 'lucide-react'

const formatDate = (iso?: string | null) => {
  if (!iso) return ''
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z'))
}

// ─── Carte produit recommandé (inline, légère) ───────────────────────────────
const RecommendedProductCard = ({ product }: { product: BlogProduct }) => {
  const image = resolveImageUrl(product.image_url, '')
  const price = product.prix_calcule ?? product.retail_price

  return (
    <Link
      to={`/produit/${product.slug}`}
      className="group flex gap-3 items-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 transition hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700"
    >
      {image ? (
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
          <img
            src={image}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        </div>
      ) : (
        <div className="h-16 w-16 shrink-0 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-950/40 dark:to-indigo-900/20" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
          {product.title}
        </p>
        {price != null && (
          <p className="mt-0.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
            {formatPrice(price)}
          </p>
        )}
      </div>
      <span className="shrink-0 text-gray-300 dark:text-gray-600 group-hover:text-indigo-500 transition-colors text-lg">→</span>
    </Link>
  )
}

// ─── Page principale ─────────────────────────────────────────────────────────
const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setError(null)
    getBlogPost(slug)
      .then((data) => {
        if (!data) {
          setError('Article introuvable.')
        } else {
          setPost(data)
        }
      })
      .catch(() => setError('Impossible de charger l\'article.'))
      .finally(() => setLoading(false))
  }, [slug])

  // SEO dynamique
  useDocumentMeta({
    title: post?.seo_title ?? (post?.title ? `${post.title} | Journal KOKTEK` : undefined),
    description: post?.seo_description ?? post?.summary ?? undefined,
    image: post?.cover_image ? resolveImageUrl(post.cover_image, '') : undefined,
    type: 'article',
  })

  const coverImage = resolveImageUrl(post?.cover_image, '')
  const recommendedProducts = (post?.products ?? []).filter(
    (p) => p.status === 'published' || !p.status,
  )

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 animate-pulse">
        <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700 mb-8" />
        <div className="h-8 w-2/3 rounded bg-gray-200 dark:bg-gray-700 mb-4" />
        <div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-gray-700 mb-8" />
        <div className="aspect-video w-full rounded-2xl bg-gray-200 dark:bg-gray-700 mb-8" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-4 rounded bg-gray-200 dark:bg-gray-700" style={{ width: `${85 + (i % 3) * 5}%` }} />
          ))}
        </div>
      </div>
    )
  }

  // ── Error / not found ─────────────────────────────────────────────────────
  if (error || !post) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <p className="text-5xl mb-4">🔍</p>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {error ?? 'Article introuvable'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          L'article que vous cherchez n'existe pas ou n'est plus disponible.
        </p>
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au Journal
        </Link>
      </div>
    )
  }

  // ── Article ───────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Fil d'ariane */}
      <nav className="mb-8 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
        <BackButton fallback="/blog" className="shrink-0" label="Retour" />
        <span>/</span>
        <Link to="/blog" className="transition hover:text-gray-700 dark:hover:text-gray-300">Journal</Link>
        {post.category && (
          <>
            <span>/</span>
            <span className="text-gray-500 dark:text-gray-400">{post.category}</span>
          </>
        )}
      </nav>

      {/* Méta header */}
      <header className="mb-8 rounded-[32px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/70 sm:p-8">
        {post.category && (
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
            <Tag className="h-3 w-3" />
            {post.category}
          </span>
        )}
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">
          Journal KOKTEK
        </p>
        <h1 className="font-journal-display mt-3 text-4xl leading-[0.98] text-gray-900 dark:text-gray-100 sm:text-5xl">
          {post.title}
        </h1>
        {post.summary && (
          <p className="mt-4 text-lg leading-relaxed text-gray-500 dark:text-gray-400">
            {post.summary}
          </p>
        )}
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-400 dark:text-gray-500">
          {post.published_at && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <time>{formatDate(post.published_at)}</time>
            </div>
          )}
          {post.reading_time && (
            <div className="flex items-center gap-1.5">
              <Clock3 className="h-4 w-4" />
              <span>{post.reading_time} min de lecture</span>
            </div>
          )}
          {post.author_label && <span>{post.author_label}</span>}
        </div>
      </header>

      {/* Image de couverture */}
      {coverImage && (
        <div className="mb-10 overflow-hidden rounded-[32px] border border-slate-200/80 shadow-[0_24px_60px_-35px_rgba(15,23,42,0.45)] dark:border-slate-800">
          <img
            src={coverImage}
            alt={post.cover_image_alt ?? post.title}
            className="w-full object-cover max-h-[480px]"
            loading="lazy"
            decoding="async"
          />
        </div>
      )}

      {/* Contenu HTML riche */}
      {post.content ? (
        <div className="rounded-[32px] border border-slate-200/80 bg-white/92 p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.42)] backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/70 sm:p-8">
          <div
            className="blog-prose"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(post.content, {
                ALLOWED_TAGS: [
                  'h1','h2','h3','h4','h5','h6','p','a','ul','ol','li',
                  'blockquote','strong','em','b','i','u','s','code','pre',
                  'img','table','thead','tbody','tr','th','td','hr','br',
                  'figure','figcaption','span','div',
                ],
                ALLOWED_ATTR: ['href','src','alt','title','class','target','rel','width','height'],
              }),
            }}
          />
        </div>
      ) : (
        <p className="text-gray-400 dark:text-gray-500 italic text-center py-12">
          Le contenu de cet article n'est pas encore disponible.
        </p>
      )}

      {/* Produits recommandés */}
      {recommendedProducts.length > 0 && (
        <section className="mt-12 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-950/20 p-6">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-400 dark:text-indigo-500">Sélection KOKTEK</p>
            <h2 className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">
              Produits mentionnés dans cet article
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {recommendedProducts.map((product) => (
              <RecommendedProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* CTA retour */}
      <div className="mt-12 flex justify-center">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au Journal
        </Link>
      </div>
    </div>
  )
}

export default BlogPostPage
