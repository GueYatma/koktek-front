import { NavLink, Outlet } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'

const AdminLayout = () => {
  const baseLinkClass =
    'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition'
  const activeClass = 'bg-gray-900 text-white shadow-[0_8px_24px_-12px_rgba(0,0,0,0.4)]'
  const idleClass = 'text-gray-700 hover:bg-gray-100'

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-gray-900 flex flex-col">
      <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <a href="https://koktek.com" className="flex items-center gap-2">
            <span className="text-xl font-black tracking-widest text-gray-900">KOKTEK</span>
          </a>
          <span className="hidden sm:inline-block rounded bg-gray-100 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Back-Office
          </span>
        </div>
        <a 
          href="https://koktek.com" 
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          <span className="hidden sm:inline">Aller vers la boutique koktek.com</span>
          <span className="sm:hidden">Boutique</span>
          <ExternalLink className="h-4 w-4" />
        </a>
      </header>
      <div className="flex flex-1">
        <aside className="hidden w-64 flex-col border-r border-gray-200 bg-white px-5 py-6 lg:flex">
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

        <main className="flex-1 px-4 py-6 sm:px-8 lg:px-12">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
