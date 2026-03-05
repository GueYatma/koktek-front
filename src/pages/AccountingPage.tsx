import { useEffect, useMemo, useState } from 'react'
import { formatPrice } from '../utils/format'
import {
  getAdminOrdersDashboard,
  type AdminOrderDashboardRecord,
} from '../lib/commerceApi'
import { useSearchParams } from 'react-router-dom'
import ValidationModal from '../components/ValidationModal'
import { Landmark, Package, PiggyBank, ShoppingBag, TrendingUp, Truck } from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
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
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
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

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
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

const PIE_COLORS = ['#0f172a', '#10b981', '#e11d48', '#f59e0b', '#8b5cf6']
const PAYMENT_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#94a3b8']

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
      const costTotal = parseAmount(order.cout_produits_estime)
      const shippingTotal = parseAmount(order.frais_port_encaisses)
      const shippingCJ = parseAmount(order.cout_expedition_estime)
      const stripeFee = parseAmount(order.frais_stripe)
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
          shippingCJ: 0,
          stripe: 0,
          urssaf: 0,
          margin: 0,
          orders: new Set<string>(),
          items: 0,
        })

      entry.revenue += revenue
      entry.subtotal += subtotal
      entry.cost += costTotal
      entry.shippingCJ += shippingCJ
      entry.stripe += stripeFee
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
        shippingCJ: entry.shippingCJ,
        stripe: entry.stripe,
        shipping: entry.shipping,
        urssaf: entry.urssaf,
        margin: entry.margin,
        orders: entry.orders.size,
        items: entry.items,
        marginRate: entry.revenue > 0 ? (entry.margin / entry.revenue) * 100 : 0,
      }))
      .sort((a, b) => a.key.localeCompare(b.key))
  }, [orders, periodPreset, paymentFilter])

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.revenue += row.revenue
        acc.subtotal += row.subtotal
        acc.shipping += row.shipping
        acc.cost += row.cost
        acc.shippingCJ += row.shippingCJ
        acc.stripe += row.stripe
        acc.urssaf += row.urssaf
        acc.margin += row.margin
        acc.orders += row.orders
        acc.items += row.items
        return acc
      },
      { revenue: 0, subtotal: 0, shipping: 0, cost: 0, shippingCJ: 0, stripe: 0, urssaf: 0, margin: 0, orders: 0, items: 0 },
    )
  }, [rows])

  const averageBasket = totals.orders > 0 ? totals.revenue / totals.orders : 0
  const averageMarginRate = totals.revenue > 0 ? totals.margin / totals.revenue : 0

  // Cost breakdown data for PieChart
  const costBreakdown = useMemo(() => {
    if (totals.revenue === 0) return []
    return [
      { name: 'Bénéfice net', value: Math.max(totals.margin, 0) },
      { name: 'Coût produits CJ', value: totals.cost },
      { name: 'Expéd. CJ', value: totals.shippingCJ },
      { name: 'URSSAF', value: totals.urssaf },
      { name: 'Stripe', value: totals.stripe },
    ].filter((d) => d.value > 0)
  }, [totals])

  // Payment methods breakdown
  const paymentMethods = useMemo(() => {
    const startDate = getStartDate(periodPreset)
    const methods = new Map<string, number>()
    orders.forEach((order) => {
      const orderDate = new Date(order.date_commande)
      if (orderDate < startDate) return
      const paymentStatus = (order.status_paiement || '').toLowerCase()
      if (paymentFilter !== 'all' && !paymentStatus.includes(paymentFilter)) return
      const method = order.methode_paiement || 'Non renseigné'
      methods.set(method, (methods.get(method) ?? 0) + 1)
    })
    return Array.from(methods.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [orders, periodPreset, paymentFilter])

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500">
            Back-Office
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Comptabilité & Marges
          </h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={periodPreset}
            onChange={(event) => setPeriodPreset(event.target.value as PeriodPreset)}
            className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
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
            className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          >
            <option value="paid">Paiement: paid</option>
            <option value="all">Paiement: tous</option>
          </select>
        </div>
      </header>

      {/* KPIs — 6 cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="group rounded-3xl border border-slate-200 dark:border-gray-700 bg-gradient-to-br from-white to-slate-50 dark:from-gray-800 dark:to-gray-850 p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400 dark:text-gray-500">
                Chiffre d&apos;affaires
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-gray-100">
                {formatPrice(totals.revenue)}
              </p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
              <TrendingUp className="h-5 w-5" />
            </span>
          </div>
        </div>
        <div className="group rounded-3xl border border-emerald-100 dark:border-emerald-900/30 bg-gradient-to-br from-white to-emerald-50 dark:from-gray-800 dark:to-emerald-950/20 p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-400 dark:text-emerald-500">
                Bénéfice net
              </p>
              <p className="mt-2 text-2xl font-semibold text-emerald-700 dark:text-emerald-400">
                {formatPrice(totals.margin)}
              </p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
              <PiggyBank className="h-5 w-5" />
            </span>
          </div>
        </div>
        <div className="group rounded-3xl border border-amber-100 dark:border-amber-900/30 bg-gradient-to-br from-white to-amber-50 dark:from-gray-800 dark:to-amber-950/20 p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-amber-400 dark:text-amber-500">
                Total URSSAF
              </p>
              <p className="mt-2 text-2xl font-semibold text-amber-700 dark:text-amber-400">
                {formatPrice(totals.urssaf)}
              </p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-sm">
              <Landmark className="h-5 w-5" />
            </span>
          </div>
        </div>
        <div className="group rounded-3xl border border-rose-100 dark:border-rose-900/30 bg-gradient-to-br from-white to-rose-50 dark:from-gray-800 dark:to-rose-950/20 p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-rose-400 dark:text-rose-500">
                Coût fournisseur
              </p>
              <p className="mt-2 text-2xl font-semibold text-rose-700 dark:text-rose-400">
                {formatPrice(totals.cost)}
              </p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-sm">
              <Package className="h-5 w-5" />
            </span>
          </div>
        </div>
        <div className="group rounded-3xl border border-indigo-100 dark:border-indigo-900/30 bg-gradient-to-br from-white to-indigo-50 dark:from-gray-800 dark:to-indigo-950/20 p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-indigo-400 dark:text-indigo-500">
                Panier moyen
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-gray-100">
                {formatPrice(averageBasket)}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
                Marge: {(averageMarginRate * 100).toFixed(1)}%
              </p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm">
              <ShoppingBag className="h-5 w-5" />
            </span>
          </div>
        </div>
        <div className="group rounded-3xl border border-cyan-100 dark:border-cyan-900/30 bg-gradient-to-br from-white to-cyan-50 dark:from-gray-800 dark:to-cyan-950/20 p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-400 dark:text-cyan-500">
                Commandes
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-gray-100">
                {totals.orders}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
                {totals.items} article{totals.items > 1 ? 's' : ''}
              </p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-600 text-white shadow-sm">
              <Truck className="h-5 w-5" />
            </span>
          </div>
        </div>
      </section>

      {/* Row 1: CA & Bénéfice chart + Cost breakdown donut */}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Évolution</p>
              <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                Chiffre d&apos;affaires & bénéfice net
              </h3>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-slate-900 dark:bg-slate-300" />&nbsp;CA
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />&nbsp;Bénéfice
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
                    <linearGradient id="marginGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} dy={10} minTickGap={20} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `€${val}`} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const revPayload = payload.find(p => p.dataKey === 'revenue')
                        const marPayload = payload.find(p => p.dataKey === 'margin')
                        const marginValue = marPayload?.value as number
                        const isLoss = marginValue < 0
                        return (
                          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                            <p className="mb-2 font-semibold text-gray-900 dark:text-gray-100">{label}</p>
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                CA : <span className="font-bold text-slate-900 dark:text-white">{formatPrice(revPayload?.value as number)}</span>
                              </p>
                              <p className={`text-sm font-medium ${isLoss ? 'text-rose-600' : 'text-emerald-600'}`}>
                                Bénéfice : <span className="font-bold">{formatPrice(marginValue)}</span>
                              </p>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#0f172a" strokeWidth={2} fill="url(#caGradient)" activeDot={{ r: 6, fill: '#0f172a', strokeWidth: 0 }} />
                  <Area
                    type="monotone"
                    dataKey="margin"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#marginGradient)"
                    activeDot={{ r: 6, fill: '#10b981', strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray-500">Aucune donnée à afficher.</p>
            )}
          </div>
        </section>

        {/* Cost breakdown donut */}
        <section className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500">Répartition</p>
          <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Décomposition du CA
          </h3>
          <div className="mt-4 h-52 flex items-center justify-center">
            {costBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={costBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {costBreakdown.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0]
                        return (
                          <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {item.name} : {formatPrice(item.value as number)}
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span className="text-xs text-gray-600 dark:text-gray-400">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray-500">Aucune donnée.</p>
            )}
          </div>
        </section>
      </div>

      {/* Row 2: Volume chart + Payment methods + Margin trend */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Volume des ventes */}
        <section className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500">Activité</p>
          <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Volume des ventes
          </h3>
          <div className="mt-6 h-48">
            {rows.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} dy={10} minTickGap={20} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: '#f1f5f9' }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                            <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">{label}</p>
                            <p className="font-semibold text-indigo-600 dark:text-indigo-400">
                              {payload[0].value} articles vendus
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="items" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray-500">Aucune donnée.</p>
            )}
          </div>
        </section>

        {/* Payment methods pie */}
        <section className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500">Paiements</p>
          <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Méthodes de paiement
          </h3>
          <div className="mt-4 h-52 flex items-center justify-center">
            {paymentMethods.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethods}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {paymentMethods.map((_, index) => (
                      <Cell key={index} fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0]
                        return (
                          <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {item.name} : {item.value} commande{(item.value as number) > 1 ? 's' : ''}
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span className="text-xs text-gray-600 dark:text-gray-400">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray-500">Aucune donnée.</p>
            )}
          </div>
        </section>

        {/* Margin rate trend */}
        <section className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500">Tendance</p>
          <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Taux de marge (%)
          </h3>
          <div className="mt-6 h-48">
            {rows.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} dy={10} minTickGap={20} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const rate = payload[0].value as number
                        return (
                          <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                            <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">{label}</p>
                            <p className={`font-bold ${rate < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              Marge : {rate.toFixed(1)}%
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="marginRate"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#10b981', strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray-500">Aucune donnée.</p>
            )}
          </div>
        </section>
      </div>

      {/* Detailed table */}
      <section className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-gray-500">Chargement...</p>
        ) : error ? (
          <p className="text-sm text-rose-600">{error}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 text-left text-xs uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                  <th className="py-3 pr-4">Période</th>
                  <th className="py-3 pr-4 text-right">CA</th>
                  <th className="py-3 pr-4 text-right">Sous-total</th>
                  <th className="py-3 pr-4 text-right">Port encaissé</th>
                  <th className="py-3 pr-4 text-right">Coût CJ</th>
                  <th className="py-3 pr-4 text-right">Expéd. CJ</th>
                  <th className="py-3 pr-4 text-right">Stripe</th>
                  <th className="py-3 pr-4 text-right">URSSAF</th>
                  <th className="py-3 pr-4 text-right">Bénéfice net</th>
                  <th className="py-3 pr-4 text-right">Articles</th>
                  <th className="py-3 pr-4 text-right">Marge %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {rows.map((row) => (
                  <tr key={row.key} className="text-gray-700 dark:text-gray-300">
                    <td className="py-4 pr-4 font-semibold text-gray-900 dark:text-gray-100">
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
                    <td className="py-4 pr-4 text-right text-rose-500">
                      {formatPrice(row.shippingCJ)}
                    </td>
                    <td className="py-4 pr-4 text-right text-violet-500">
                      {formatPrice(row.stripe)}
                    </td>
                    <td className="py-4 pr-4 text-right text-amber-600">
                      {formatPrice(row.urssaf)}
                    </td>
                    <td className={`py-4 pr-4 text-right font-semibold ${row.margin < 0 ? 'text-rose-600' : 'text-gray-900 dark:text-gray-100'}`}>
                      {formatPrice(row.margin)}
                    </td>
                    <td className="py-4 pr-4 text-right">
                      {row.items}
                    </td>
                    <td className={`py-4 pr-4 text-right ${row.marginRate < 0 ? 'text-rose-600 font-bold' : ''}`}>
                      {row.marginRate.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && (
              <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
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
