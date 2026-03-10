import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Clock3, Sparkles } from 'lucide-react'
import { getBlogPosts, type BlogPost } from '../lib/commerceApi'
import { resolveImageUrl } from '../utils/image'
import { useDocumentMeta } from '../hooks/useDocumentMeta'

type BlogPostListItem = Omit<BlogPost, 'content' | 'products' | 'seo_title' | 'seo_description'>

const editorialThemes = [
  {
    title: 'Auto & Mobilite',
    description: 'Trajets, recharge, support voiture, roadtrips et usages nomades.',
    accent: 'from-[#1d3d63] to-[#2d6a8f]',
  },
  {
    title: 'Tech & Productivite',
    description: 'Bureau, batterie, organisation mobile et accessoires vraiment utiles.',
    accent: 'from-[#734d17] to-[#c7771f]',
  },
  {
    title: 'Lifestyle & Protection',
    description: 'Voyage, sport, photo mobile et reflexes simples pour mieux proteger ses appareils.',
    accent: 'from-[#2e4d43] to-[#628d7b]',
  },
]

const formatDate = (iso?: string | null) => {
  if (!iso) return ''
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso.endsWith('Z') || iso.includes('+') ? iso : `${iso}Z`))
}

const getStoryLabel = (post: BlogPostListItem) =>
  post.pillar ?? post.category ?? post.article_type ?? 'Guide pratique'

const getReadingLabel = (post: BlogPostListItem) =>
  post.reading_time ? `${post.reading_time} min de lecture` : 'Lecture essentielle'

const StoryMeta = ({ post, compact = false }: { post: BlogPostListItem; compact?: boolean }) => (
  <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-sm ${compact ? 'text-slate-500 dark:text-slate-400' : 'text-slate-600 dark:text-slate-300'}`}>
    <span className="rounded-full border border-slate-300/70 bg-white/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
      {getStoryLabel(post)}
    </span>
    {post.published_at && <time>{formatDate(post.published_at)}</time>}
    <span className="inline-flex items-center gap-1">
      <Clock3 className="h-3.5 w-3.5" />
      {getReadingLabel(post)}
    </span>
  </div>
)

const StoryImage = ({ post, className }: { post: BlogPostListItem; className: string }) => {
  const image = resolveImageUrl(post.cover_image, '')

  if (!image) {
    return (
      <div className={`flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.75),_transparent_40%),linear-gradient(135deg,_#d9dde9,_#f7f4ee)] dark:bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.2),_transparent_40%),linear-gradient(135deg,_#162235,_#0f172a)] ${className}`}>
        <span className="text-center font-journal-display text-3xl text-slate-500 dark:text-slate-300">
          Journal
        </span>
      </div>
    )
  }

  return (
    <img
      src={image}
      alt={post.cover_image_alt ?? post.title}
      className={className}
      loading="lazy"
      decoding="async"
    />
  )
}

