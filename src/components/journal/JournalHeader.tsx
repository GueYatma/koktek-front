import { Link, useLocation } from 'react-router-dom'
import { ArrowUpRight, Moon, Sun } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

const navItems = [
  { label: 'Une', href: '/blog' },
  { label: 'Auto & Mobilité', href: '/blog/theme/auto-mobilite' },
  { label: 'Tech & Productivité', href: '/blog/theme/tech-productivite' },
  { label: 'Lifestyle & Protection', href: '/blog/theme/lifestyle-protection' },
  { label: 'Création Mobile', href: '/blog/theme/creation-mobile' },
  { label: 'Guides d’Achat', href: '/blog/theme/guides-achat' },
]

const JournalHeader = () => {
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const isHome = location.pathname === '/blog'

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="pointer-events-auto mx-auto max-w-[90rem]">
        <div className="relative overflow-hidden rounded-[30px] border border-white/45 bg-[#f7f1e6]/88 shadow-[0_28px_70px_-38px_rgba(15,23,42,0.45)] ring-1 ring-slate-200/55 backdrop-blur-2xl dark:border-slate-700/60 dark:bg-[#0d1624]/88 dark:ring-slate-700/40">
          <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/80 to-transparent dark:via-amber-200/40" />
          <div className="absolute -left-8 top-2 h-24 w-24 rounded-full bg-white/55 blur-3xl dark:bg-slate-500/15" />
          <div className="absolute -right-10 top-0 h-28 w-28 rounded-full bg-amber-300/20 blur-3xl dark:bg-amber-200/10" />

          <div className="px-4 py-4 sm:px-6 sm:py-5 xl:px-8 xl:py-6">
            <div className="flex items-start gap-4 xl:items-center">
              <Link to="/" className="shrink-0 rounded-[22px] border border-slate-200/80 bg-white/78 px-4 py-3 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.6)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_48px_-28px_rgba(15,23,42,0.5)] dark:border-slate-700/80 dark:bg-slate-950/60">
                <span className="logo-koktek text-[2rem] font-black uppercase text-slate-950 dark:text-white sm:text-[2.25rem]">
                  KOKTEK
                </span>
              </Link>

              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-1 border-l border-slate-300/70 pl-4 sm:pl-5 dark:border-slate-700/70">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-slate-500 dark:text-slate-400">
                    Journal Koktek
                  </p>
                  <p className="max-w-[30rem] text-[1.15rem] font-semibold leading-tight text-slate-900 dark:text-white sm:text-[1.35rem] xl:max-w-[34rem] xl:text-[1.55rem]">
                    Le magazine pratique des usages smartphone, mobilité et lifestyle.
                  </p>
                </div>
              </div>

              <nav className="ml-auto hidden items-center gap-1.5 xl:flex">
            {navItems.map((item) => {
              const isActive =
                item.href === '/blog'
                  ? isHome
                  : location.pathname === item.href

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`rounded-full px-4 py-2.5 text-[13px] font-semibold transition ${
                    isActive
                      ? 'bg-slate-950 text-white shadow-[0_18px_35px_-24px_rgba(15,23,42,0.85)] dark:bg-white dark:text-slate-950'
                      : 'text-slate-600 hover:bg-white/82 hover:text-slate-950 hover:shadow-[0_18px_35px_-28px_rgba(15,23,42,0.45)] dark:text-slate-300 dark:hover:bg-slate-900/72 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
              </nav>

              <div className="flex items-center gap-2">
                <Link
                  to="/catalogue"
                  className="hidden items-center gap-1 rounded-full border border-slate-300/80 bg-white/88 px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-[0_18px_35px_-28px_rgba(15,23,42,0.45)] transition hover:-translate-y-0.5 hover:border-slate-950 hover:bg-white xl:inline-flex dark:border-slate-700 dark:bg-slate-900/70 dark:text-white dark:hover:border-slate-400"
                >
                  Boutique
                  <ArrowUpRight className="h-4 w-4" />
                </Link>

                <button
                  type="button"
                  onClick={toggleTheme}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300/80 bg-white/88 text-slate-700 shadow-[0_18px_35px_-28px_rgba(15,23,42,0.45)] transition hover:-translate-y-0.5 hover:border-slate-950 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-slate-400 dark:hover:text-white"
                  aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
                >
                  {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {navItems.map((item) =>
                <Link
                  key={item.href}
                  to={item.href}
                  className={`whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-semibold ${
                    (item.href === '/blog' ? isHome : location.pathname === item.href)
                      ? 'bg-slate-950 text-white shadow-[0_14px_30px_-24px_rgba(15,23,42,0.85)] dark:bg-white dark:text-slate-950'
                      : 'border border-slate-300/70 bg-white/82 text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200'
                  }`}
                >
                  {item.label}
                </Link>,
              )}
              <Link
                to="/catalogue"
                className="whitespace-nowrap rounded-full border border-slate-300/70 bg-white/82 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
              >
                Boutique
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default JournalHeader
