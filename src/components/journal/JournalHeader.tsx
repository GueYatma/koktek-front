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
    <header className="fixed inset-x-0 top-0 z-40 px-4 pt-4 sm:px-6">
      <div className="mx-auto max-w-7xl rounded-[24px] border border-slate-200/80 bg-[#f7f1e7]/88 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-[#0b1320]/88">
        <div className="flex items-center gap-4 px-4 py-4 sm:px-6 sm:py-5">
          <Link to="/" className="shrink-0">
            <span className="logo-koktek text-[2rem] font-black uppercase text-slate-950 dark:text-white sm:text-[2.15rem]">
              KOKTEK
            </span>
          </Link>

          <div className="hidden min-w-0 border-l border-slate-300/70 pl-5 lg:block dark:border-slate-700/70">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-slate-500 dark:text-slate-400">
              Journal KOKTEK
            </p>
            <p className="max-w-[27rem] text-[15px] font-semibold leading-[1.45rem] text-slate-800 dark:text-slate-100 xl:text-[16px] xl:leading-[1.55rem]">
              Le magazine pratique des usages smartphone, mobilité et lifestyle.
            </p>
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
                  className={`rounded-full px-3.5 py-2.5 text-[13px] font-semibold transition ${
                    isActive
                      ? 'bg-slate-950 text-white shadow-[0_10px_24px_-18px_rgba(15,23,42,0.75)] dark:bg-white dark:text-slate-950'
                      : 'text-slate-600 hover:bg-white/80 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900/70 dark:hover:text-white'
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
              className="hidden items-center gap-1 rounded-full border border-slate-300/80 bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:border-slate-950 hover:bg-white xl:inline-flex dark:border-slate-700 dark:bg-slate-900/70 dark:text-white dark:hover:border-slate-400"
            >
              Boutique
              <ArrowUpRight className="h-4 w-4" />
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300/80 bg-white/90 text-slate-700 transition hover:border-slate-950 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-slate-400 dark:hover:text-white"
              aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto px-4 pb-4 sm:px-6 lg:hidden">
          {navItems.map((item) =>
            <Link
              key={item.href}
              to={item.href}
              className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold ${
                (item.href === '/blog' ? isHome : location.pathname === item.href)
                  ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                  : 'border border-slate-300/70 bg-white/80 text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200'
              }`}
            >
              {item.label}
            </Link>,
          )}
          <Link
            to="/catalogue"
            className="whitespace-nowrap rounded-full border border-slate-300/70 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
          >
            Boutique
          </Link>
        </div>
      </div>
    </header>
  )
}

export default JournalHeader
