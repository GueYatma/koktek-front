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
    <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200/70 bg-[#f6f0e6]/88 backdrop-blur-xl dark:border-slate-800/70 dark:bg-[#0b1320]/88">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Link to="/" className="shrink-0">
            <span className="logo-koktek text-2xl font-black uppercase text-slate-950 dark:text-white">
              KOKTEK
            </span>
          </Link>

          <div className="hidden min-w-0 border-l border-slate-300/70 pl-4 lg:block dark:border-slate-700/70">
            <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">
              Journal KOKTEK
            </p>
            <p className="max-w-[18rem] text-[11px] leading-4 text-slate-600 dark:text-slate-300">
              Le magazine pratique des usages smartphone, mobilité et lifestyle.
            </p>
          </div>

          <nav className="ml-auto hidden items-center gap-1 xl:flex">
            {navItems.map((item) => {
              const isActive =
                item.href === '/blog'
                  ? isHome
                  : location.pathname === item.href

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`rounded-full px-3.5 py-2 text-[13px] font-semibold transition ${
                    isActive
                      ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
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
              className="hidden items-center gap-1 rounded-full border border-slate-300/80 bg-white/85 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-950 hover:bg-white xl:inline-flex dark:border-slate-700 dark:bg-slate-900/70 dark:text-white dark:hover:border-slate-400"
            >
              Boutique
              <ArrowUpRight className="h-4 w-4" />
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300/80 bg-white/85 text-slate-700 transition hover:border-slate-950 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-slate-400 dark:hover:text-white"
              aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
          {navItems.map((item) =>
            <Link
              key={item.href}
              to={item.href}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
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
            className="whitespace-nowrap rounded-full border border-slate-300/70 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
          >
            Boutique
          </Link>
        </div>
      </div>
    </header>
  )
}

export default JournalHeader
