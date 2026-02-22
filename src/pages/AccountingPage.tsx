import { useEffect, useMemo, useState } from 'react'
import { formatPrice } from '../utils/format'
import {
  getOrderItemsByOrderIds,
  getOrdersForHistory,
  getVariantsByIds,
  type OrderItemRecord,
  type OrderRecord,
  type VariantCostRecord,
} from '../lib/commerceApi'

type Grouping = 'day' | 'week' | 'month'

const VAT_RATE = 0.2
const URSSAF_RATE = 0.13
const DEFAULT_COST_PRICE = 0

const parseAmount = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

const normalizeId = (value: unknown): string => {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value)
  }
  if (value && typeof value === 'object' && 'id' in value) {
    const nestedId = (value as { id?: unknown }).id
    if (typeof nestedId === 'string' || typeof nestedId === 'number') {
      return String(nestedId)
    }
  }
  return ''
}

const formatPeriodKey = (dateValue: string, grouping: Grouping) => {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return ''

  if (grouping === 'month') {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      '0',
    )}`
  }

  if (grouping === 'week') {
    const temp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = temp.getUTCDay() || 7
    temp.setUTCDate(temp.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1))
    const weekNo = Math.ceil(
      ((temp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
    )
    return `${temp.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(date.getDate()).padStart(2, '0')}`
}

const formatPeriodLabel = (key: string, grouping: Grouping) => {
  if (!key) return '—'
  if (grouping === 'week') {
    const [year, week] = key.split('-W')
    return `Semaine ${week} · ${year}`
  }
  if (grouping === 'month') {
    const [year, month] = key.split('-')
    return `${month}/${year}`
  }
  return key
}

const AccountingPage = () => {
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [items, setItems] = useState<OrderItemRecord[]>([])
  const [variants, setVariants] = useState<VariantCostRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [grouping, setGrouping] = useState<Grouping>('month')
  const [paymentFilter, setPaymentFilter] = useState<'paid' | 'all'>('paid')

  useEffect(() => {
    let isActive = true

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const ordersResult = await getOrdersForHistory({ limit: 300 })
        if (!isActive) return
        setOrders(ordersResult)

        const orderIds = ordersResult.map((order) => order.id).filter(Boolean)
        const itemsResult = await getOrderItemsByOrderIds(orderIds)
        if (!isActive) return
        setItems(itemsResult)

        const variantIds = itemsResult
          .map((item) => normalizeId(item.variant_id as unknown))
          .filter(Boolean)
        const variantsResult = await getVariantsByIds(variantIds)
        if (!isActive) return
        setVariants(variantsResult)
      } catch (fetchError) {
        console.error('Erreur chargement comptabilité', fetchError)
        if (isActive) setError('Impossible de charger les données comptables.')
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
    const orderById = new Map(orders.map((order) => [order.id, order]))
    const variantById = new Map(variants.map((variant) => [variant.id, variant]))
    const quantityByOrder = new Map<string, number>()

    items.forEach((item) => {
      const orderId = normalizeId(item.order_id as unknown)
      if (!orderId) return
      const quantity = parseAmount(item.quantity)
      quantityByOrder.set(orderId, (quantityByOrder.get(orderId) ?? 0) + quantity)
    })

    const bucket = new Map<
      string,
      {
        revenue: number
        cost: number
        vat: number
        shipping: number
        urssaf: number
        margin: number
        orders: Set<string>
        items: number
      }
    >()

    items.forEach((item) => {
      const orderId = normalizeId(item.order_id as unknown)
      if (!orderId) return
      const order = orderById.get(orderId)
      if (!order?.created_at) return

      const paymentStatus = (order.payment_status ?? order.status ?? '').toLowerCase()
      if (paymentFilter !== 'all' && paymentStatus !== paymentFilter) return

      const periodKey = formatPeriodKey(order.created_at, grouping)
      if (!periodKey) return

      const quantity = parseAmount(item.quantity)
      const unitPrice = parseAmount(item.unit_price)
      const lineTotal =
        parseAmount(item.line_total) || (unitPrice > 0 ? unitPrice * quantity : 0)
      const variantId = normalizeId(item.variant_id as unknown)
      const costUnit =
        (variantId && variantById.get(variantId)?.cost_price) ??
        DEFAULT_COST_PRICE
      const costTotal = costUnit * quantity
      const vat = lineTotal * VAT_RATE
      const urssaf = lineTotal * URSSAF_RATE
      const shippingTotal = parseAmount(order.shipping_price)
      const orderQty = quantityByOrder.get(orderId) ?? 0
      const shippingShare = orderQty > 0 ? shippingTotal * (quantity / orderQty) : 0
      const margin = lineTotal - costTotal - vat - urssaf - shippingShare

      const entry =
        bucket.get(periodKey) ??
        ({
          revenue: 0,
          cost: 0,
          vat: 0,
          shipping: 0,
          urssaf: 0,
          margin: 0,
          orders: new Set<string>(),
          items: 0,
        })

      entry.revenue += lineTotal
      entry.cost += costTotal
      entry.vat += vat
      entry.shipping += shippingShare
      entry.urssaf += urssaf
      entry.margin += margin
      entry.orders.add(orderId)
      entry.items += quantity

      bucket.set(periodKey, entry)
    })

    return Array.from(bucket.entries())
      .map(([key, entry]) => ({
        key,
        label: formatPeriodLabel(key, grouping),
        revenue: entry.revenue,
        cost: entry.cost,
        vat: entry.vat,
        shipping: entry.shipping,
        urssaf: entry.urssaf,
        margin: entry.margin,
        orders: entry.orders.size,
        items: entry.items,
        marginRate: entry.revenue > 0 ? entry.margin / entry.revenue : 0,
      }))
      .sort((a, b) => b.key.localeCompare(a.key))
  }, [orders, items, variants, grouping, paymentFilter])

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.revenue += row.revenue
        acc.margin += row.margin
        acc.orders += row.orders
        acc.items += row.items
        return acc
      },
      { revenue: 0, margin: 0, orders: 0, items: 0 },
    )
  }, [rows])

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
            Back-Office
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-gray-900">
            Comptabilité & Marges
          </h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={grouping}
            onChange={(event) => setGrouping(event.target.value as Grouping)}
            className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm"
          >
            <option value="day">Par jour</option>
            <option value="week">Par semaine</option>
            <option value="month">Par mois</option>
          </select>
          <select
            value={paymentFilter}
            onChange={(event) =>
              setPaymentFilter(event.target.value as 'paid' | 'all')
            }
            className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm"
          >
            <option value="paid">Paiement: paid</option>
            <option value="all">Paiement: tous</option>
          </select>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
            Chiffre d&apos;affaires
          </p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {formatPrice(totals.revenue)}
          </p>
        </div>
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
            Marge nette estimée
          </p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {formatPrice(totals.margin)}
          </p>
        </div>
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
            Commandes / Articles
          </p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {totals.orders} / {totals.items}
          </p>
        </div>
      </section>

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
                  <th className="py-3 pr-4">Période</th>
                  <th className="py-3 pr-4 text-right">CA</th>
                  <th className="py-3 pr-4 text-right">Coût achat</th>
                  <th className="py-3 pr-4 text-right">TVA (20%)</th>
                  <th className="py-3 pr-4 text-right">Port</th>
                  <th className="py-3 pr-4 text-right">URSSAF (13%)</th>
                  <th className="py-3 pr-4 text-right">Marge nette</th>
                  <th className="py-3 pr-4 text-right">Marge %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr key={row.key} className="text-gray-700">
                    <td className="py-4 pr-4 font-semibold text-gray-900">
                      {row.label}
                    </td>
                    <td className="py-4 pr-4 text-right">
                      {formatPrice(row.revenue)}
                    </td>
                    <td className="py-4 pr-4 text-right">
                      {formatPrice(row.cost)}
                    </td>
                    <td className="py-4 pr-4 text-right">
                      {formatPrice(row.vat)}
                    </td>
                    <td className="py-4 pr-4 text-right">
                      {formatPrice(row.shipping)}
                    </td>
                    <td className="py-4 pr-4 text-right">
                      {formatPrice(row.urssaf)}
                    </td>
                    <td className="py-4 pr-4 text-right font-semibold text-gray-900">
                      {formatPrice(row.margin)}
                    </td>
                    <td className="py-4 pr-4 text-right">
                      {(row.marginRate * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && (
              <p className="py-6 text-center text-sm text-gray-500">
                Aucun résultat pour les filtres actuels.
              </p>
            )}
          </div>
        )}
      </section>

      <p className="text-xs text-gray-500">
        Les coûts unitaires utilisent le champ <span className="font-semibold">cost_price</span>{' '}
        des variantes. Valeur par défaut: {formatPrice(DEFAULT_COST_PRICE)}.
      </p>
    </div>
  )
}

export default AccountingPage
