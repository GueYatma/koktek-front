import { useEffect, useMemo, useState } from 'react'
import { formatPrice } from '../utils/format'
import {
  getAdminOrdersDashboard,
  type AdminOrderDashboardRecord,
} from '../lib/commerceApi'
import { useSearchParams } from 'react-router-dom'
import ValidationModal from '../components/ValidationModal'
import OrderDetailsModal from '../components/OrderDetailsModal'

const formatDateTime = (value?: string) => {
  if (!value) return '—'
  // Si la chaîne Directus n'a pas de 'Z', on force l'interprétation UTC
  const normalized = value.endsWith('Z') || value.includes('+') ? value : value + 'Z'
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Paris',
  }).format(date)
}

const DELIVERY_STATUS_FR: Record<string, string> = {
  pending: 'En préparation',
  shipped: 'Expédié',
  in_transit: 'En transit',
  delivered: 'Livré',
}

const PAYMENT_STATUS_FR: Record<string, string> = {
  paid: 'Payé',
  pending_cash: 'En attente (Espèces)',
  pending_payment: 'En attente de paiement',
}

const normalizeDeliveryStatus = (value?: string | null) => {
  if (!value) return '—'
  return DELIVERY_STATUS_FR[value.toLowerCase()] || value.replace(/_/g, ' ')
}

const normalizePaymentStatus = (value?: string | null) => {
  if (!value) return '—'
  return PAYMENT_STATUS_FR[value.toLowerCase()] || value.replace(/_/g, ' ')
}

const toNumberValue = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

const resolvePaymentTone = (value?: string | null) => {
  const normalized = (value ?? '').toLowerCase()
  if (normalized === 'paid') return 'bg-emerald-100 text-emerald-800'
  if (normalized.includes('pending')) return 'bg-amber-100 text-amber-800'
  if (normalized === 'failed' || normalized === 'canceled')
    return 'bg-rose-100 text-rose-800'
  return 'bg-gray-100 text-gray-700'
}

const resolveDeliveryTone = (value?: string | null) => {
  const normalized = (value ?? '').toLowerCase()
  if (normalized === 'delivered') return 'bg-emerald-100 text-emerald-800'
  if (normalized === 'shipped' || normalized === 'in_transit')
    return 'bg-blue-100 text-blue-800'
  if (normalized.includes('pending')) return 'bg-amber-100 text-amber-800'
  return 'bg-gray-100 text-gray-700'
}