const FeaturedStory = ({ post }: { post: BlogPostListItem }) => (
  <article className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/92 shadow-[0_24px_70px_-28px_rgba(15,23,42,0.38)] backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/70">
    <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
      <Link to={`/blog/${post.slug}`} className="block overflow-hidden">
        <StoryImage post={post} className="h-full min-h-[320px] w-full object-cover transition duration-700 hover:scale-[1.03]" />
      </Link>

      <div className="flex flex-col justify-between p-7 sm:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-600 dark:text-amber-400">
            A la une
          </p>
          <h2 className="font-journal-display mt-4 text-3xl leading-[1.02] text-slate-950 dark:text-white sm:text-4xl">
            <Link to={`/blog/${post.slug}`} className="transition hover:text-amber-700 dark:hover:text-amber-300">
              {post.title}
            </Link>
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-600 dark:text-slate-300">
            {post.summary ?? 'Un guide utile, concret et directement connecte aux usages reellement recherches.'}
          </p>
        </div>

        <div className="mt-8 space-y-5">
          <StoryMeta post={post} />
          <Link
            to={`/blog/${post.slug}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-950 transition hover:gap-3 dark:text-white"
          >
            Lire l article
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  </article>
)

const CompactStory = ({ post }: { post: BlogPostListItem }) => (
  <article className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/88 p-4 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.45)] backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/70">
    <Link to={`/blog/${post.slug}`} className="block overflow-hidden rounded-[22px]">
      <StoryImage post={post} className="h-48 w-full object-cover transition duration-700 hover:scale-[1.03]" />
    </Link>
    <div className="mt-4">
      <StoryMeta post={post} compact />
      <h3 className="font-journal-display mt-3 text-2xl leading-tight text-slate-950 dark:text-white">
        <Link to={`/blog/${post.slug}`} className="transition hover:text-amber-700 dark:hover:text-amber-300">
          {post.title}
        </Link>
      </h3>
      {post.summary && (
        <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
          {post.summary}
        </p>
      )}
    </div>
  </article>
)

const GuideCard = ({ post }: { post: BlogPostListItem }) => (
  <article className="group flex h-full flex-col rounded-[28px] border border-slate-200/80 bg-white/88 p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-sm transition hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-950/70">
    <Link to={`/blog/${post.slug}`} className="block overflow-hidden rounded-[22px]">
      <StoryImage post={post} className="aspect-[4/3] w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
    </Link>
    <div className="mt-5 flex flex-1 flex-col">
      <StoryMeta post={post} compact />
      <h3 className="font-journal-display mt-3 text-[1.9rem] leading-[1.08] text-slate-950 dark:text-white">
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
        Continuer
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  </article>
)

const BlogListPage = () => {
  useDocumentMeta({
    title: 'Journal KOKTEK',
    description: 'Le media pratique de KOKTEK : guides utiles, usages smartphone, mobilite et lifestyle.',
  })

  const [posts, setPosts] = useState<BlogPostListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getBlogPosts({ limit: 50 })
      .then(setPosts)
      .catch(() => setError('Impossible de charger le Journal pour le moment.'))
      .finally(() => setLoading(false))
  }, [])

  const featuredPost = posts.find((post) => post.featured) ?? posts[0]
  const remainingPosts = featuredPost ? posts.filter((post) => post.id !== featuredPost.id) : []
  const sideStories = remainingPosts.slice(0, 2)
  const guideStories = remainingPosts.slice(2)
  const editorialTags = Array.from(
    new Set(posts.map((post) => getStoryLabel(post)).filter(Boolean)),
  ).slice(0, 5)

  return (
    <div className="pb-20">
      <section className="px-4 pb-8 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="overflow-hidden rounded-[36px] bg-[#112033] px-7 py-8 text-white shadow-[0_28px_90px_-35px_rgba(15,23,42,0.7)] sm:px-10 sm:py-10">
            <p className="text-xs font-semibold uppercase tracking-[0.38em] text-amber-300">
              Le Journal KOKTEK
            </p>
            <h1 className="font-journal-display mt-5 max-w-3xl text-5xl leading-[0.94] sm:text-6xl">
              Une ambiance editoriale propre, sans couper le lien avec la boutique.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Conseils reels, usages terrain, selections utiles. Ici, KOKTEK parle d abord des
              situations de vie, ensuite seulement des solutions.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={featuredPost ? `/blog/${featuredPost.slug}` : '/catalogue'}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-100"
              >
                {featuredPost ? 'Lire la une' : 'Voir la boutique'}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/catalogue"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/16"
              >
                Explorer la boutique
              </Link>
            </div>

            {editorialTags.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2">
                {editorialTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/12 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-100"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-[36px] border border-slate-200/70 bg-white/75 p-7 shadow-[0_20px_70px_-35px_rgba(15,23,42,0.4)] backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/65">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
              <Sparkles className="h-4 w-4" />
              Manifeste editorial
            </div>
            <h2 className="font-journal-display mt-5 text-3xl leading-tight text-slate-950 dark:text-white">
              Meme marque, autre ambiance.
            </h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              <p>Le Journal sert a inspirer, clarifier et aider avant de vendre.</p>
              <p>Les sujets restent a l intersection entre smartphone, mobilite, lifestyle et usage reel.</p>
              <p>Le produit devient une consequence logique, pas le point de depart du recit.</p>
            </div>
          </div>
        </div>
      </section>

      {loading && (
        <section className="px-4 py-6 sm:px-6">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="h-[440px] animate-pulse rounded-[32px] bg-white/70 dark:bg-slate-900/50" />
            <div className="space-y-6">
              <div className="h-[212px] animate-pulse rounded-[28px] bg-white/70 dark:bg-slate-900/50" />
              <div className="h-[212px] animate-pulse rounded-[28px] bg-white/70 dark:bg-slate-900/50" />
            </div>
          </div>
        </section>
      )}

      {error && (
        <section className="px-4 py-10 sm:px-6">
          <div className="mx-auto max-w-4xl rounded-[32px] border border-rose-200 bg-rose-50/90 p-8 text-center dark:border-rose-900/70 dark:bg-rose-950/20">
            <p className="text-sm font-medium text-rose-700 dark:text-rose-300">{error}</p>
          </div>
        </section>
      )}

      {!loading && !error && posts.length === 0 && (
        <section className="px-4 py-10 sm:px-6">
          <div className="mx-auto max-w-4xl rounded-[32px] border border-slate-200 bg-white/88 p-12 text-center shadow-[0_24px_60px_-35px_rgba(15,23,42,0.4)] dark:border-slate-800 dark:bg-slate-950/70">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">
              Journal KOKTEK
            </p>
            <h2 className="font-journal-display mt-4 text-4xl text-slate-950 dark:text-white">
              Le prochain article arrive bientot.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              La structure editoriale est en place. Il manque seulement le prochain sujet publie.
            </p>
          </div>
        </section>
      )}

      {!loading && !error && featuredPost && (
        <>
          <section className="px-4 py-6 sm:px-6">
            <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <FeaturedStory post={featuredPost} />

              <div className="space-y-6">
                <div className="rounded-[28px] border border-slate-200/70 bg-white/80 p-5 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/65">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                    Dernieres lectures
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    Une selection courte pour entrer dans le Journal par l usage, pas par la fiche produit.
                  </p>
                </div>
                {sideStories.map((post) => (
                  <CompactStory key={post.id} post={post} />
                ))}
              </div>
            </div>
          </section>

          <section id="themes" className="px-4 py-10 sm:px-6">
            <div className="mx-auto max-w-6xl">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">
                  Thématiques editoriales
                </p>
                <h2 className="font-journal-display mt-4 text-4xl leading-none text-slate-950 dark:text-white">
                  Des piliers clairs pour structurer l autorite du Journal.
                </h2>
              </div>

              <div className="mt-8 grid gap-5 lg:grid-cols-3">
                {editorialThemes.map((theme) => (
                  <article
                    key={theme.title}
                    className={`overflow-hidden rounded-[30px] bg-gradient-to-br ${theme.accent} p-[1px] shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]`}
                  >
                    <div className="h-full rounded-[29px] bg-white/94 p-6 dark:bg-slate-950/80">
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                        Pilier
                      </p>
                      <h3 className="font-journal-display mt-3 text-3xl leading-tight text-slate-950 dark:text-white">
                        {theme.title}
                      </h3>
                      <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                        {theme.description}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {guideStories.length > 0 && (
            <section id="guides" className="px-4 py-8 sm:px-6">
              <div className="mx-auto max-w-6xl">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="max-w-2xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">
                      Guides & recits utiles
                    </p>
                    <h2 className="font-journal-display mt-4 text-4xl leading-none text-slate-950 dark:text-white">
                      Une lecture plus ample, moins grille e commerce.
                    </h2>
                  </div>
                  <Link
                    to="/catalogue"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition hover:gap-3 dark:text-white"
                  >
                    Revenir a la boutique
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {guideStories.map((post) => (
                    <GuideCard key={post.id} post={post} />
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

export default BlogListPage
