import { useEffect, useMemo, useState } from 'react'
import { formatPrice } from '../utils/format'
import {
  getOrderDeliveriesByOrderIds,
  getOrdersForHistory,
  type OrderDeliveryRecord,
  type OrderRecord,
} from '../lib/commerceApi'

type DeliveryMap = Record<string, OrderDeliveryRecord>

const formatDateTime = (value?: string) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

const normalizeStatus = (value?: string | null) =>
  value?.replace(/_/g, ' ') ?? '—'

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
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [deliveries, setDeliveries] = useState<DeliveryMap>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [deliveryFilter, setDeliveryFilter] = useState('all')
  const [query, setQuery] = useState('')

  useEffect(() => {
    let isActive = true

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getOrdersForHistory({ limit: 200 })
        if (!isActive) return
        setOrders(data)

        const orderIds = data.map((order) => order.id).filter(Boolean)
        const deliveryRows = await getOrderDeliveriesByOrderIds(orderIds)
        if (!isActive) return

        const map: DeliveryMap = {}
        deliveryRows.forEach((delivery) => {
          if (delivery.order_id) {
            map[String(delivery.order_id)] = delivery
          }
        })
        setDeliveries(map)
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
      const paymentStatus = (order.payment_status ?? order.status ?? '').toLowerCase()
      const deliveryStatus = (deliveries[order.id]?.status ?? '').toLowerCase()
      const matchesPayment =
        paymentFilter === 'all' || paymentStatus === paymentFilter
      const matchesDelivery =
        deliveryFilter === 'all' || deliveryStatus === deliveryFilter
      const matchesQuery =
        !search ||
        String(order.order_number ?? order.id)
          .toLowerCase()
          .includes(search)
      return matchesPayment && matchesDelivery && matchesQuery
    })
  }, [orders, deliveries, paymentFilter, deliveryFilter, query])

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
            <option value="paid">paid</option>
            <option value="pending_cash">pending_cash</option>
            <option value="pending_payment">pending_payment</option>
          </select>
          <select
            value={deliveryFilter}
            onChange={(event) => setDeliveryFilter(event.target.value)}
            className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm"
          >
            <option value="all">Livraison: Toutes</option>
            <option value="pending">pending</option>
            <option value="shipped">shipped</option>
            <option value="in_transit">in_transit</option>
            <option value="delivered">delivered</option>
          </select>
        </div>
      </header>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-gray-500">Chargement...</p>
        ) : error ? (
          <p className="text-sm text-rose-600">{error}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-[0.2em] text-gray-400">
                  <th className="py-3 pr-4">Paiement</th>
                  <th className="py-3 pr-4">Livraison</th>
                  <th className="py-3 pr-4">Commande</th>
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4 text-right">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((order) => {
                  const total =
                    order.total_price ?? order.total ?? order.subtotal ?? 0
                  const paymentStatus = order.payment_status ?? order.status ?? '—'
                  const deliveryStatus = deliveries[order.id]?.status ?? '—'
                  return (
                    <tr key={order.id} className="text-gray-700">
                      <td className="py-4 pr-4">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${resolvePaymentTone(
                            paymentStatus,
                          )}`}
                        >
                          {normalizeStatus(paymentStatus)}
                        </span>
                      </td>
                      <td className="py-4 pr-4">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${resolveDeliveryTone(
                            deliveryStatus,
                          )}`}
                        >
                          {normalizeStatus(deliveryStatus)}
                        </span>
                      </td>
                      <td className="py-4 pr-4 font-semibold text-gray-900">
                        {order.order_number ?? order.id}
                      </td>
                      <td className="py-4 pr-4">{formatDateTime(order.created_at)}</td>
                      <td className="py-4 pr-4 text-right font-semibold text-gray-900">
                        {formatPrice(Number(total))}
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
    </div>
  )
}

export default SalesHistoryPage
