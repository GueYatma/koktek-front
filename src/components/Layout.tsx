import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Home, LayoutGrid, MessageCircle, Search, ShoppingBag, User } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useUI } from '../context/UIContext'
import { useAuth } from '../context/AuthContext'
import { useProducts } from '../hooks/useProducts'
import CartDrawer from './CartDrawer'
import ContactDrawer from './ContactDrawer'
import AuthModal from './AuthModal'
import ProfileDrawer from './ProfileDrawer'
import Footer from './Footer'

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
  const [isScrolling, setIsScrolling] = useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  const mobileSearchInputRef = useRef<HTMLInputElement | null>(null)
  const isAnyModalOpen = isCartOpen || isContactOpen || isAuthOpen || isProfileOpen

  const handleAccountClick = () => {
    if (hasUser) {
      openProfile()
    } else {
      setIsAuthOpen(true)
    }
  }

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentSearch = searchParams.get('search') || '';
  const [searchQuery, setSearchQuery] = useState(currentSearch);
  const searchTimerRef = useRef<number | null>(null);

  const { products } = useProducts();

  const normalizeKey = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const hasVariantMatchOnly = useMemo(() => {
    if (!searchQuery.trim() || products.length === 0) return false;
    const normalizedQuery = normalizeKey(searchQuery);
    const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
    
    return products.some((product) => {
      const titleStr = normalizeKey(product.title || "");
      const titleMatches = tokens.every((t) => titleStr.includes(t));
      if (titleMatches) return false; // Match is in the title, not JUST variants
      
      const variantTexts = (product.product_variants ?? [])
        .map((v) => [v.option1_name, v.option1_value, v.sku].join(" "))
        .join(" ");
      const corpus = normalizeKey(product.title + " " + variantTexts);
      return tokens.every((t) => corpus.includes(t));
    });
  }, [searchQuery, products]);

  // Sync searchQuery when URL changes externally (e.g. back button)
  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  // Open cart drawer via URL parameter (used by Checkout page back button)
  useEffect(() => {
    if (searchParams.get('cart') === 'open') {
      setIsCartOpen(true);
      setSearchParams((prev) => {
        prev.delete('cart');
        return prev;
      }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Debounced live search: navigate 300ms after the user stops typing
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (searchTimerRef.current) {
      window.clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = window.setTimeout(() => {
      const trimmed = value.trim();
      if (trimmed) {
        navigate(`/catalogue?search=${encodeURIComponent(trimmed)}`, { replace: true });
      } else {
        if (location.pathname === '/catalogue') {
          navigate('/catalogue', { replace: true });
        }
      }
    }, 300);
  }, [navigate, location.pathname]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);
    };
  }, []);

  const handleMobileSearchClick = () => {
    setIsMobileSearchOpen(true)
  }

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
    // Disable native scroll restoration to ensure our custom scroll fires correctly
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
    // Immediate scroll
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    // Delayed scroll to catch post-render layout shifts
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }, 50)
    
    setIsMobileSearchOpen(false)
    return () => clearTimeout(timer)
  }, [location.pathname])

  useEffect(() => {
    if (!isMobileSearchOpen) return
    const timer = window.setTimeout(() => {
      mobileSearchInputRef.current?.focus()
    }, 60)
    return () => window.clearTimeout(timer)
  }, [isMobileSearchOpen])

  useEffect(() => {
    if (typeof window === 'undefined') return
    let scrollStopTimer: number | null = null

    const onScroll = () => {
      setIsScrolling(true)
      if (scrollStopTimer) {
        window.clearTimeout(scrollStopTimer)
      }
      scrollStopTimer = window.setTimeout(() => {
        setIsScrolling(false)
      }, 140)
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
        className={`fixed top-0 left-0 right-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur transition-opacity duration-200 will-change-opacity ${
          isScrolling ? 'opacity-80' : 'opacity-100'
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

          <div className="ml-auto flex flex-1 items-center gap-2 md:hidden">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="mobile-search-input"
                name="search"
                type="search"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Rechercher..."
                className="w-full rounded-full border border-gray-200 bg-white py-2 pl-9 pr-3 text-xs font-medium text-gray-700 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
                aria-label="Rechercher"
              />
            </div>
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
              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  name="search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-full rounded-full border-2 border-gray-200 bg-white py-2 pl-10 pr-4 text-sm font-medium text-gray-700 placeholder:text-gray-400 transition focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                  aria-label="Rechercher"
                />
              </div>
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

      {isMobileSearchOpen ? (
        <div className="fixed left-6 right-6 z-50 md:hidden bottom-[calc(88px+env(safe-area-inset-bottom))]">
          <div
            className="relative flex items-center rounded-2xl border border-gray-200 bg-white/95 px-3 py-2.5 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.65)] backdrop-blur"
          >
            <Search className="h-4 w-4 text-gray-400" />
            <input
              ref={mobileSearchInputRef}
              name="search"
              type="search"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Rechercher..."
              className="ml-2 flex-1 bg-transparent text-sm font-medium text-gray-700 placeholder:text-gray-400 focus:outline-none"
              aria-label="Rechercher"
            />
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen(false)}
              className="ml-2 rounded-full border border-gray-200 px-3 py-1 text-[11px] font-semibold text-gray-600 shadow-sm transition hover:bg-gray-100 hover:text-gray-900 active:scale-95"
            >
              Fermer
            </button>
          </div>
          {hasVariantMatchOnly && (
            <div className="mt-3 animate-in fade-in slide-in-from-bottom-2 duration-300 rounded-xl bg-blue-50/95 p-3.5 text-xs text-blue-900 shadow-xl backdrop-blur-md border border-blue-200/50">
              <span className="font-bold mb-1 flex items-center gap-1.5"><Search className="h-3 w-3" /> Info recherche</span>
              <p className="opacity-90">
                Votre recherche correspond à des variantes de ces produits. Ouvrez un produit pour voir les modèles compatibles.
              </p>
            </div>
          )}
        </div>
      ) : null}

      <nav
        className={`koktek-bottom-nav fixed left-0 right-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 transition-opacity duration-200 will-change-opacity md:hidden ${
          isAnyModalOpen
            ? 'hidden'
            : isScrolling
              ? 'opacity-70'
              : 'opacity-100'
        }`}
      >
        <div className="mx-auto grid max-w-6xl grid-cols-5 px-2 pb-[calc(22px+env(safe-area-inset-bottom))] pt-3">
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
            onClick={handleMobileSearchClick}
            className="flex flex-col items-center gap-1 text-[11px] font-semibold text-gray-500 transition hover:text-gray-900"
            aria-label="Rechercher"
          >
            <Search className="h-5 w-5" />
            Recherche
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
        </div>
      </nav>

      <main className="min-h-screen pt-14 pb-[calc(86px+env(safe-area-inset-bottom))] md:pb-0">
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

      <Footer buildLabel={buildLabel} buildDateLabel={buildDateLabel} />

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
