import { useEffect, useMemo, useState } from 'react'
import { formatPrice } from '../utils/format'
import {
  getAdminOrdersDashboard,
  type AdminOrderDashboardRecord,
} from '../lib/commerceApi'
import { useSearchParams } from 'react-router-dom'
import ValidationModal from '../components/ValidationModal'
import { Landmark, PiggyBank, ShoppingBag, TrendingUp } from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'

type Grouping = 'day' | 'week' | 'month'
type PeriodPreset = '7d' | '30d' | 'current_month' | 'current_year'

const parseAmount = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
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
  const [orders, setOrders] = useState<AdminOrderDashboardRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('30d')
  const [paymentFilter, setPaymentFilter] = useState<'paid' | 'all'>('all')

  const getStartDate = (preset: PeriodPreset): Date => {
    const now = new Date()
    switch (preset) {
      case '7d':
        now.setDate(now.getDate() - 7)
        return now
      case '30d':
        now.setDate(now.getDate() - 30)
        return now
      case 'current_month':
        return new Date(now.getFullYear(), now.getMonth(), 1)
      case 'current_year':
        return new Date(now.getFullYear(), 0, 1)
      default:
        now.setDate(now.getDate() - 30)
        return now
    }
  }

  const getPresetGrouping = (preset: PeriodPreset): Grouping => {
    if (preset === 'current_year') return 'month'
    return 'day'
  }

  const [searchParams, setSearchParams] = useSearchParams()
  const validateOrderId = searchParams.get('validate_order')

  const handleCloseModal = () => {
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('validate_order')
    setSearchParams(newParams, { replace: true })
  }

  useEffect(() => {
    let isActive = true

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getAdminOrdersDashboard({ limit: 500 })
        if (!isActive) return
        setOrders(data)
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
    const bucket = new Map<
      string,
      {
        revenue: number
        subtotal: number
        shipping: number
        cost: number
        urssaf: number
        margin: number
        orders: Set<string>
        items: number
      }
    >()

    const startDate = getStartDate(periodPreset)
    const activeGrouping = getPresetGrouping(periodPreset)

    orders.forEach((order) => {
      const orderDate = new Date(order.date_commande)
      if (orderDate < startDate) return

      const paymentStatus = (order.status_paiement || '').toLowerCase()
      if (paymentFilter !== 'all' && !paymentStatus.includes(paymentFilter)) return

      const periodKey = formatPeriodKey(order.date_commande, activeGrouping)
      if (!periodKey) return

      const revenue = parseAmount(order.total_paye_client)
      const subtotal = parseAmount(order.sous_total_produits)
      const shippingTotal = parseAmount(order.frais_port_encaisses)
      const costTotal = parseAmount(order.cout_produits_estime)
      const urssaf = parseAmount(order.frais_urssaf)
      const margin = parseAmount(order.benefice_net_estime)
      const quantity = parseAmount(order.nombre_articles)

      const entry =
        bucket.get(periodKey) ??
        ({
          revenue: 0,
          subtotal: 0,
          shipping: 0,
          cost: 0,
          urssaf: 0,
          margin: 0,
          orders: new Set<string>(),
          items: 0,
        })

      entry.revenue += revenue
      entry.subtotal += subtotal
      entry.cost += costTotal
      entry.shipping += shippingTotal
      entry.urssaf += urssaf
      entry.margin += margin
      entry.orders.add(order.order_id)
      entry.items += quantity

      bucket.set(periodKey, entry)
    })

    return Array.from(bucket.entries())
      .map(([key, entry]) => ({
        key,
        label: formatPeriodLabel(key, activeGrouping),
        revenue: entry.revenue,
        subtotal: entry.subtotal,
        cost: entry.cost,
        shipping: entry.shipping,
        urssaf: entry.urssaf,
        margin: entry.margin,
        orders: entry.orders.size,
        items: entry.items,
        marginRate: entry.revenue > 0 ? entry.margin / entry.revenue : 0,
      }))
      .sort((a, b) => a.key.localeCompare(b.key))
  }, [orders, periodPreset, paymentFilter])

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.revenue += row.revenue
        acc.subtotal += row.subtotal
        acc.shipping += row.shipping
        acc.urssaf += row.urssaf
        acc.margin += row.margin
        acc.orders += row.orders
        acc.items += row.items
        return acc
      },
      { revenue: 0, subtotal: 0, shipping: 0, urssaf: 0, margin: 0, orders: 0, items: 0 },
    )
  }, [rows])

  const averageBasket = totals.orders > 0 ? totals.revenue / totals.orders : 0
  const averageMarginRate = totals.revenue > 0 ? totals.margin / totals.revenue : 0

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
            value={periodPreset}
            onChange={(event) => setPeriodPreset(event.target.value as PeriodPreset)}
            className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm"
          >
            <option value="7d">7 derniers jours</option>
            <option value="30d">30 derniers jours</option>
            <option value="current_month">Mois en cours</option>
            <option value="current_year">Année en cours</option>
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

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="group rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Chiffre d&apos;affaires global
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {formatPrice(totals.revenue)}
              </p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
              <TrendingUp className="h-5 w-5" />
            </span>
          </div>
        </div>
        <div className="group rounded-3xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50 p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">
                Bénéfice net total
              </p>
              <p className="mt-2 text-2xl font-semibold text-emerald-700">
                {formatPrice(totals.margin)}
              </p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
              <PiggyBank className="h-5 w-5" />
            </span>
          </div>
        </div>
        <div className="group rounded-3xl border border-amber-100 bg-gradient-to-br from-white to-amber-50 p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-amber-400">
                Total URSSAF
              </p>
              <p className="mt-2 text-2xl font-semibold text-amber-700">
                {formatPrice(totals.urssaf)}
              </p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-sm">
              <Landmark className="h-5 w-5" />
            </span>
          </div>
        </div>
        <div className="group rounded-3xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50 p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-indigo-400">
                Panier moyen
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {formatPrice(averageBasket)}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Marge moyenne: {(averageMarginRate * 100).toFixed(1)}%
              </p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm">
              <ShoppingBag className="h-5 w-5" />
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
              Évolution
            </p>
            <h3 className="mt-2 text-lg font-semibold text-gray-900">
              Chiffre d&apos;affaires &amp; bénéfice net
            </h3>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-gray-600">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-slate-900"></span>
              Chiffre d&apos;Affaires
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-emerald-500"></span>
              Bénéfice Net
            </div>
          </div>
        </div>
        <div className="mt-6 h-64">
          {rows.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="caGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f172a" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
                  </linearGradient>
                  
                  {/* Gradient for Margin > 0 */}
                  <linearGradient id="marginGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 12, fill: '#64748b' }} 
                  axisLine={false} 
                  tickLine={false} 
                  dy={10} 
                  minTickGap={20}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#64748b' }} 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(val) => `€${val}`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const revPayload = payload.find(p => p.dataKey === 'revenue');
                      const marPayload = payload.find(p => p.dataKey === 'margin');
                      const marginValue = marPayload?.value as number;
                      const isLoss = marginValue < 0;
                      
                      return (
                        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-lg">
                          <p className="mb-2 font-semibold text-gray-900">{label}</p>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-slate-700">
                              Chiffre d&apos;Affaires : <span className="font-bold text-slate-900">{formatPrice(revPayload?.value as number)}</span>
                            </p>
                            <p className={`text-sm font-medium ${isLoss ? 'text-rose-600' : 'text-emerald-600'}`}>
                              Bénéfice : <span className="font-bold">{formatPrice(marginValue)}</span>
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {/* 
                  To support dynamic stroke color based on value, AreaChart limits stroke to one color. 
                  In Recharts, to perfectly match a split color on the line, we use gradient on stroke too if min < 0, 
                  but here we rely on the custom Tooltip + showing the area to signal loss.
                */}
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0f172a"
                  strokeWidth={2}
                  fill="url(#caGradient)"
                  activeDot={{ r: 6, fill: '#0f172a', strokeWidth: 0 }}
                />
                <Area
                  type="monotone"
                  dataKey="margin"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#marginGradient)"
                  activeDot={(props: any) => {
                    const { cx, cy, payload } = props;
                    const isLoss = payload.margin < 0;
                    return (
                      <circle cx={cx} cy={cy} r={6} fill={isLoss ? '#e11d48' : '#10b981'} stroke="none" />
                    );
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-500">Aucune donnée à afficher.</p>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
              Activité
            </p>
            <h3 className="mt-2 text-lg font-semibold text-gray-900">
              Volume des ventes
            </h3>
          </div>
        </div>
        <div className="mt-6 h-48">
          {rows.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 12, fill: '#64748b' }} 
                  axisLine={false} 
                  tickLine={false} 
                  dy={10} 
                  minTickGap={20}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#64748b' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-lg">
                          <p className="mb-1 text-sm text-gray-500">{label}</p>
                          <p className="font-semibold text-indigo-600">
                            {payload[0].value} articles vendus
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="items" 
                  fill="#6366f1" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-500">Aucune donnée à afficher.</p>
          )}
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
                  <th className="py-3 pr-4 text-right">Sous-total</th>
                  <th className="py-3 pr-4 text-right">Port encaissé</th>
                  <th className="py-3 pr-4 text-right">Coût CJ</th>
                  <th className="py-3 pr-4 text-right">URSSAF</th>
                  <th className="py-3 pr-4 text-right">Bénéfice net</th>
                  <th className="py-3 pr-4 text-right">Articles</th>
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
                      {formatPrice(row.subtotal)}
                    </td>
                    <td className="py-4 pr-4 text-right">
                      {formatPrice(row.shipping)}
                    </td>
                    <td className="py-4 pr-4 text-right">
                      {formatPrice(row.cost)}
                    </td>
                    <td className="py-4 pr-4 text-right">
                      {formatPrice(row.urssaf)}
                    </td>
                    <td className={`py-4 pr-4 text-right font-semibold ${row.margin < 0 ? 'text-rose-600' : 'text-gray-900'}`}>
                      {formatPrice(row.margin)}
                    </td>
                    <td className="py-4 pr-4 text-right">
                      {row.items}
                    </td>
                    <td className={`py-4 pr-4 text-right ${row.marginRate < 0 ? 'text-rose-600 font-bold' : ''}`}>
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

      <ValidationModal
        isOpen={!!validateOrderId}
        selectedOrder={validateOrderId}
        onClose={handleCloseModal}
      />
    </div>
  )
}

export default AccountingPage
