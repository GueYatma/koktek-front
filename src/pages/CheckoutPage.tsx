import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { formatPrice } from '../utils/format'

const CheckoutPage = () => {
  const { items, total } = useCart()

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
          Paiement
        </p>
        <h1 className="text-3xl font-semibold text-gray-900">
          Finaliser la commande
        </h1>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
          <p className="text-sm text-gray-600">
            Votre panier est vide. Ajoutez vos essentiels Koktek pour continuer.
          </p>
          <Link
            to="/catalogue"
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white"
          >
            Retour au catalogue
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.variant.id}
                className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-5"
              >
                <img
                  src={item.product.image_url}
                  alt={item.product.title}
                  className="h-20 w-20 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {item.product.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.variant.option1_value}
                      </p>
                    </div>
                    <span className="font-display text-sm font-bold text-gray-900">
                      {formatPrice(item.variant.price * item.quantity)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Quantité : {item.quantity}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="h-fit rounded-2xl border border-gray-200 bg-gray-50 p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Récapitulatif
            </h2>
            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span>Sous-total</span>
                <span className="font-display font-bold text-gray-900">
                  {formatPrice(total)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Livraison</span>
                <span>Offerte</span>
              </div>
              <div className="flex items-center justify-between font-semibold text-gray-900">
                <span>Total</span>
                <span className="font-display font-bold text-gray-900">
                  {formatPrice(total)}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white"
            >
              Confirmer et payer
            </button>
            <p className="mt-3 text-xs text-gray-500">
              Simulation visuelle uniquement. Paiement sécurisé bientôt disponible.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default CheckoutPage
