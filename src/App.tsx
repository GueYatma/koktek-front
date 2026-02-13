import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import CatalogPage from './pages/CatalogPage'
import ProductPage from './pages/ProductPage'
import CheckoutPage from './pages/CheckoutPage'

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
        </Routes>
      </BrowserRouter>
    </CartProvider>
  )
}

export default App
