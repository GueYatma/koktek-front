import { Link } from 'react-router-dom'
import { JOURNAL_PILLARS, normalizePillarSlug } from '../../utils/journal'

type JournalPillarNavProps = {
  activePillar?: string | null
}

const JournalPillarNav = ({ activePillar }: JournalPillarNavProps) => {
  const activeSlug = normalizePillarSlug(activePillar)

  return (
    <div className="flex flex-wrap gap-2">
      {JOURNAL_PILLARS.map((pillar) => {
        const isActive = pillar.key === activeSlug

        return (
          <Link
            key={pillar.key}
            to={`/blog/theme/${pillar.key}`}
            className={`rounded-full border px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
              isActive
                ? 'border-slate-950 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950'
                : 'border-slate-300/80 bg-white/85 text-slate-700 hover:border-slate-950 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-slate-400 dark:hover:text-white'
            }`}
          >
            {pillar.label}
          </Link>
        )
      })}
    </div>
  )
}

export default JournalPillarNav
