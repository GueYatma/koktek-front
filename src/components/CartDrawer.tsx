import { Link } from 'react-router-dom'
import { Minus, Plus, X } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { formatPrice } from '../utils/format'
import { resolveImageUrl } from '../utils/image'
import { resolveVariantValue } from '../utils/variant'

type CartDrawerProps = {
  open: boolean
  onClose: () => void
}

const CartDrawer = ({ open, onClose }: CartDrawerProps) => {
  const { items, subtotal, total, shippingTotal, updateQuantity, removeItem, clearCart } = useCart()
  const isCheckoutDisabled = items.length === 0

  return (
    <div
      className={`fixed inset-0 z-50 ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        className={`fixed top-[10%] bottom-[10%] left-4 right-4 flex h-auto max-h-[80vh] w-auto flex-col overflow-hidden rounded-3xl bg-white shadow-2xl transition-all duration-300 md:bottom-auto md:left-auto md:right-0 md:top-0 md:h-full md:max-h-none md:max-w-md md:rounded-none ${
          open ? 'translate-y-0 opacity-100 md:translate-x-0 md:translate-y-0' : 'translate-y-8 opacity-0 md:translate-x-full md:translate-y-0 md:opacity-100'
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
              Votre panier
            </p>
            <h2 className="text-xl font-semibold text-gray-900">Sélection</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
              <p className="text-sm text-gray-500">
                Votre panier est vide pour le moment.
              </p>
              <Link
                to="/catalogue"
                onClick={onClose}
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white"
              >
                Découvrir le catalogue
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {items.map((item) => {
                const variantValue = resolveVariantValue(item.variant)
                const unitPrice = item.product.prix_calcule ?? item.product.retail_price
                const lineTotal = unitPrice * item.quantity
                const shippingPrice = item.shippingOption?.price
                const shippingName = item.shippingOption?.name
                const shippingDays = item.shippingOption?.days
                const weightGrams = item.variant.weight_grams

                return (
                  <div
                    key={item.variant.id}
                    className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-4"
                  >
                    <img
                      src={resolveImageUrl(item.product.image_url)}
                      alt={item.product.title}
                      className="h-20 w-20 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      {/* Title row */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-0.5">
                          <p className="text-sm font-semibold text-gray-900">
                            {item.product.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.variant.option1_name} : {variantValue || '—'}
                          </p>
                          {/* Weight */}
                          {weightGrams != null && weightGrams > 0 && (
                            <p className="text-xs text-gray-400">
                              Poids : {weightGrams}g
                            </p>
                          )}
                          {/* Per-item shipping detail */}
                          {shippingName && (
                            <p className="text-[10px] text-indigo-600 uppercase tracking-wider font-semibold">
                              {shippingName}
                              {shippingDays != null && String(shippingDays).trim().length > 0
                                ? ` — ${shippingDays}`
                                : ''}
                              {shippingPrice != null
                                ? ` · ${shippingPrice > 0 ? formatPrice(shippingPrice) : 'Livraison incluse'}`
                                : ''}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.variant.id)}
                          className="text-xs text-gray-400 transition hover:text-gray-900"
                        >
                          Retirer
                        </button>
                      </div>

                      {/* Qty + price breakdown */}
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.variant.id, item.quantity - 1)
                            }
                            className="rounded-full border border-gray-200 p-1 text-gray-500 transition hover:border-gray-900 hover:text-gray-900"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-6 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.variant.id, item.quantity + 1)
                            }
                            className="rounded-full border border-gray-200 p-1 text-gray-500 transition hover:border-gray-900 hover:text-gray-900"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        {/* Prix unitaire × quantité = total ligne */}
                        <div className="text-right">
                          {item.quantity > 1 && (
                            <p className="text-[10px] text-gray-400">
                              {formatPrice(unitPrice)} × {item.quantity}
                            </p>
                          )}
                          <span className="text-sm font-bold text-gray-900">
                            {formatPrice(lineTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="border-t border-gray-200 px-5 pt-4 pb-4">
          {/* Sous-total articles */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Sous-total articles</span>
            <span className="font-semibold text-gray-900">
              {formatPrice(subtotal)}
            </span>
          </div>

          {/* Frais de livraison */}
          <div className="flex items-center justify-between text-sm text-gray-500 mt-2">
            <span>Frais de livraison</span>
            <span className="font-semibold text-gray-900">
              {shippingTotal > 0 ? formatPrice(shippingTotal) : items.length === 0 ? '—' : 'Inclus'}
            </span>
          </div>

          {/* TVA */}
          <div className="flex items-center justify-between text-sm text-gray-500 mt-2">
            <span>TVA</span>
            <span className="font-semibold text-gray-900">0 %</span>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between text-base font-bold text-gray-900 mt-4 border-t border-gray-100 pt-3">
            <span>Total estimé</span>
            <span className="text-lg">
              {formatPrice(total)}
            </span>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={clearCart}
              disabled={items.length === 0}
              className={`text-xs underline underline-offset-4 transition ${
                items.length === 0
                  ? 'cursor-not-allowed text-gray-300'
                  : 'text-gray-400 hover:text-red-500'
              }`}
            >
              Vider mon panier
            </button>
          </div>
          <Link
            to="/checkout"
            onClick={(event) => {
              if (isCheckoutDisabled) {
                event.preventDefault()
                return
              }
              onClose()
            }}
            className={`mt-3 flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition ${
              isCheckoutDisabled
                ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
            aria-disabled={isCheckoutDisabled}
          >
            Passer à la caisse
          </Link>
          <Link
            to="/catalogue"
            onClick={onClose}
            className="group mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200/80 bg-gray-50/60 px-4 py-3.5 text-sm font-semibold text-gray-600 shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-amber-200 hover:bg-amber-50/80 hover:text-amber-900 hover:shadow-[0_8px_16px_-6px_rgba(245,158,11,0.15)]"
          >
            <span className="transition-transform duration-300 ease-out group-hover:-translate-x-1">←</span>
            <span>Retour au catalogue</span>
          </Link>
        </div>
      </aside>
    </div>
  )
}

export default CartDrawer
