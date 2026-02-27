import { BrowserRouter, Route, Routes, Navigate, useLocation } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import Layout from './components/Layout'
import AdminLayout from './layouts/AdminLayout'
import HomePage from './pages/HomePage'
import CatalogPage from './pages/CatalogPage'
import ProductPage from './pages/ProductPage'
import CheckoutPage from './pages/CheckoutPage'
import AboutPage from './pages/AboutPage'
import LegalNoticePage from './pages/LegalNoticePage'
import ShippingPage from './pages/ShippingPage'
import TermsPage from './pages/TermsPage'
import SalesHistoryPage from './pages/SalesHistoryPage'
import AccountingPage from './pages/AccountingPage'

const AdminRedirect = () => {
  const location = useLocation()
  return <Navigate to={`/admin/comptabilite${location.search}`} replace />
}

const App = () => {
  return (
    <CartProvider>
      <BrowserRouter>
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
    </BrowserRouter>
  </CartProvider>
  )
}

export default App
