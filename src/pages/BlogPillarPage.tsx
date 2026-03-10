import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { getBlogPosts } from '../lib/commerceApi'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import JournalPillarNav from '../components/journal/JournalPillarNav'
import {
  CompactStory,
  FeaturedStory,
  GuideCard,
  type JournalStoryCardPost,
} from '../components/journal/JournalStoryCards'
import { getJournalPillarMeta } from '../utils/journal'

const BlogPillarPage = () => {
  const { slug } = useParams<{ slug: string }>()
  const pillar = getJournalPillarMeta(slug)
  const [posts, setPosts] = useState<JournalStoryCardPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useDocumentMeta({
    title: pillar ? `${pillar.label} | Journal KOKTEK` : 'Journal KOKTEK',
    description: pillar?.description,
  })

  useEffect(() => {
    if (!pillar) {
      setPosts([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    getBlogPosts({ limit: 30, pillar: pillar.key })
      .then(setPosts)
      .catch(() => setError('Impossible de charger cette thematique pour le moment.'))
      .finally(() => setLoading(false))
  }, [pillar])

  if (!pillar) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">
          Journal KOKTEK
        </p>
        <h1 className="font-journal-display mt-4 text-4xl text-slate-950 dark:text-white">
          Thematique introuvable.
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
          Ce pilier editorial n existe pas ou n est pas encore configure.
        </p>
        <Link
          to="/blog"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au Journal
        </Link>
      </div>
    )
  }

  const featuredPost = posts.find((post) => post.featured) ?? posts[0]
  const remainingPosts = featuredPost ? posts.filter((post) => post.id !== featuredPost.id) : []
  const sideStories = remainingPosts.slice(0, 2)
  const guideStories = remainingPosts.slice(2)

  return (
    <div className="pb-20">
      <section className="px-4 pb-8 sm:px-6">
        <div
          className={`mx-auto overflow-hidden rounded-[36px] bg-gradient-to-br ${pillar.accentClass} p-[1px] shadow-[0_28px_90px_-35px_rgba(15,23,42,0.7)]`}
        >
          <div className="rounded-[35px] bg-[#f6f0e6]/94 px-7 py-8 dark:bg-[#0b1320]/92 sm:px-10 sm:py-10">
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">
              <Link to="/blog" className="transition hover:text-slate-900 dark:hover:text-white">
                Journal
              </Link>
              <span>/</span>
              <span>{pillar.eyebrow}</span>
            </div>

            <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
              <div>
                <h1 className="font-journal-display max-w-3xl text-5xl leading-[0.95] text-slate-950 dark:text-white sm:text-6xl">
                  {pillar.label}
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
                  {pillar.description}
                </p>
              </div>

              <div className="rounded-[28px] border border-slate-200/70 bg-white/80 p-6 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/60">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                  Navigation editoriale
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Chaque pilier regroupe les articles qui servent une meme autorite de marque.
                </p>
                <div className="mt-5">
                  <JournalPillarNav activePillar={pillar.key} />
                </div>
              </div>
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
        <section className="px-4 py-8 sm:px-6">
          <div className="mx-auto max-w-4xl rounded-[32px] border border-rose-200 bg-rose-50/90 p-8 text-center dark:border-rose-900/70 dark:bg-rose-950/20">
            <p className="text-sm font-medium text-rose-700 dark:text-rose-300">{error}</p>
          </div>
        </section>
      )}

      {!loading && !error && posts.length === 0 && (
        <section className="px-4 py-8 sm:px-6">
          <div className="mx-auto max-w-4xl rounded-[32px] border border-slate-200 bg-white/88 p-12 text-center shadow-[0_24px_60px_-35px_rgba(15,23,42,0.4)] dark:border-slate-800 dark:bg-slate-950/70">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">
              {pillar.label}
            </p>
            <h2 className="font-journal-display mt-4 text-4xl text-slate-950 dark:text-white">
              Ce pilier attend encore ses premiers articles.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              La structure est prete. Il reste a publier les prochains sujets lies a cette thematique.
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
                    Dans ce pilier
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    Une lecture resserree sur le meme territoire editorial, avec une logique de media plutot que de catalogue.
                  </p>
                </div>
                {sideStories.map((post) => (
                  <CompactStory key={post.id} post={post} />
                ))}
              </div>
            </div>
          </section>

          {guideStories.length > 0 && (
            <section className="px-4 py-8 sm:px-6">
              <div className="mx-auto max-w-6xl">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="max-w-2xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">
                      Tous les articles
                    </p>
                    <h2 className="font-journal-display mt-4 text-4xl leading-none text-slate-950 dark:text-white">
                      Une vue plus profonde de {pillar.label.toLowerCase()}.
                    </h2>
                  </div>
                  <Link
                    to="/blog"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition hover:gap-3 dark:text-white"
                  >
                    Retour au Journal
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

export default BlogPillarPage
