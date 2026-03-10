import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import DOMPurify from 'dompurify'
import { ArrowLeft, ArrowUpRight, Calendar, Clock3, Tag } from 'lucide-react'
import {
  getBlogPost,
  getBlogPosts,
  type BlogPost,
  type BlogProduct,
} from '../lib/commerceApi'
import { resolveImageUrl } from '../utils/image'
import { formatPrice } from '../utils/format'
import { estimateReadingTime, prepareArticleContent } from '../utils/journal'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import BackButton from '../components/BackButton'

type BlogPostListItem = Omit<BlogPost, 'content' | 'products' | 'seo_title' | 'seo_description'>

const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'ul', 'ol', 'li',
  'blockquote', 'strong', 'em', 'b', 'i', 'u', 's', 'code', 'pre',
  'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'br',
  'figure', 'figcaption', 'span', 'div',
]

const ALLOWED_ATTR = ['href', 'src', 'alt', 'title', 'class', 'target', 'rel', 'width', 'height']

const formatDate = (iso?: string | null) => {
  if (!iso) return ''
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso.endsWith('Z') || iso.includes('+') ? iso : `${iso}Z`))
}

const storyLabel = (post: BlogPostListItem | BlogPost) =>
  post.pillar ?? post.category ?? post.article_type ?? 'Guide pratique'

const RecommendedProductCard = ({ product }: { product: BlogProduct }) => {
  const image = resolveImageUrl(product.image_url, '')
  const price = product.prix_calcule ?? product.retail_price

  return (
    <Link
      to={`/produit/${product.slug}`}
      className="group flex gap-3 rounded-2xl border border-slate-200/80 bg-white/92 p-3 transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80"
    >
      {image ? (
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
          <img
            src={image}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        </div>
      ) : (
        <div className="h-20 w-20 shrink-0 rounded-xl bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.8),_transparent_40%),linear-gradient(135deg,_#d9dde9,_#f7f4ee)] dark:bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.2),_transparent_40%),linear-gradient(135deg,_#162235,_#0f172a)]" />
      )}

      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-semibold text-slate-950 transition-colors group-hover:text-amber-700 dark:text-white dark:group-hover:text-amber-300">
          {product.title}
        </p>
        {price != null && (
          <p className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-200">
            {formatPrice(price)}
          </p>
        )}
      </div>
    </Link>
  )
}

const RelatedArticleCard = ({ post }: { post: BlogPostListItem }) => {
  const image = resolveImageUrl(post.cover_image, '')

  return (
    <article className="group flex h-full flex-col rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur-sm transition hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-950/70">
      <Link to={`/blog/${post.slug}`} className="block overflow-hidden rounded-[22px]">
        {image ? (
          <img
            src={image}
            alt={post.cover_image_alt ?? post.title}
            className="aspect-[4/3] w-full object-cover transition duration-700 group-hover:scale-[1.04]"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.8),_transparent_40%),linear-gradient(135deg,_#d9dde9,_#f7f4ee)] dark:bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.2),_transparent_40%),linear-gradient(135deg,_#162235,_#0f172a)]">
            <span className="font-journal-display text-2xl text-slate-500 dark:text-slate-300">
              Journal
            </span>
          </div>
        )}
      </Link>

      <div className="mt-5 flex flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="rounded-full border border-slate-300/70 bg-white/80 px-2.5 py-1 font-semibold uppercase tracking-[0.18em] text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
            {storyLabel(post)}
          </span>
          {post.published_at && <time>{formatDate(post.published_at)}</time>}
        </div>

        <h3 className="font-journal-display mt-4 text-[1.8rem] leading-[1.06] text-slate-950 dark:text-white">
          <Link to={`/blog/${post.slug}`} className="transition hover:text-amber-700 dark:hover:text-amber-300">
            {post.title}
          </Link>
        </h3>

        {post.summary && (
          <p className="mt-3 line-clamp-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
            {post.summary}
          </p>
        )}

        <Link
          to={`/blog/${post.slug}`}
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition hover:gap-3 dark:text-white"
        >
          Lire aussi
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  )
}

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [relatedPosts, setRelatedPosts] = useState<BlogPostListItem[]>([])
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

  useEffect(() => {
    if (!post?.id) {
      setRelatedPosts([])
      return
    }

    let isCancelled = false

    const loadRelatedPosts = async () => {
      try {
        const primary = await getBlogPosts({
          limit: 6,
          category: post.category ?? undefined,
        })

        const next = primary.filter((item) => item.id !== post.id)

        if (next.length < 3) {
          const fallback = await getBlogPosts({ limit: 12 })
          const seenIds = new Set<string>([post.id, ...next.map((item) => item.id)])

          fallback.forEach((item) => {
            if (!seenIds.has(item.id) && next.length < 3) {
              seenIds.add(item.id)
              next.push(item)
            }
          })
        }

        if (!isCancelled) {
          setRelatedPosts(next.slice(0, 3))
        }
      } catch {
        if (!isCancelled) {
          setRelatedPosts([])
        }
      }
    }

    loadRelatedPosts()

    return () => {
      isCancelled = true
    }
  }, [post?.id, post?.category])

  useDocumentMeta({
    title: post?.seo_title ?? (post?.title ? `${post.title} | Journal KOKTEK` : undefined),
    description: post?.seo_description ?? post?.summary ?? undefined,
    image: post?.cover_image ? resolveImageUrl(post.cover_image, '') : undefined,
    type: 'article',
  })

  const coverImage = resolveImageUrl(post?.cover_image, '')
  const recommendedProducts = (post?.products ?? []).filter((item) => item.status === 'published' || !item.status)
  const sanitizedContent = post?.content
    ? DOMPurify.sanitize(post.content, {
        ALLOWED_TAGS,
        ALLOWED_ATTR,
      })
    : ''
  const preparedContent = prepareArticleContent(sanitizedContent)
  const readingTime = post?.reading_time ?? estimateReadingTime(post?.content ?? post?.summary ?? null)

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl animate-pulse px-4 py-12 sm:px-6">
        <div className="mb-8 h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mb-4 h-12 w-4/5 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mb-8 h-6 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mb-8 aspect-[16/8] w-full rounded-[32px] bg-gray-200 dark:bg-gray-700" />
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="h-4 rounded bg-gray-200 dark:bg-gray-700"
                style={{ width: `${84 + (item % 3) * 5}%` }}
              />
            ))}
          </div>
          <div className="h-52 rounded-[28px] bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <p className="mb-4 text-5xl">🔍</p>
        <h1 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
          {error ?? 'Article introuvable'}
        </h1>
        <p className="mb-8 text-gray-500 dark:text-gray-400">
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav className="mb-8 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
        <BackButton fallback="/blog" className="shrink-0" label="Retour" />
        <span>/</span>
        <Link to="/blog" className="transition hover:text-gray-700 dark:hover:text-gray-300">
          Journal
        </Link>
        {post.category && (
          <>
            <span>/</span>
            <span className="text-gray-500 dark:text-gray-400">{post.category}</span>
          </>
        )}
      </nav>

      <header className="mb-8 rounded-[32px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/70 sm:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
            <Tag className="h-3 w-3" />
            {storyLabel(post)}
          </span>
          {post.article_type && (
            <span className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:border-slate-800 dark:text-slate-400">
              {post.article_type}
            </span>
          )}
        </div>

        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">
          Journal KOKTEK
        </p>

        <h1 className="font-journal-display mt-3 max-w-4xl text-4xl leading-[0.98] text-gray-900 dark:text-gray-100 sm:text-5xl lg:text-6xl">
          {post.title}
        </h1>

        {post.summary && (
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-gray-500 dark:text-gray-400">
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
          {readingTime && (
            <div className="flex items-center gap-1.5">
              <Clock3 className="h-4 w-4" />
              <span>{readingTime} min de lecture</span>
            </div>
          )}
          {post.author_label && <span>{post.author_label}</span>}
        </div>
      </header>

      {coverImage && (
        <div className="mb-10 overflow-hidden rounded-[32px] border border-slate-200/80 shadow-[0_24px_60px_-35px_rgba(15,23,42,0.45)] dark:border-slate-800">
          <img
            src={coverImage}
            alt={post.cover_image_alt ?? post.title}
            className="max-h-[560px] w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
      )}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-12">
          {preparedContent.html ? (
            <div className="rounded-[32px] border border-slate-200/80 bg-white/92 p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.42)] backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/70 sm:p-8">
              <div
                className="blog-prose"
                dangerouslySetInnerHTML={{ __html: preparedContent.html }}
              />
            </div>
          ) : (
            <p className="py-12 text-center italic text-gray-400 dark:text-gray-500">
              Le contenu de cet article n'est pas encore disponible.
            </p>
          )}

          {recommendedProducts.length > 0 && (
            <section className="rounded-[32px] border border-amber-200/70 bg-amber-50/80 p-6 shadow-[0_24px_60px_-40px_rgba(180,83,9,0.18)] dark:border-amber-500/20 dark:bg-amber-500/5">
              <div className="mb-5">
                <p className="text-xs uppercase tracking-[0.25em] text-amber-600 dark:text-amber-300">
                  Selection KOKTEK
                </p>
                <h2 className="font-journal-display mt-2 text-3xl text-slate-950 dark:text-white">
                  Pour aller plus loin apres la lecture
                </h2>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Quelques produits coherents avec le sujet, presentes comme prolongement utile et non comme point de depart.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {recommendedProducts.map((product) => (
                  <RecommendedProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
          {preparedContent.toc.length > 0 && (
            <section className="rounded-[28px] border border-slate-200/80 bg-white/92 p-5 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.4)] backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/70">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                Dans cet article
              </p>
              <nav className="mt-4 space-y-3">
                {preparedContent.toc.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`block text-sm leading-6 text-slate-600 transition hover:text-amber-700 dark:text-slate-300 dark:hover:text-amber-300 ${
                      item.level === 3 ? 'pl-4' : ''
                    }`}
                  >
                    {item.text}
                  </a>
                ))}
              </nav>
            </section>
          )}

          <section className="rounded-[28px] border border-slate-200/80 bg-white/92 p-5 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.4)] backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/70">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
              Repere editorial
            </p>
            <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              <p>Le Journal KOKTEK part du besoin, pas du produit.</p>
              <p>Chaque article garde un lien avec la boutique sans redevenir une grille catalogue.</p>
            </div>
            <Link
              to="/catalogue"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition hover:gap-3 dark:text-white"
            >
              Revenir a la boutique
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </section>
        </aside>
      </div>

      {relatedPosts.length > 0 && (
        <section className="mt-14">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">
                Continuer la lecture
              </p>
              <h2 className="font-journal-display mt-3 text-4xl leading-none text-slate-950 dark:text-white">
                D autres angles utiles autour du meme univers.
              </h2>
            </div>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition hover:gap-3 dark:text-white"
            >
              Retour au Journal
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {relatedPosts.map((item) => (
              <RelatedArticleCard key={item.id} post={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default BlogPostPage
