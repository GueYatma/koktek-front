import { NavLink, Outlet } from 'react-router-dom'

const AdminLayout = () => {
  const baseLinkClass =
    'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition'
  const activeClass = 'bg-gray-900 text-white shadow-[0_8px_24px_-12px_rgba(0,0,0,0.4)]'
  const idleClass = 'text-gray-700 hover:bg-gray-100'

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-gray-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 flex-col border-r border-gray-200 bg-white px-5 py-6 lg:flex">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-gray-400">
              Back-Office
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-[0.2em] text-gray-900">
              KOKTEK
            </h1>
          </div>

          <nav className="mt-10 space-y-3">
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
