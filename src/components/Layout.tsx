import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate, useSearchParams } from 'react-router-dom'
import { Home, LayoutGrid, MessageCircle, Search, ShoppingBag, User } from 'lucide-react'
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
  const buildMessage = import.meta.env.VITE_BUILD_MESSAGE as string | undefined
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
  const buildMessageLabel = buildMessage
    ? buildMessage.length > 70
      ? `${buildMessage.slice(0, 67)}…`
      : buildMessage
    : 'Nouveau build déployé'
  const shouldShowBuildToast = Boolean(buildLabel)
  const [isBuildToastVisible, setIsBuildToastVisible] = useState(() => {
    if (!shouldShowBuildToast) return false
    if (typeof window === 'undefined') return false
    const storageKey = 'koktek:last_build_seen'
    const lastSeen = window.localStorage.getItem(storageKey)
    return lastSeen !== buildLabel
  })

  useEffect(() => {
    if (!shouldShowBuildToast || !isBuildToastVisible) return
    if (typeof window === 'undefined') return
    const storageKey = 'koktek:last_build_seen'
    window.localStorage.setItem(storageKey, buildLabel)
  }, [shouldShowBuildToast, isBuildToastVisible, buildLabel])

  const { itemCount } = useCart()
  const { isContactOpen, openContact, closeContact, isProfileOpen, openProfile, closeProfile } = useUI()
  const { user } = useAuth()
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const hasUser = Boolean(user)
  const [isChromeVisible, setIsChromeVisible] = useState(true)
  const [isScrolling, setIsScrolling] = useState(false)

  const handleAccountClick = () => {
    if (hasUser) {
      openProfile()
    } else {
      setIsAuthOpen(true)
    }
  }

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentSearch = searchParams.get('search') || '';

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = formData.get('search');
    if (q && q.toString().trim() !== '') {
      navigate(`/catalogue?search=${encodeURIComponent(q.toString().trim())}`);
    } else {
      navigate(`/catalogue`);
    }
  };

  useEffect(() => {
    if (typeof document === 'undefined') return
    const shouldLock =
      isCartOpen || isContactOpen || isAuthOpen || isProfileOpen
    const html = document.documentElement
    const body = document.body

    if (shouldLock) {
      html.style.overflow = 'hidden'
      body.style.overflow = 'hidden'
      body.style.touchAction = 'none'
    } else {
      html.style.overflow = ''
      body.style.overflow = ''
      body.style.touchAction = ''
    }

    return () => {
      html.style.overflow = ''
      body.style.overflow = ''
      body.style.touchAction = ''
    }
  }, [isCartOpen, isContactOpen, isAuthOpen, isProfileOpen])

  useEffect(() => {
    if (typeof window === 'undefined') return
    let lastScrollY = window.scrollY
    let ticking = false
    const threshold = 8
    let scrollStopTimer: number | null = null

    const onScroll = () => {
      const currentY = window.scrollY
      setIsScrolling(true)
      if (scrollStopTimer) {
        window.clearTimeout(scrollStopTimer)
      }
      scrollStopTimer = window.setTimeout(() => {
        setIsScrolling(false)
        setIsChromeVisible(true)
      }, 140)
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const delta = currentY - lastScrollY

          if (currentY <= 16) {
            setIsChromeVisible(true)
          } else if (delta > threshold) {
            setIsChromeVisible(false)
          } else if (delta < -threshold) {
            setIsChromeVisible(true)
          }

          lastScrollY = currentY
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (scrollStopTimer) {
        window.clearTimeout(scrollStopTimer)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-white text-black">
      <header
        className={`sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur transition-transform duration-300 will-change-transform md:translate-y-0 ${
          isChromeVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="logo-koktek text-2xl font-black uppercase text-gray-900 sm:text-3xl"
          >
            KOKTEK
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-gray-700 md:flex">
            {[
              { to: '/', label: 'Accueil', end: true },
              { to: '/catalogue', label: 'Catalogue' },
            ].map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `transition ${isActive ? 'text-gray-900' : 'hover:text-gray-900'}`
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

          <div className="ml-auto flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={handleAccountClick}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-900 shadow-sm transition hover:border-gray-900"
              aria-label={hasUser ? 'Mon espace' : 'Connexion'}
            >
              <span className="relative flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white">
                <User className="h-3.5 w-3.5" />
                {hasUser ? (
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                ) : null}
              </span>
              <span>{hasUser ? 'Mon Espace' : 'Connexion'}</span>
            </button>
          </div>

          <div className="ml-auto hidden items-center gap-3 md:flex">
            <div className="relative w-52">
              <form onSubmit={handleSearch} className="relative w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  name="search"
                  type="search"
                  defaultValue={currentSearch}
                  placeholder="Rechercher..."
                  className="w-full rounded-full border-2 border-gray-200 bg-white py-2 pl-10 pr-4 text-sm font-medium text-gray-700 placeholder:text-gray-400 transition focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                  aria-label="Rechercher"
                />
              </form>
            </div>
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative inline-flex items-center gap-2 rounded-full border-2 border-gray-200 px-3 py-2 text-sm font-semibold text-gray-800 transition hover:border-gray-900 hover:text-gray-900"
              aria-label="Ouvrir le panier"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Panier</span>
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-semibold text-white">
                  {itemCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={handleAccountClick}
              className={`inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-semibold transition ${
                hasUser
                  ? 'border-gray-900 bg-gray-900 text-white hover:bg-black'
                  : 'border-gray-200 bg-white text-gray-800 hover:border-gray-900 hover:text-gray-900'
              }`}
            >
              <div className="relative">
                <User className="h-4 w-4" />
                {hasUser ? (
                  <span className="absolute -bottom-0.5 -right-0.5 block h-2 w-2 rounded-full bg-green-500 ring-2 ring-gray-900" />
                ) : null}
              </div>
              <span>{hasUser ? 'Mon Espace' : 'Connexion'}</span>
            </button>
          </div>
        </div>
      </header>

      <nav
        className={`fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 shadow-[0_-10px_30px_-24px_rgba(0,0,0,0.5)] backdrop-blur transition-opacity duration-200 will-change-opacity md:hidden ${
          isScrolling ? 'opacity-70' : 'opacity-100'
        }`}
      >
        <div className="mx-auto grid max-w-6xl grid-cols-5 px-2 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-[11px] font-semibold transition ${
                isActive ? 'text-gray-900' : 'text-gray-500'
              }`
            }
            aria-label="Accueil"
          >
            <Home className="h-5 w-5" />
            Accueil
          </NavLink>
          <NavLink
            to="/catalogue"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-[11px] font-semibold transition ${
                isActive ? 'text-gray-900' : 'text-gray-500'
              }`
            }
            aria-label="Catalogue"
          >
            <LayoutGrid className="h-5 w-5" />
            Catalogue
          </NavLink>
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition ${
              isCartOpen ? 'text-gray-900' : 'text-gray-500'
            }`}
            aria-label="Panier"
          >
            <span className="relative">
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 ? (
                <span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-semibold text-white">
                  {itemCount}
                </span>
              ) : null}
            </span>
            Panier
          </button>
          <button
            type="button"
            onClick={handleAccountClick}
            className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition ${
              isProfileOpen || isAuthOpen ? 'text-gray-900' : 'text-gray-500'
            }`}
            aria-label="Mon compte"
          >
            <User className="h-5 w-5" />
            Compte
          </button>
          <button
            type="button"
            onClick={openContact}
            className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition ${
              isContactOpen ? 'text-gray-900' : 'text-gray-500'
            }`}
            aria-label="Contact"
          >
            <MessageCircle className="h-5 w-5" />
            Contact
          </button>
        </div>
      </nav>

      <main className="pb-24 md:pb-0">
        {isBuildToastVisible && (
          <div className="pointer-events-none fixed bottom-24 right-4 z-50 h-56 w-56 md:bottom-6 md:right-6">
            <div
              className="toast-cube pointer-events-auto relative h-full w-full animate-[toast-cube-in_0.55s_ease-out,toast-cube-out_0.45s_ease-in_11.5s_forwards] rounded-[28px] border border-gray-200 bg-white/95 shadow-[0_22px_50px_-18px_rgba(0,0,0,0.45)] backdrop-blur"
              onAnimationEnd={(event) => {
                if (event.animationName === 'toast-cube-out') {
                  setIsBuildToastVisible(false)
                }
              }}
            >
              <button
                type="button"
                onClick={() => setIsBuildToastVisible(false)}
                className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-xs font-semibold text-gray-600 transition hover:border-gray-900 hover:text-gray-900"
                aria-label="Fermer la notification de mise à jour"
              >
                ×
              </button>
              <div className="flex h-full flex-col justify-between px-4 pb-4 pt-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gray-500">
                    Mise à jour
                  </p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {buildMessageLabel}
                  </p>
                </div>
                <p className="text-[11px] text-gray-500">
                  Build {buildLabel}
                  {buildDateLabel ? ` · ${buildDateLabel}` : ''}
                </p>
              </div>
            </div>
          </div>
        )}
        <Outlet />
      </main>

      <footer className="mt-20 border-t border-gray-200 bg-gray-100 pb-24 md:pb-0">
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
        onClose={closeProfile}
      />
    </div>
  )
}

export default Layout
