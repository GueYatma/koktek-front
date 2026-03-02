import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes, Navigate, useLocation } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import Layout from './components/Layout'
import ScrollToTop from './components/ScrollToTop'

// Lazy-loaded pages – each gets its own chunk, loaded only on first visit.
// Heavy deps (recharts, jspdf, stripe, dompurify…) stay out of the
// initial bundle.
const HomePage = lazy(() => import('./pages/HomePage'))
const CatalogPage = lazy(() => import('./pages/CatalogPage'))
const ProductPage = lazy(() => import('./pages/ProductPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const LegalNoticePage = lazy(() => import('./pages/LegalNoticePage'))
const ShippingPage = lazy(() => import('./pages/ShippingPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const AdminLayout = lazy(() => import('./layouts/AdminLayout'))
const SalesHistoryPage = lazy(() => import('./pages/SalesHistoryPage'))
const AccountingPage = lazy(() => import('./pages/AccountingPage'))

const AdminRedirect = () => {
  const location = useLocation()
  return <Navigate to={`/admin/comptabilite${location.search}`} replace />
}

const App = () => {
  return (
    <CartProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Suspense>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
            <Route path="/catalogue" element={<CatalogPage />} />
            <Route path="/produit/:slug" element={<ProductPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/a-propos" element={<AboutPage />} />
            <Route path="/mentions-legales" element={<LegalNoticePage />} />
            <Route path="/livraison" element={<ShippingPage />} />
            <Route path="/cgv" element={<TermsPage />} />
            <Route
              path="*"
              element={
                <div className="mx-auto max-w-4xl px-4 py-16 text-center">
                    <p className="text-sm uppercase tracking-[0.3em] text-gray-500">
                      404
                    </p>
                    <h1 className="mt-3 text-3xl font-semibold text-gray-900">
                      Page introuvable
                    </h1>
                  </div>
              }
            />
          </Route>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminRedirect />} />
            <Route
              path="/admin/historique"
              element={<SalesHistoryPage />}
            />
            <Route
              path="/admin/comptabilite"
              element={<AccountingPage />}
            />
          </Route>
        </Routes>
        </Suspense>
      </BrowserRouter>
    </CartProvider>
  )
}

export default App
