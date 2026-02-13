import { Link } from 'react-router-dom'
import { Minus, Plus, X } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { formatPrice } from '../utils/format'

type CartDrawerProps = {
  open: boolean
  onClose: () => void
}

const CartDrawer = ({ open, onClose }: CartDrawerProps) => {
  const { items, total, updateQuantity, removeItem } = useCart()
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
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        onClick={(event) => event.stopPropagation()}
      >
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
              {items.map((item) => (
                <div
                  key={item.variant.id}
                  className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-4"
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
                          {item.variant.option1_name} : {item.variant.option1_value}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.variant.id)}
                        className="text-xs text-gray-400 transition hover:text-gray-900"
                      >
                        Retirer
                      </button>
                    </div>
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
                      <span className="text-sm font-semibold text-gray-900">
                        {formatPrice(item.variant.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-6 py-5">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Total estimé</span>
            <span className="text-lg font-semibold text-gray-900">
              {formatPrice(total)}
            </span>
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
            className={`mt-4 flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition ${
              isCheckoutDisabled
                ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
            aria-disabled={isCheckoutDisabled}
          >
            Passer à la caisse
          </Link>
        </div>
      </aside>
    </div>
  )
}

export default CartDrawer
