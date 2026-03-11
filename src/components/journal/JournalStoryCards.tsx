import { Link } from 'react-router-dom'
import { ArrowRight, Clock3 } from 'lucide-react'
import { type BlogPost } from '../../lib/commerceApi'
import { resolveImageUrl } from '../../utils/image'
import { getJournalPillarMeta, getJournalStoryLabel } from '../../utils/journal'

export type JournalStoryCardPost = Omit<
  BlogPost,
  'content' | 'products' | 'seo_title' | 'seo_description'
>

const formatDate = (iso?: string | null) => {
  if (!iso) return ''
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso.endsWith('Z') || iso.includes('+') ? iso : `${iso}Z`))
}

const getReadingLabel = (post: JournalStoryCardPost) =>
  post.reading_time ? `${post.reading_time} min de lecture` : 'Lecture essentielle'

const StoryTopicChip = ({
  post,
  compact = false,
}: {
  post: JournalStoryCardPost
  compact?: boolean
}) => {
  const pillarMeta = getJournalPillarMeta(post.pillar)

  if (pillarMeta) {
    return (
      <Link
        to={`/blog/theme/${pillarMeta.key}`}
        className={`rounded-full border border-slate-300/70 bg-white/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700 transition dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 ${
          compact
            ? 'hover:border-slate-400 hover:text-slate-950 dark:hover:border-slate-500 dark:hover:text-white'
            : 'hover:border-slate-950 hover:text-slate-950 dark:hover:border-slate-400 dark:hover:text-white'
        }`}
      >
        {pillarMeta.label}
      </Link>
    )
  }

  return (
    <span className="rounded-full border border-slate-300/70 bg-white/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
      {getJournalStoryLabel(post)}
    </span>
  )
}

export const StoryMeta = ({
  post,
  compact = false,
}: {
  post: JournalStoryCardPost
  compact?: boolean
}) => (
  <div
    className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-sm ${compact ? 'text-slate-500 dark:text-slate-400' : 'text-slate-600 dark:text-slate-300'}`}
  >
    <StoryTopicChip post={post} compact={compact} />
    {post.published_at && <time>{formatDate(post.published_at)}</time>}
    <span className="inline-flex items-center gap-1">
      <Clock3 className="h-3.5 w-3.5" />
      {getReadingLabel(post)}
    </span>
  </div>
)

const StoryImage = ({
  post,
  className,
}: {
  post: JournalStoryCardPost
  className: string
}) => {
  const image = resolveImageUrl(post.cover_image, '')

  if (!image) {
    return (
      <div
        className={`flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.75),_transparent_40%),linear-gradient(135deg,_#d9dde9,_#f7f4ee)] dark:bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.2),_transparent_40%),linear-gradient(135deg,_#162235,_#0f172a)] ${className}`}
      >
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

export const FeaturedStory = ({ post }: { post: JournalStoryCardPost }) => (
  <article className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/92 shadow-[0_24px_70px_-28px_rgba(15,23,42,0.38)] backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/70">
    <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
      <Link to={`/blog/${post.slug}`} className="block overflow-hidden">
        <StoryImage
          post={post}
          className="h-full min-h-[320px] w-full object-cover transition duration-700 hover:scale-[1.03]"
        />
      </Link>

      <div className="flex flex-col justify-between p-7 sm:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-600 dark:text-amber-400">
            A la une
          </p>
          <h2 className="font-journal-display mt-4 text-3xl leading-[1.02] text-slate-950 dark:text-white sm:text-4xl">
            <Link
              to={`/blog/${post.slug}`}
              className="transition hover:text-amber-700 dark:hover:text-amber-300"
            >
              {post.title}
            </Link>
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-600 dark:text-slate-300">
            {post.summary ??
              'Un guide utile, concret et directement connecte aux usages reellement recherches.'}
          </p>
        </div>

        <div className="mt-8 space-y-5">
          <StoryMeta post={post} />
          <div className="flex flex-wrap items-center gap-4">
            <Link
              to={`/blog/${post.slug}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-950 transition hover:gap-3 dark:text-white"
            >
              Lire l article
              <ArrowRight className="h-4 w-4" />
            </Link>
            {getJournalPillarMeta(post.pillar) && (
              <Link
                to={`/blog/theme/${getJournalPillarMeta(post.pillar)?.key}`}
                className="text-sm font-semibold text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                Explorer la thématique
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  </article>
)

export const CompactStory = ({ post }: { post: JournalStoryCardPost }) => (
  <article className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/88 p-4 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.45)] backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/70">
    <Link to={`/blog/${post.slug}`} className="block overflow-hidden rounded-[22px]">
      <StoryImage
        post={post}
        className="h-48 w-full object-cover transition duration-700 hover:scale-[1.03]"
      />
    </Link>
    <div className="mt-4">
      <StoryMeta post={post} compact />
      <h3 className="font-journal-display mt-3 text-2xl leading-tight text-slate-950 dark:text-white">
        <Link
          to={`/blog/${post.slug}`}
          className="transition hover:text-amber-700 dark:hover:text-amber-300"
        >
          {post.title}
        </Link>
      </h3>
      {post.summary && (
        <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
          {post.summary}
        </p>
      )}
      {getJournalPillarMeta(post.pillar) && (
        <Link
          to={`/blog/theme/${getJournalPillarMeta(post.pillar)?.key}`}
          className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          Voir la thématique
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  </article>
)

export const GuideCard = ({ post }: { post: JournalStoryCardPost }) => (
  <article className="group flex h-full flex-col rounded-[28px] border border-slate-200/80 bg-white/88 p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-sm transition hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-950/70">
    <Link to={`/blog/${post.slug}`} className="block overflow-hidden rounded-[22px]">
      <StoryImage
        post={post}
        className="aspect-[4/3] w-full object-cover transition duration-700 group-hover:scale-[1.04]"
      />
    </Link>
    <div className="mt-5 flex flex-1 flex-col">
      <StoryMeta post={post} compact />
      <h3 className="font-journal-display mt-3 text-[1.9rem] leading-[1.08] text-slate-950 dark:text-white">
        <Link
          to={`/blog/${post.slug}`}
          className="transition hover:text-amber-700 dark:hover:text-amber-300"
        >
          {post.title}
        </Link>
      </h3>
      {post.summary && (
        <p className="mt-3 line-clamp-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
          {post.summary}
        </p>
      )}
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Link
          to={`/blog/${post.slug}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition hover:gap-3 dark:text-white"
        >
          Continuer
          <ArrowRight className="h-4 w-4" />
        </Link>
        {getJournalPillarMeta(post.pillar) && (
          <Link
            to={`/blog/theme/${getJournalPillarMeta(post.pillar)?.key}`}
            className="text-sm font-semibold text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            Voir le pilier
          </Link>
        )}
      </div>
    </div>
  </article>
)
