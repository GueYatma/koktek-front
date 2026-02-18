import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Menu, Search, ShoppingBag, User, X } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useUI } from '../context/UIContext'
import { useAuth } from '../context/AuthContext'
import CartDrawer from './CartDrawer'
import ContactDrawer from './ContactDrawer'
import AuthModal from './AuthModal'
import ProfileDrawer from './ProfileDrawer'

const Layout = () => {
  const buildId = import.meta.env.VITE_BUILD_ID as string | undefined
  const buildDate = import.meta.env.VITE_BUILD_DATE as string | undefined
  const buildLabel = buildId ? buildId.slice(0, 7) : ''
  const buildDateLabel = buildDate
    ? new Date(buildDate).toLocaleString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      })
    : ''

  const { itemCount } = useCart()
  const { isContactOpen, openContact, closeContact } = useUI()
  const { user } = useAuth()
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white text-black">
      <header className="sticky top-0 z-40 bg-white shadow-[0_4px_20px_-5px_rgba(0,0,0,0.1)]">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-5 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="logo-koktek text-3xl font-black uppercase text-gray-900 sm:text-4xl"
          >
            KOKTEK
          </Link>
          <div className="flex flex-1 items-center justify-center">
            <nav className="hidden items-center gap-8 text-lg font-bold text-gray-800 md:flex">
              {[
                { to: '/', label: 'Accueil', end: true },
                { to: '/catalogue', label: 'Catalogue' },
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
              <button
                type="button"
                onClick={openContact}
                className="whitespace-nowrap transition hover:text-gray-900"
              >
                Contact
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-full border-2 border-gray-200 px-3 py-2 text-sm font-bold text-gray-800 transition hover:border-gray-900 hover:text-gray-900 md:hidden"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              {isMobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
              <span>Menu</span>
            </button>
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative inline-flex items-center gap-2 rounded-full border-2 border-gray-200 px-3 py-2 text-sm font-bold text-gray-800 transition hover:border-gray-900 hover:text-gray-900 sm:px-4"
              aria-label="Ouvrir le panier"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Panier</span>
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-semibold text-white">
                  {itemCount}
                </span>
              )}
            </button>
            <div className="hidden md:block">
              <div className="relative w-56">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  placeholder="Rechercher..."
                  className="w-full rounded-full border-2 border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-gray-700 placeholder:text-gray-400 transition focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                  aria-label="Rechercher"
                />
              </div>
            </div>
            {user ? (
              <button
                type="button"
                onClick={() => setIsProfileOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border-2 border-gray-900 bg-gray-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-black"
              >
                <User className="h-4 w-4" />
                <span>Mon Profil</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border-2 border-gray-900 bg-gray-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-black"
              >
                <User className="h-4 w-4" />
                <span>Se connecter</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <div
        id="mobile-menu"
        className={`border-b border-gray-200 bg-white shadow-sm md:hidden ${
          isMobileMenuOpen ? 'block' : 'hidden'
        }`}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4">
          <nav className="flex flex-col gap-3 text-base font-semibold text-gray-800">
            {[
              { to: '/', label: 'Accueil', end: true },
              { to: '/catalogue', label: 'Catalogue' },
            ].map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setIsMobileMenuOpen(false)}
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
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Rechercher..."
              className="w-full rounded-full border-2 border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-gray-700 placeholder:text-gray-400 transition focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              aria-label="Rechercher"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              openContact()
              setIsMobileMenuOpen(false)
            }}
            className="inline-flex w-full items-center justify-center rounded-full border-2 border-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:border-gray-900 hover:text-gray-900"
          >
            Contact
          </button>
        </div>
      </div>

      <main>
        <Outlet />
      </main>

      <footer className="mt-20 border-t border-gray-200 bg-gray-100">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
          <div>
            <p className="font-display text-xs uppercase tracking-[0.35em] text-gray-500">
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
          {buildLabel && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
              Build {buildLabel}
              {buildDateLabel ? ` · ${buildDateLabel}` : ''}
            </span>
          )}
        </div>
      </footer>

      <CartDrawer open={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <ContactDrawer open={isContactOpen} onClose={closeContact} />
      <AuthModal open={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <ProfileDrawer
        open={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  )
}

export default Layout
