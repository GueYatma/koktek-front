import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import { useCart } from '../context/CartContext'
import CartDrawer from './CartDrawer'

const Layout = () => {
  const { itemCount } = useCart()
  const [isCartOpen, setIsCartOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white text-black">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            to="/"
            className="text-lg font-semibold tracking-[0.3em] text-gray-900"
          >
            KOKTEK
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-gray-500 md:flex">
            {[
              { to: '/', label: 'Accueil', end: true },
              { to: '/catalogue', label: 'Catalogue' },
              { to: '/checkout', label: 'Panier' },
            ].map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `transition ${
                    isActive ? 'text-gray-900' : 'hover:text-gray-900'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="relative inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-900 hover:text-gray-900"
          >
            <ShoppingBag className="h-4 w-4" />
            Panier
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-semibold text-white">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="mt-20 border-t border-gray-200 bg-gray-100">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
              KOKTEK
            </p>
            <p className="mt-3 text-sm text-gray-600">
              Des accessoires premium pour protéger votre iPhone avec style et
              précision.
            </p>
          </div>
          <div className="text-sm text-gray-600">
            <p className="font-semibold text-gray-900">Boutique</p>
            <div className="mt-3 flex flex-col gap-2">
              <Link to="/catalogue" className="hover:text-gray-900">
                Catalogue
              </Link>
              <Link to="/checkout" className="hover:text-gray-900">
                Votre panier
              </Link>
              <Link to="/" className="hover:text-gray-900">
                Nouveautés
              </Link>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            <p className="font-semibold text-gray-900">Assistance</p>
            <div className="mt-3 flex flex-col gap-2">
              <span>Livraison 48h</span>
              <span>Retours sous 30 jours</span>
              <span>Support premium</span>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 py-6 text-center text-xs text-gray-500">
          © 2026 KOKTEK. Tous droits réservés.
        </div>
      </footer>

      <CartDrawer open={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  )
}

export default Layout