const SalesHistoryPage = () => {
  const [orders, setOrders] = useState<AdminOrderDashboardRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [deliveryFilter, setDeliveryFilter] = useState('all')
  const [query, setQuery] = useState('')

  const [searchParams, setSearchParams] = useSearchParams()
  const validateOrderId = searchParams.get('validate_order')
  const viewOrderId = searchParams.get('view_order')

  const handleCloseModal = () => {
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('validate_order')
    setSearchParams(newParams, { replace: true })
  }

  const handleCloseDetailsModal = () => {
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('view_order')
    setSearchParams(newParams, { replace: true })
  }

  useEffect(() => {
    let isActive = true

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getAdminOrdersDashboard({ limit: 200 })
        if (!isActive) return
        setOrders(data)
      } catch (fetchError) {
        console.error('Erreur chargement ventes', fetchError)
        if (isActive) setError('Impossible de charger les commandes.')
      } finally {
        if (isActive) setLoading(false)
      }
    }

    void load()

    return () => {
      isActive = false
    }
  }, [])

  const rows = useMemo(() => {
    const search = query.trim().toLowerCase()
    return orders.filter((order) => {
      const paymentStatus = (order.status_paiement || '').toLowerCase()
      const deliveryStatus = (order.status_commande || '').toLowerCase()

      const customerName = (order.client_nom_complet || '').toLowerCase()
      const customerEmail = (order.client_email || '').toLowerCase()

      const matchesPayment =
        paymentFilter === 'all' || paymentStatus === paymentFilter
      const matchesDelivery =
        deliveryFilter === 'all' || deliveryStatus === deliveryFilter
      const matchesQuery =
        !search ||
        String(order.order_number || order.order_id).toLowerCase().includes(search) ||
        customerName.includes(search) ||
        customerEmail.includes(search)

      return matchesPayment && matchesDelivery && matchesQuery
    })
  }, [orders, paymentFilter, deliveryFilter, query])

  const selectedOrder = useMemo(() => {
    if (!viewOrderId) return null
    return orders.find((order) => String(order.order_id) === String(viewOrderId)) ?? null
  }, [orders, viewOrderId])

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
            Back-Office
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-gray-900">
            Historique des Ventes
          </h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher une commande"
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm sm:w-56"
          />
          <select
            value={paymentFilter}
            onChange={(event) => setPaymentFilter(event.target.value)}
            className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm"
          >
            <option value="all">Paiement: Tous</option>
            <option value="paid">Payé</option>
            <option value="pending_cash">En attente (Espèces)</option>
            <option value="pending_payment">En attente de paiement</option>
          </select>
          <select
            value={deliveryFilter}
            onChange={(event) => setDeliveryFilter(event.target.value)}
            className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm"
          >
            <option value="all">Livraison: Toutes</option>
            <option value="pending">En préparation</option>
            <option value="shipped">Expédié</option>
            <option value="in_transit">En transit</option>
            <option value="delivered">Livré</option>
          </select>
        </div>
      </header>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-gray-500">Chargement...</p>
        ) : error ? (
          <p className="text-sm text-rose-600">{error}</p>
        ) : (
          <div className="overflow-x-auto w-full xl:overflow-visible">
            <table className="w-full text-xs md:text-sm text-left">
              <thead className="text-white font-bold tracking-wider text-xs uppercase">
                <tr className="text-left">
                  <th className="sticky top-0 z-20 bg-gray-800 py-4 pl-4 pr-2 rounded-tl-xl">Client</th>
                  <th className="sticky top-0 z-20 bg-gray-800 py-4 px-2">Commande</th>
                  <th className="sticky top-0 z-20 bg-gray-800 py-4 px-2">Date</th>
                  <th className="sticky top-0 z-20 bg-gray-800 py-4 px-2 text-right">Montant</th>
                  <th className="sticky top-0 z-20 bg-gray-800 py-4 px-2 text-center">Articles</th>
                  <th className="sticky top-0 z-20 bg-gray-800 py-4 px-2 text-right">Bénéfice net</th>
                  <th className="sticky top-0 z-20 bg-gray-800 py-4 px-2 text-center">Méthode</th>
                  <th className="sticky top-0 z-20 bg-gray-800 py-4 px-2 text-center">Paiement</th>
                  <th className="sticky top-0 z-20 bg-gray-800 py-4 px-2 text-center">Livraison</th>
                  <th className="sticky top-0 z-20 bg-gray-800 py-4 px-2 text-center">Suivi</th>
                  <th className="sticky top-0 z-20 bg-gray-800 py-4 pl-2 pr-4 text-center rounded-tr-xl">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((order) => {
                  const total = toNumberValue(order.total_paye_client)
                  const itemsCount = toNumberValue(order.nombre_articles)
                  const netProfit = toNumberValue(order.benefice_net_estime)
                  const paymentStatus = order.status_paiement || ''
                  const deliveryStatus = order.status_commande || '—'
                  const isCash = paymentStatus === 'pending_cash'
                  const paymentMethodLabel =
                    order.methode_paiement ||
                    (isCash ? '💵 Espèces' : paymentStatus ? '💳 Carte' : '—')
                  const customerName = order.client_nom_complet || 'Non renseigné'
                  const profitTone =
                    netProfit > 0
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : netProfit < 0
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-gray-50 text-gray-600 border-gray-200'

                  return (
                    <tr 
                      key={order.order_id} 
                      onClick={() => setSearchParams({ view_order: order.order_id })}
                      className="text-gray-700 hover:bg-gray-50 cursor-pointer transition"
                    >
                      <td className="py-4 pl-4 pr-2 font-medium text-gray-900 min-w-[120px]">
                        {customerName}
                      </td>
                      <td className="py-4 px-2 font-semibold text-gray-900 break-words">
                        {order.order_number || order.order_id}
                      </td>
                      <td className="py-4 px-2 min-w-[100px]">{formatDateTime(order.date_commande)}</td>
                      <td className="py-4 px-2 text-right font-semibold text-gray-900">
                        {formatPrice(Number(total))}
                      </td>
                      <td className="py-4 px-2 text-center font-semibold text-gray-700">
                        {itemsCount || 0}
                      </td>
                      <td className="py-4 px-2 text-right">
                        <span className={`inline-flex items-center rounded-full border px-2 md:px-3 py-1 text-xs font-semibold ${profitTone}`}>
                          {formatPrice(netProfit)}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-center">
                        <span className="text-xs font-semibold text-gray-600 block min-w-[80px]">
                          {paymentMethodLabel}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold text-center leading-tight ${resolvePaymentTone(
                            paymentStatus,
                          )}`}
                        >
                          {normalizePaymentStatus(paymentStatus)}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold text-center leading-tight ${resolveDeliveryTone(
                            deliveryStatus,
                          )}`}
                        >
                          {normalizeDeliveryStatus(deliveryStatus)}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-center">
                        <span className="text-xs font-medium text-gray-500 break-all min-w-[90px] block">
                          {order.tracking_number || '-'}
                        </span>
                      </td>
                      <td className="py-4 pl-2 pr-4 text-center min-w-[120px]" onClick={(e) => e.stopPropagation()}>
                        {isCash ? (
                          paymentStatus === 'pending_cash' ? (
                          <button
                            onClick={() => setSearchParams({ validate_order: order.order_number || order.order_id })}
                            className="rounded-xl px-2 md:px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm"
                          >
                            Valider Espèces
                          </button>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2 md:px-3 py-1 text-xs font-semibold text-emerald-700">
                            Versement effectué
                          </span>
                        )
                        ) : order.methode_paiement === 'Carte Bancaire' ? (
                          <span className="text-xs text-gray-400">
                            {paymentStatus === 'paid' ? 'Payé via Stripe' : paymentStatus === 'canceled' || paymentStatus === 'failed' ? 'Abandonné' : 'Attente Stripe'}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">
                            {paymentStatus === 'paid' ? 'Payé' : paymentStatus === 'canceled' || paymentStatus === 'failed' ? 'Abandonné' : 'En attente'}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {rows.length === 0 && (
              <p className="py-6 text-center text-sm text-gray-500">
                Aucune commande ne correspond aux filtres.
              </p>
            )}
          </div>
        )}
      </section>

      <ValidationModal
        isOpen={!!validateOrderId}
        selectedOrder={validateOrderId}
        onClose={handleCloseModal}
      />
      
      {viewOrderId && (
        <OrderDetailsModal
          isOpen={true}
          order={selectedOrder}
          onClose={handleCloseDetailsModal}
        />
      )}
    </div>
  )
}

export default SalesHistoryPage
