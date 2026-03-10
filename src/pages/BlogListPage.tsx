import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getBlogPosts, type BlogPost } from '../lib/commerceApi'
import { resolveImageUrl } from '../utils/image'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import BackButton from '../components/BackButton'

type BlogPostListItem = Omit<BlogPost, 'content' | 'products' | 'seo_title' | 'seo_description'>

const formatDate = (iso?: string | null) => {
  if (!iso) return ''
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z'))
}

const BlogCard = ({ post }: { post: BlogPostListItem }) => {
  const image = resolveImageUrl(post.cover_image, '')
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition hover:shadow-lg hover:-translate-y-0.5">
      <Link to={`/blog/${post.slug}`} className="block">
        {image ? (
          <div className="aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-700">
            <img
              src={image}
              alt={post.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              loading="lazy"
              decoding="async"
            />
          </div>
        ) : (
          <div className="aspect-video w-full bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-950/40 dark:to-indigo-900/20 flex items-center justify-center">
            <span className="text-5xl opacity-30">✍️</span>
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-5">
        {post.category && (
          <span className="inline-block self-start rounded-full bg-indigo-100 dark:bg-indigo-950/40 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
            {post.category}
          </span>
        )}
        <Link
          to={`/blog/${post.slug}`}
          className="text-lg font-semibold leading-snug text-gray-900 dark:text-gray-100 hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors line-clamp-2"
        >
          {post.title}
        </Link>
        {post.summary && (
          <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400 line-clamp-3">
            {post.summary}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between pt-2">
          {post.published_at && (
            <time className="text-xs text-gray-400 dark:text-gray-500">
              {formatDate(post.published_at)}
            </time>
          )}
          <Link
            to={`/blog/${post.slug}`}
            className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          >
            Lire l'article <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </div>
      </div>
    </article>
  )
}

const BlogListPage = () => {
  useDocumentMeta({
    title: 'Blog – Conseils & Guides',
    description: 'Conseils, guides d\'achat et actualités pour bien choisir vos accessoires smartphone.',
  })

  const [posts, setPosts] = useState<BlogPostListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    getBlogPosts({ limit: 50 })
      .then(setPosts)
      .catch(() => setError('Impossible de charger les articles.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="mb-10 flex items-start gap-4">
        <BackButton fallback="/" className="mt-1 shrink-0" />
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500">KOKTEK</p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-gray-100">Blog</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Conseils, guides d'achat &amp; actualités accessoires smartphone
          </p>
        </div>
      </div>

      {loading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
              <div className="aspect-video bg-gray-200 dark:bg-gray-700" />
              <div className="p-5 space-y-3">
                <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-5 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/20 p-6 text-center">
          <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
        </div>
      )}

      {!loading && !error && posts.length === 0 && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-12 text-center">
          <p className="text-4xl mb-4">✍️</p>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Aucun article publié pour l'instant.</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Revenez bientôt !</p>
        </div>
      )}

      {!loading && !error && posts.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}

export default BlogListPage
