import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { getBlogPosts } from '../lib/commerceApi'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { useStructuredData } from '../hooks/useStructuredData'
import JournalPillarNav from '../components/journal/JournalPillarNav'
import {
  CompactStory,
  FeaturedStory,
  GuideCard,
  type JournalStoryCardPost,
} from '../components/journal/JournalStoryCards'
import { getJournalPillarMeta } from '../utils/journal'
import { resolveJournalCoverImage } from '../utils/image'
import { buildBreadcrumbJsonLd, toAbsoluteSiteUrl, toAbsoluteUrl } from '../utils/seo'

const BlogPillarPage = () => {
  const { slug } = useParams<{ slug: string }>()
  const pillar = getJournalPillarMeta(slug)
  const [posts, setPosts] = useState<JournalStoryCardPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const pillarUrl = pillar ? toAbsoluteSiteUrl(`/blog/theme/${pillar.key}`) : undefined
  const featuredPost = posts.find((post) => post.featured) ?? posts[0]
  const featuredImage = toAbsoluteUrl(
    resolveJournalCoverImage({
      coverImage: featuredPost?.cover_image,
      title: featuredPost?.title,
      pillar: featuredPost?.pillar,
      category: featuredPost?.category,
      fallback: '',
    }),
  )

  useDocumentMeta({
    title: pillar ? `${pillar.label} | Journal KOKTEK` : 'Journal KOKTEK',
    description: pillar?.description,
    image: featuredImage,
    url: pillarUrl,
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
      .catch(() => setError('Impossible de charger cette thématique pour le moment.'))
      .finally(() => setLoading(false))
  }, [pillar])

  useStructuredData(
    pillar
      ? {
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'CollectionPage',
              name: `${pillar.label} | Journal KOKTEK`,
              description: pillar.description,
              url: pillarUrl,
              inLanguage: 'fr-FR',
              isPartOf: {
                '@type': 'WebSite',
                name: 'KOKTEK',
                url: toAbsoluteSiteUrl('/'),
              },
              ...(posts.length > 0
                ? {
                    mainEntity: {
                      '@type': 'ItemList',
                      itemListElement: posts.slice(0, 10).map((post, index) => ({
                        '@type': 'ListItem',
                        position: index + 1,
                        url: toAbsoluteSiteUrl(`/blog/${post.slug}`),
                        name: post.title,
                      })),
                    },
                  }
                : {}),
            },
            buildBreadcrumbJsonLd([
              { name: 'Accueil', url: toAbsoluteSiteUrl('/') },
              { name: 'Journal KOKTEK', url: toAbsoluteSiteUrl('/blog') },
              { name: pillar.label, url: pillarUrl ?? toAbsoluteSiteUrl('/blog') },
            ]),
          ],
        }
      : null,
    'journal-pillar-structured-data',
  )

  if (!pillar) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">
          Journal KOKTEK
        </p>
        <h1 className="font-journal-display mt-4 text-4xl text-slate-950 dark:text-white">
          Thématique introuvable.
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
          Ce pilier éditorial n’existe pas ou n’est pas encore configuré.
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

  const remainingPosts = featuredPost ? posts.filter((post) => post.id !== featuredPost.id) : []
  const sideStories = remainingPosts.slice(0, 2)
  const guideStories = remainingPosts.slice(2)
  const pillarSupportCards = [
    {
      title: 'Lecture express',
      text: 'Retrouvez ici nos guides, astuces et sélections d’experts pour booster votre quotidien tech.',
    },
    {
      title: 'Rester dans le bon pilier',
      text: 'Même avec peu d’articles, la lecture reste fluide et recentrée sur les conseils les plus utiles de cette thématique.',
    },
  ]

  return (
    <div className="pb-16">
      <section className="px-4 pb-6 sm:px-6">
        <div
          className={`mx-auto overflow-hidden rounded-[34px] bg-gradient-to-br ${pillar.accentClass} p-[1px] shadow-[0_28px_90px_-35px_rgba(15,23,42,0.7)]`}
        >
          <div className="rounded-[33px] bg-slate-950/18 px-6 py-7 backdrop-blur-[2px] sm:px-9 sm:py-9">
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.32em] text-white/72">
              <Link to="/blog" className="transition hover:text-white">
                Journal
              </Link>
              <span>/</span>
              <span>{pillar.eyebrow}</span>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <h1 className="font-journal-display max-w-3xl text-5xl leading-[0.95] text-white sm:text-6xl">
                  {pillar.label}
                </h1>
                <p className="mt-4 max-w-2xl text-[15px] leading-7 text-white sm:text-[1.08rem]">
                  {pillar.description}
                </p>
              </div>

              <div className="rounded-[26px] border border-white/14 bg-white/10 p-5 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/72">
                  Navigation éditoriale
                </p>
                <p className="mt-3 text-[15px] leading-7 text-white">
                  Naviguez par thématique pour trouver le guide, l’astuce ou l’accessoire qui correspond exactement à vos besoins.
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
            <p className="mt-4 text-[15px] leading-7 text-slate-600 dark:text-slate-300">
              Retrouvez ici nos guides, astuces et sélections d’experts pour booster votre quotidien tech.
            </p>
          </div>
        </section>
      )}

      {!loading && !error && featuredPost && (
        <>
          <section className="px-4 py-5 sm:px-6">
            <div className={`mx-auto grid max-w-6xl gap-4 ${sideStories.length > 0 ? 'lg:grid-cols-[1.18fr_0.82fr]' : 'lg:grid-cols-[1.1fr_0.9fr]'}`}>
              <FeaturedStory post={featuredPost} />

              <div className={sideStories.length > 0 ? 'space-y-4' : 'grid gap-4 sm:grid-cols-2 lg:grid-cols-1'}>
                <div className="rounded-[26px] border border-slate-200/70 bg-[#f8f2e8]/84 p-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/65">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                    Dans ce pilier
                  </p>
                  <p className="mt-3 text-[15px] leading-7 text-slate-600 dark:text-slate-300">
                    Retrouvez ici nos guides, astuces et sélections d’experts pour booster votre quotidien tech.
                  </p>
                </div>
                {sideStories.length === 0 &&
                  pillarSupportCards.map((card) => (
                    <div
                      key={card.title}
                      className="rounded-[26px] border border-slate-200/70 bg-white/88 p-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-950/70"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                        {card.title}
                      </p>
                      <p className="mt-3 text-[15px] leading-7 text-slate-600 dark:text-slate-300">
                        {card.text}
                      </p>
                    </div>
                  ))}
                {sideStories.map((post) => (
                  <CompactStory key={post.id} post={post} />
                ))}
              </div>
            </div>
          </section>

          {guideStories.length > 0 && (
            <section className="px-4 py-7 sm:px-6">
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

                <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {guideStories.map((post) => (
                    <GuideCard key={post.id} post={post} />
                  ))}
                </div>
              </div>
            </section>
          )}

          <section className="px-4 py-7 sm:px-6">
            <div className="mx-auto max-w-6xl rounded-[30px] border border-slate-200/80 bg-[#f8f2e8]/92 p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.42)] backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/70 sm:p-7">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">
                  Explorer aussi
                </p>
                <h2 className="font-journal-display mt-3 text-4xl leading-none text-slate-950 dark:text-white">
                  D’autres chemins du Journal KOKTEK.
                </h2>
                <p className="mt-4 text-[15px] leading-7 text-slate-600 dark:text-slate-300">
                  Passez d’un univers à l’autre pour continuer la lecture selon vos usages, votre mobilité ou vos besoins du moment.
                </p>
              </div>
              <div className="mt-6">
                <JournalPillarNav activePillar={pillar.key} />
              </div>
              <div className="mt-6">
                <Link
                  to="/blog"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition hover:gap-3 dark:text-white"
                >
                  Revenir à la une du Journal
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default BlogPillarPage
