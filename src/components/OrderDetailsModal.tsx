import { useEffect, useState } from 'react'
import { X, Package, CreditCard, User, Truck } from 'lucide-react'
import { getOrderFullDetails, type OrderFullDetails } from '../lib/commerceApi'
import { resolveImageUrl } from '../utils/image'
import { formatPrice } from '../utils/format'

type OrderDetailsModalProps = {
  isOpen: boolean
  orderId: string | null
  onClose: () => void
}

const OrderDetailsModal = ({
  isOpen,
  orderId,
  onClose,
}: OrderDetailsModalProps) => {
  const [order, setOrder] = useState<OrderFullDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !orderId) {
      setOrder(null)
      setError(null)
      return
    }

    let isActive = true
    const loadItems = async () => {
      setLoading(true)
      setError(null)
      try {
        const details = await getOrderFullDetails(orderId)
        if (isActive) setOrder(details)
      } catch (err) {
        console.error('Failed to load order:', err)
        if (isActive) setError('Impossible de charger les détails de la commande')
      } finally {
        if (isActive) setLoading(false)
      }
    }
    void loadItems()

    return () => {
      isActive = false
    }
  }, [isOpen, orderId])

  if (!isOpen) return null

  const customer = typeof order?.customer_id === 'object' ? order.customer_id : null
  const delivery = order?.order_delivery
  const items = order?.order_items ?? []

  const isCash = order?.payment_status === 'pending_cash' || order?.payment_reference === 'cash'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm sm:p-6" onClick={onClose}>
      <div 
        className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-[#f4f5f7] p-6 shadow-xl border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-6 top-6 rounded-full p-2 text-gray-500 hover:bg-gray-200 transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
            Dossier Commande
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-gray-900">
            {order?.order_number ?? orderId}
          </h2>
        </div>

        {loading ? (
          <p className="text-gray-500">Chargement des données...</p>
        ) : error ? (
          <p className="text-rose-500">{error}</p>
        ) : !order ? (
          <p className="text-gray-500">Aucune commande trouvée.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Client */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-indigo-500" />
                <h3 className="font-semibold text-gray-900">Client</h3>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <p><span className="text-gray-400">Nom:</span> {customer?.name || customer?.first_name || delivery?.recipient_name || 'Non renseigné'}</p>
                <p><span className="text-gray-400">Email:</span> {customer?.email || delivery?.email || 'Non renseigné'}</p>
                <p><span className="text-gray-400">Téléphone:</span> {customer?.phone || delivery?.phone || 'Non renseigné'}</p>
              </div>
            </section>

            {/* Paiement */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-indigo-500" />
                <h3 className="font-semibold text-gray-900">Paiement</h3>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <p><span className="text-gray-400">Méthode:</span> <span className="font-medium">{isCash ? '💵 Espèces' : '💳 Carte (Stripe)'}</span></p>
                <div className="pt-2 border-t border-gray-100 mt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sous-total</span>
                    <span>{formatPrice(order.subtotal ?? 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Frais de port</span>
                    <span>{formatPrice(order.shipping_price ?? 0)}</span>
                  </div>
                  <div className="flex justify-between mt-2 pt-2 border-t border-gray-100 font-semibold text-gray-900">
                    <span>Total payé</span>
                    <span className="text-base">{formatPrice(order.total_price ?? order.total ?? order.subtotal ?? 0)}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Livraison */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-semibold text-gray-900">Livraison</h3>
                </div>
                {delivery?.status && (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 uppercase">
                    {delivery.status.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
              {delivery ? (
                <div className="text-sm text-gray-700 leading-relaxed">
                  <p>{delivery.address_line1}</p>
                  {delivery.address_line2 && <p>{delivery.address_line2}</p>}
                  <p>{delivery.postal_code} {delivery.city}</p>
                  <p>{delivery.country}</p>
                  {delivery.tracking_number && (
                    <p className="mt-3 pt-3 border-t border-gray-100">
                      <span className="text-gray-400">N° Suivi : </span>
                      <span className="font-medium font-mono text-gray-900">{delivery.tracking_number}</span>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Aucune information de livraison.</p>
              )}
            </section>

            {/* Produits */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-indigo-500" />
                <h3 className="font-semibold text-gray-900">Produits</h3>
              </div>
              <div className="space-y-3">
                {items.length > 0 ? items.map((item) => {
                  const product = typeof item.product_id === 'object' ? item.product_id as Record<string, any> : null
                  const variant = typeof item.variant_id === 'object' ? item.variant_id as Record<string, any> : null
                  const title = product?.title || `Produit #${item.product_id}`
                  const image = resolveImageUrl(product?.image_url as string | undefined)
                  
                  return (
                    <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="w-12 h-12 rounded-lg bg-white border border-gray-200 overflow-hidden shrink-0">
                         <img src={image} alt={title as string} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{title as string}</p>
                        {variant && (
                          <p className="text-xs text-gray-500">
                            {variant.sku || variant.option1_value}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{formatPrice(item.unit_price ?? 0)}</p>
                        <p className="text-xs text-gray-500">Qté: {item.quantity}</p>
                      </div>
                    </div>
                  )
                }) : (
                  <p className="text-sm text-gray-500">Aucun produit dans cette commande.</p>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrderDetailsModal
