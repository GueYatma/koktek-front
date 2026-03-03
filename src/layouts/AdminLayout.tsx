import { NavLink, Outlet } from 'react-router-dom'
import { ExternalLink, Sun, Moon } from 'lucide-react'
import BackButton from '../components/BackButton'
import { useTheme } from '../context/ThemeContext'

const AdminLayout = () => {
  const { theme, toggleTheme } = useTheme()
  const baseLinkClass =
    'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition'
  const activeClass = 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.4)]'
  const idleClass = 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'

  return (
    <div className="min-h-screen bg-[#f4f5f7] dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <BackButton fallback="/" className="min-h-[36px] px-2 py-1.5 border-none shadow-none bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 hidden sm:flex" />
          <a href="https://koktek.com" className="flex items-center gap-2">
            <span className="text-xl font-black tracking-widest text-gray-900 dark:text-white">KOKTEK</span>
          </a>
          <span className="hidden sm:inline-block rounded bg-gray-100 dark:bg-gray-800 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            Back-Office
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 transition hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <a 
            href="https://koktek.com" 
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full bg-gray-900 dark:bg-gray-100 px-4 py-2 text-sm font-semibold text-white dark:text-gray-900 transition hover:bg-gray-800 dark:hover:bg-gray-200"
          >
            <span className="hidden sm:inline">Aller vers la boutique koktek.com</span>
            <span className="sm:hidden">Boutique</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="hidden w-64 flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-6 lg:flex">
          <nav className="space-y-3">
            <NavLink
              to="/admin/historique"
              className={({ isActive }) =>
                `${baseLinkClass} ${isActive ? activeClass : idleClass}`
              }
            >
              Historique des Ventes
            </NavLink>
            <NavLink
              to="/admin/comptabilite"
              className={({ isActive }) =>
                `${baseLinkClass} ${isActive ? activeClass : idleClass}`
              }
            >
              Comptabilité & Marges
            </NavLink>
          </nav>
        </aside>

        <main className="flex-1 px-4 py-6 sm:px-8 lg:px-12 bg-[#f4f5f7] dark:bg-gray-950">
          <div className="mx-auto w-full max-w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
