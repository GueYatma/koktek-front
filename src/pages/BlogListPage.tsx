import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import { getBlogPosts } from '../lib/commerceApi'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import JournalPillarNav from '../components/journal/JournalPillarNav'
import {
  CompactStory,
  FeaturedStory,
  GuideCard,
  type JournalStoryCardPost,
} from '../components/journal/JournalStoryCards'
import { JOURNAL_PILLARS, getJournalPillarMeta, getJournalStoryLabel } from '../utils/journal'

const BlogListPage = () => {
  useDocumentMeta({
    title: 'Journal KOKTEK',
    description: 'Astuces, guides et inspirations pour tirer le meilleur de vos equipements tech au quotidien.',
  })

  const [posts, setPosts] = useState<JournalStoryCardPost[]>([])
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
    new Set(posts.map((post) => getJournalStoryLabel(post)).filter(Boolean)),
  ).slice(0, 5)

  const themeCards = useMemo(
    () =>
      JOURNAL_PILLARS.map((pillar) => ({
        ...pillar,
        count: posts.filter((post) => getJournalPillarMeta(post.pillar)?.key === pillar.key).length,
      })),
    [posts],
  )

  return (
    <div className="pb-20">
      <section className="px-4 pb-8 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="overflow-hidden rounded-[36px] bg-[#112033] px-7 py-8 text-white shadow-[0_28px_90px_-35px_rgba(15,23,42,0.7)] sm:px-10 sm:py-10">
            <p className="text-xs font-semibold uppercase tracking-[0.38em] text-amber-300">
              Journal premium
            </p>
            <h1 className="font-journal-display mt-5 max-w-3xl text-5xl leading-[0.94] sm:text-6xl">
              Le Journal KOKTEK
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Astuces, guides et inspirations pour tirer le meilleur de vos equipements tech au
              quotidien.
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
              A la une
            </div>
            <h2 className="font-journal-display mt-5 text-3xl leading-tight text-slate-950 dark:text-white">
              Explorez nos dernieres decouvertes
            </h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              <p>Des contenus utiles pour mieux choisir, utiliser et proteger vos equipements tech.</p>
              <p>Des guides concrets pour la mobilite, le bureau, la creation mobile et le quotidien.</p>
              <p>Des recommandations simples pour avancer plus vite, sans jargon inutile.</p>
            </div>
            <div className="mt-6">
              <JournalPillarNav />
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
                    Explorez nos dernieres decouvertes et trouvez rapidement le guide qui vous
                    correspond.
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
                  Nos conseils d experts pour votre mobilite et vos usages tech.
                </h2>
              </div>

              <div className="mt-8 grid gap-5 lg:grid-cols-3">
                {themeCards.map((theme) => (
                  <article
                    key={theme.key}
                    className={`overflow-hidden rounded-[30px] bg-gradient-to-br ${theme.accentClass} p-[1px] shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]`}
                  >
                    <div className="flex h-full flex-col rounded-[29px] bg-white/94 p-6 dark:bg-slate-950/80">
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                        {theme.eyebrow}
                      </p>
                      <h3 className="font-journal-display mt-3 text-3xl leading-tight text-slate-950 dark:text-white">
                        {theme.label}
                      </h3>
                      <p className="mt-4 flex-1 text-sm leading-7 text-slate-600 dark:text-slate-300">
                        {theme.description}
                      </p>
                      <div className="mt-5 flex items-center justify-between gap-4">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          {theme.count} article{theme.count > 1 ? 's' : ''}
                        </span>
                        <Link
                          to={`/blog/theme/${theme.key}`}
                          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition hover:gap-3 dark:text-white"
                        >
                          Explorer
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
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
                      Des lectures utiles pour mieux equiper votre quotidien.
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
