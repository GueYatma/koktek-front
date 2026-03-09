import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { formatPrice } from '../utils/format'
import {
  getAdminOrdersDashboard,
  deleteOrderById,
  type AdminOrderDashboardRecord,
} from '../lib/commerceApi'
import { useSearchParams } from 'react-router-dom'
import ValidationModal from '../components/ValidationModal'
import OrderDetailsModal from '../components/OrderDetailsModal'
import { Settings2, Trash2 } from 'lucide-react'

const formatDateTime = (value?: string) => {
  if (!value) return '—'
  const normalized = value.endsWith('Z') || value.includes('+') ? value : value + 'Z'
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Paris',
  }).format(date)
}

const PAYMENT_STATUS_FR: Record<string, string> = {
  paid: 'Payé',
  pending_cash: 'En attente (Espèces)',
  pending_payment: 'En attente de paiement',
}

const DELIVERY_STATUS_FR: Record<string, string> = {
  pending: 'En préparation',
  processing: 'En cours',
  shipped: 'Expédié',
  in_transit: 'En transit',
  delivered: 'Livré',
  paid: 'Payé (archive)',
}

const normalizePaymentStatus = (value?: string | null) => {
  if (!value) return '—'
  return PAYMENT_STATUS_FR[value.toLowerCase()] || value.replace(/_/g, ' ')
}

const normalizeDeliveryStatus = (value?: string | null) => {
  if (!value) return '—'
  return DELIVERY_STATUS_FR[value.toLowerCase()] || value.replace(/_/g, ' ')
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
  if (normalized === 'paid') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
  if (normalized.includes('pending')) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
  if (normalized === 'failed' || normalized === 'canceled')
    return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
  return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
}

const resolveDeliveryTone = (value?: string | null) => {
  const normalized = (value ?? '').toLowerCase()
  if (normalized === 'delivered') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
  if (normalized === 'shipped' || normalized === 'in_transit')
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
  if (normalized.includes('pending')) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
  return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
}

type ColumnKey =
  | 'client'
  | 'email'
  | 'order'
  | 'date'
  | 'total'
  | 'subtotal'
  | 'shipping'
  | 'costCJ'
  | 'shippingCJ'
  | 'stripe'
  | 'urssaf'
  | 'resume'
  | 'profit'
  | 'method'
  | 'payment'
  | 'delivery'
  | 'cjOrderId'
  | 'tracking'
  | 'delay'
  | 'action'

type ColumnDef = {
  key: ColumnKey
  label: string
  defaultVisible: boolean
  align?: 'left' | 'right' | 'center'
}

const ALL_COLUMNS: ColumnDef[] = [
  { key: 'client', label: 'Client', defaultVisible: true },
  { key: 'email', label: 'Email', defaultVisible: false },
  { key: 'order', label: 'Commande', defaultVisible: true },
  { key: 'date', label: 'Date', defaultVisible: true },
  { key: 'total', label: 'Montant', defaultVisible: true, align: 'right' },
  { key: 'subtotal', label: 'Sous-total', defaultVisible: true, align: 'right' },
  { key: 'shipping', label: 'Port client', defaultVisible: true, align: 'right' },
  { key: 'costCJ', label: 'Coût CJ', defaultVisible: false, align: 'right' },
  { key: 'shippingCJ', label: 'Expéd. CJ', defaultVisible: true, align: 'right' },
  { key: 'stripe', label: 'Stripe', defaultVisible: false, align: 'right' },
  { key: 'urssaf', label: 'URSSAF', defaultVisible: false, align: 'right' },
  { key: 'resume', label: 'Détail articles', defaultVisible: true },
  { key: 'profit', label: 'Bénéfice net', defaultVisible: true, align: 'right' },
  { key: 'method', label: 'Méthode', defaultVisible: true, align: 'center' },
  { key: 'payment', label: 'Paiement', defaultVisible: true, align: 'center' },
  { key: 'delivery', label: 'Livraison', defaultVisible: true, align: 'center' },
  { key: 'cjOrderId', label: 'ID CJ', defaultVisible: false, align: 'center' },
  { key: 'tracking', label: 'Suivi', defaultVisible: true, align: 'center' },
  { key: 'delay', label: 'Délai estimé', defaultVisible: true, align: 'center' },
  { key: 'action', label: 'Action', defaultVisible: true, align: 'center' },
]

const DEFAULT_VISIBLE = new Set(
  ALL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key),
)

const SalesHistoryPage = () => {
  const [orders, setOrders] = useState<AdminOrderDashboardRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [deliveryFilter, setDeliveryFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [visibleCols, setVisibleCols] = useState<Set<ColumnKey>>(DEFAULT_VISIBLE)
  const [showColPicker, setShowColPicker] = useState(false)
  const colPickerRef = useRef<HTMLDivElement>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)

  // Ferme le menu "Colonnes" au clic en dehors
  useEffect(() => {
    if (!showColPicker) return
    const handler = (e: MouseEvent) => {
      if (colPickerRef.current && !colPickerRef.current.contains(e.target as Node)) {
        setShowColPicker(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showColPicker])

  const [searchParams, setSearchParams] = useSearchParams()
  const validateOrderId = searchParams.get('validate_order')
  const viewOrderId = searchParams.get('view_order')

  const loadOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAdminOrdersDashboard({ limit: 200 })
      setOrders(data)
    } catch (fetchError) {
      console.error('Erreur chargement ventes', fetchError)
      setError('Impossible de charger les commandes.')
    } finally {
      setLoading(false)
    }
  }

  const handleCloseModal = () => {
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('validate_order')
    setSearchParams(newParams, { replace: true })
    void loadOrders() // Refetch les données après fermeture !
  }

  const handleCloseDetailsModal = () => {
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('view_order')
    setSearchParams(newParams, { replace: true })
  }

  const toggleColumn = (key: ColumnKey) => {
    setVisibleCols((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  useEffect(() => {
    void loadOrders()
  }, [])

  const rows = useMemo(() => {
    const search = query.trim().toLowerCase()
    return orders.filter((order) => {
      const paymentStatus = String(order.status_paiement || '').toLowerCase()
      const deliveryStatus = String(order.status_commande || '').toLowerCase()
      const customerName = String(order.client_nom_complet || '').toLowerCase()
      const customerEmail = String(order.client_email || '').toLowerCase()

      // Règles Strictes pour Espèces en attente (Ticket Bug) + SÉCURITÉ ANTI-CRASH
      const methodePaiement = String(order.methode_paiement || '').toLowerCase()
      const isPendingCashDetails =
        methodePaiement.includes('espèces') ||
        methodePaiement.includes('especes') ||
        methodePaiement.includes('cash')

      const isCashOrderPending = isPendingCashDetails && paymentStatus !== 'paid'

      const matchesPayment =
        paymentFilter === 'all' ||
        paymentStatus === paymentFilter ||
        (paymentFilter === 'pending_cash' && isCashOrderPending)

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

  // Résumé : uniquement les commandes définitivement payées
  const totals = useMemo(() => {
    const paidRows = rows.filter((o) => (o.status_paiement || '').toLowerCase() === 'paid')
    return paidRows.reduce(
      (acc, order) => {
        acc.total += toNumberValue(order.total_paye_client)
        acc.subtotal += toNumberValue(order.sous_total_produits)
        acc.shipping += toNumberValue(order.frais_port_encaisses)
        acc.costCJ += toNumberValue(order.cout_produits_estime)
        acc.shippingCJ += toNumberValue(order.cout_expedition_estime)
        acc.stripe += toNumberValue(order.frais_stripe)
        acc.urssaf += toNumberValue(order.frais_urssaf)
        acc.profit += toNumberValue(order.benefice_net_estime)
        acc.articles += toNumberValue(order.nombre_articles)
        acc.count += 1
        return acc
      },
      { total: 0, subtotal: 0, shipping: 0, costCJ: 0, shippingCJ: 0, stripe: 0, urssaf: 0, profit: 0, articles: 0, count: 0 },
    )
  }, [rows])

  const marginRate = totals.total > 0 ? (totals.profit / totals.total) * 100 : 0

  const selectedOrder = useMemo(() => {
    if (!viewOrderId) return null
    return orders.find((order) => String(order.order_id) === String(viewOrderId)) ?? null
  }, [orders, viewOrderId])

  const isVisible = (key: ColumnKey) => visibleCols.has(key)

  const alignClass = (col: ColumnDef) => {
    if (col.align === 'right') return 'text-right'
    if (col.align === 'center') return 'text-center'
    return 'text-left'
  }

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    const allIds = rows.map((o) => o.order_id)
    const allSelected = allIds.every((id) => selectedIds.has(id))
    setSelectedIds(allSelected ? new Set() : new Set(allIds))
  }, [rows, selectedIds])

  const handleDeleteSelected = useCallback(async () => {
    if (selectedIds.size === 0) return
    const confirmed = window.confirm(
      `Supprimer définitivement ${selectedIds.size} commande${selectedIds.size > 1 ? 's' : ''} de la base de données ?`
    )
    if (!confirmed) return
    setIsDeleting(true)
    try {
      await Promise.all([...selectedIds].map((id) => deleteOrderById(id)))
      setOrders((prev) => prev.filter((o) => !selectedIds.has(o.order_id)))
      setSelectedIds(new Set())
    } catch (err) {
      console.error('Erreur suppression', err)
      alert('Une erreur est survenue lors de la suppression.')
    } finally {
      setIsDeleting(false)
    }
  }, [selectedIds])

  const handleDeleteOne = useCallback(async (orderId: string, orderLabel: string) => {
    const confirmed = window.confirm(`Annuler et supprimer la commande ${orderLabel} ?`)
    if (!confirmed) return
    try {
      await deleteOrderById(orderId)
      setOrders((prev) => prev.filter((o) => o.order_id !== orderId))
      setSelectedIds((prev) => { const n = new Set(prev); n.delete(orderId); return n })
    } catch (err) {
      console.error('Erreur suppression', err)
      alert('Impossible de supprimer cette commande.')
    }
  }, [])

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500">
            Back-Office
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Historique des Ventes
          </h2>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher une commande"
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm sm:w-56 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          />
          <select
            value={paymentFilter}
            onChange={(event) => setPaymentFilter(event.target.value)}
            className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          >
            <option value="all">Paiement: Tous</option>
            <option value="paid">Payé</option>
            <option value="pending_cash">En attente (Espèces)</option>
          </select>
          <select
            value={deliveryFilter}
            onChange={(event) => setDeliveryFilter(event.target.value)}
            className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          >
            <option value="all">Livraison: Toutes</option>
            <option value="pending">En préparation</option>
            <option value="processing">En cours</option>
            <option value="shipped">Expédié</option>
            <option value="in_transit">En transit</option>
            <option value="delivered">Livré</option>
          </select>
          <div className="relative" ref={colPickerRef}>
            <button
              onClick={() => setShowColPicker((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              aria-label="Sélectionner les colonnes"
            >
              <Settings2 className="h-4 w-4" />
              Colonnes
            </button>
            {showColPicker && (
              <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-gray-200 bg-white p-3 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Colonnes visibles
                </p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                  {ALL_COLUMNS.filter((c) => c.key !== 'action').map((col) => (
                    <label
                      key={col.key}
                      className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={visibleCols.has(col.key)}
                        onChange={() => toggleColumn(col.key)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      {col.label}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Bandeau bulk delete */}
      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-40 flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 shadow-md dark:border-rose-800 dark:bg-rose-950/40">
          <span className="text-sm font-semibold text-rose-700 dark:text-rose-300">
            {selectedIds.size} commande{selectedIds.size > 1 ? 's' : ''} sélectionnée{selectedIds.size > 1 ? 's' : ''}
          </span>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleDeleteSelected}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? 'Suppression…' : `Supprimer ${selectedIds.size} commande${selectedIds.size > 1 ? 's' : ''}`}
          </button>
        </div>
      )}

      {/* Sticky Summary Card — uniquement les commandes payées */}
      {!loading && !error && totals.count > 0 && (
        <div className="sticky top-0 z-30 rounded-2xl border border-indigo-100 bg-gradient-to-r from-slate-50 via-indigo-50/50 to-slate-50 dark:border-indigo-900/30 dark:from-gray-800 dark:via-indigo-950/20 dark:to-gray-800 px-5 py-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Résumé (Payé)</span>
              <span className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-bold text-white">{totals.count}</span>
              <span className="text-gray-500 dark:text-gray-400">commande{totals.count > 1 ? 's' : ''}</span>
            </div>
            <span className="hidden sm:block h-5 w-px bg-gray-200 dark:bg-gray-700" />
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">CA</span>
              <span className="font-bold text-gray-900 dark:text-gray-100">{formatPrice(totals.total)}</span>
            </div>
            <span className="hidden sm:block h-5 w-px bg-gray-200 dark:bg-gray-700" />
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">Articles</span>
              <span className="font-bold text-gray-900 dark:text-gray-100">{totals.articles}</span>
            </div>
            <span className="hidden sm:block h-5 w-px bg-gray-200 dark:bg-gray-700" />
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">Coûts CJ</span>
              <span className="font-semibold text-rose-600 dark:text-rose-400">{formatPrice(totals.costCJ + totals.shippingCJ)}</span>
            </div>
            <span className="hidden sm:block h-5 w-px bg-gray-200 dark:bg-gray-700" />
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">URSSAF</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">{formatPrice(totals.urssaf)}</span>
            </div>
            <span className="hidden sm:block h-5 w-px bg-gray-200 dark:bg-gray-700" />
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">Bénéfice</span>
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${totals.profit >= 0 ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' : 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800'}`}>
                {formatPrice(totals.profit)} ({marginRate.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      )}

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {loading ? (
          <p className="text-sm text-gray-500">Chargement...</p>
        ) : error ? (
          <p className="text-sm text-rose-600">{error}</p>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-xs md:text-sm text-left">
              <thead className="text-white font-bold tracking-wider text-xs uppercase">
                <tr className="text-left">
                  {/* Checkbox select-all */}
                  <th className="sticky top-0 z-20 bg-gray-800 py-4 pl-4 pr-2 w-8 rounded-tl-xl">
                    <input
                      type="checkbox"
                      aria-label="Tout sélectionner"
                      checked={rows.length > 0 && rows.every((o) => selectedIds.has(o.order_id))}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  {ALL_COLUMNS.filter((c) => isVisible(c.key)).map((col, idx, arr) => (
                    <th
                      key={col.key}
                      className={`sticky top-0 z-20 bg-gray-800 py-4 px-2 whitespace-nowrap ${alignClass(col)} ${idx === arr.length - 1 ? 'pr-4 rounded-tr-xl' : ''}`}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {rows.map((order) => {
                  const total = toNumberValue(order.total_paye_client)
                  const subtotal = toNumberValue(order.sous_total_produits)
                  const shipping = toNumberValue(order.frais_port_encaisses)
                  const costCJ = toNumberValue(order.cout_produits_estime)
                  const shippingCJ = toNumberValue(order.cout_expedition_estime)
                  const stripeFee = toNumberValue(order.frais_stripe)
                  const urssaf = toNumberValue(order.frais_urssaf)
                  const itemsCount = toNumberValue(order.nombre_articles)
                  const netProfit = toNumberValue(order.benefice_net_estime)
                  const paymentStatus = String(order.status_paiement || '').toLowerCase()
                  const deliveryStatus = String(order.status_commande || '—')
                  
                  const methodePaiement = String(order.methode_paiement || '').toLowerCase()
                  const isPendingCashDetails =
                    methodePaiement.includes('espèces') ||
                    methodePaiement.includes('especes') ||
                    methodePaiement.includes('cash')
                  
                  const isCash = paymentStatus === 'pending_cash' || isPendingCashDetails
                  
                  const paymentMethodLabel =
                    order.methode_paiement ||
                    (isCash ? '💵 Espèces' : paymentStatus ? '💳 Carte' : '—')
                  const customerName = order.client_nom_complet || 'Non renseigné'
                  const profitTone =
                    netProfit > 0
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                      : netProfit < 0
                        ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800'
                        : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'

                  const cellMap: Record<ColumnKey, React.ReactNode> = {
                    client: (
                      <td key="client" className="py-4 pl-4 pr-2 font-medium text-gray-900 dark:text-gray-100 min-w-[120px]">
                        {customerName}
                      </td>
                    ),
                    email: (
                      <td key="email" className="py-4 px-2 text-gray-500 dark:text-gray-400 min-w-[140px] truncate max-w-[180px]">
                        {order.client_email || '—'}
                      </td>
                    ),
                    order: (
                      <td key="order" className="py-4 px-2 font-semibold text-gray-900 dark:text-gray-100 break-words">
                        {order.order_number || order.order_id}
                      </td>
                    ),
                    date: (
                      <td key="date" className="py-4 px-2 min-w-[100px] text-gray-700 dark:text-gray-300">
                        {formatDateTime(order.date_commande)}
                      </td>
                    ),
                    total: (
                      <td key="total" className="py-4 px-2 text-right font-semibold text-gray-900 dark:text-gray-100">
                        {formatPrice(total)}
                      </td>
                    ),
                    subtotal: (
                      <td key="subtotal" className="py-4 px-2 text-right text-gray-700 dark:text-gray-300">
                        {formatPrice(subtotal)}
                      </td>
                    ),
                    shipping: (
                      <td key="shipping" className="py-4 px-2 text-right text-gray-700 dark:text-gray-300">
                        {formatPrice(shipping)}
                      </td>
                    ),
                    costCJ: (
                      <td key="costCJ" className="py-4 px-2 text-right text-gray-500 dark:text-gray-400">
                        {formatPrice(costCJ)}
                      </td>
                    ),
                    shippingCJ: (
                      <td key="shippingCJ" className="py-4 px-2 text-right text-rose-500 dark:text-rose-400">
                        {formatPrice(shippingCJ)}
                      </td>
                    ),
                    stripe: (
                      <td key="stripe" className="py-4 px-2 text-right text-violet-500 dark:text-violet-400">
                        {stripeFee > 0 ? formatPrice(stripeFee) : '—'}
                      </td>
                    ),
                    urssaf: (
                      <td key="urssaf" className="py-4 px-2 text-right text-amber-600 dark:text-amber-400">
                        {formatPrice(urssaf)}
                      </td>
                    ),
                    resume: (
                      <td key="resume" className="py-4 px-2 text-gray-500 dark:text-gray-400 min-w-[150px] max-w-[220px] truncate" title={order.resume_articles || ''}>
                        {order.resume_articles || '—'}
                      </td>
                    ),
                    profit: (
                      <td key="profit" className="py-4 px-2 text-right">
                        <span className={`inline-flex items-center rounded-full border px-2 md:px-3 py-1 text-xs font-semibold ${profitTone}`}>
                          {formatPrice(netProfit)}
                        </span>
                      </td>
                    ),
                    method: (
                      <td key="method" className="py-4 px-2 text-center">
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 block min-w-[80px]">
                          {paymentMethodLabel}
                        </span>
                      </td>
                    ),
                    payment: (
                      <td key="payment" className="py-4 px-2 text-center">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold text-center leading-tight ${
                          (order.methode_paiement || '').toLowerCase().includes('carte') && paymentStatus !== 'paid'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
                            : resolvePaymentTone(paymentStatus)
                        }`}>
                          {(order.methode_paiement || '').toLowerCase().includes('carte') && paymentStatus !== 'paid'
                            ? 'Abandonné'
                            : normalizePaymentStatus(paymentStatus)}
                        </span>
                      </td>
                    ),
                    delivery: (
                      <td key="delivery" className="py-4 px-2 text-center">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold text-center leading-tight ${resolveDeliveryTone(deliveryStatus)}`}>
                          {normalizeDeliveryStatus(deliveryStatus)}
                        </span>
                      </td>
                    ),
                    cjOrderId: (
                      <td key="cjOrderId" className="py-4 px-2 text-center text-xs text-gray-500 dark:text-gray-400 font-mono truncate max-w-[100px]" title={order.cj_order_id || ''}>
                        {order.cj_order_id || '—'}
                      </td>
                    ),
                    tracking: (
                      <td key="tracking" className="py-4 px-2 text-center">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 break-all min-w-[90px] block">
                          {order.tracking_number || '-'}
                        </span>
                      </td>
                    ),
                    delay: (
                      <td key="delay" className="py-4 px-2 text-center text-xs text-gray-500 dark:text-gray-400">
                        {order.delai_livraison_estime || '—'}
                      </td>
                    ),
                    action: (
                      <td key="action" className="py-4 pl-2 pr-4 text-center min-w-[150px]" onClick={(e) => e.stopPropagation()}>
                        {isPendingCashDetails && paymentStatus !== 'paid' ? (
                          <div className="inline-flex items-center gap-1.5 justify-center w-full">
                            <button
                              type="button"
                              onClick={() => setSearchParams({ validate_order: order.order_number || order.order_id })}
                              className="rounded-xl px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm"
                            >
                              Valider
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteOne(order.order_id, order.order_number || order.order_id)}
                              title="Annuler et supprimer cette commande"
                              className="rounded-xl p-1.5 text-xs font-semibold bg-rose-100 text-rose-600 hover:bg-rose-200 transition shadow-sm dark:bg-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-900/50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ) : isPendingCashDetails ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400">
                            Espèces Validées
                          </span>
                        ) : paymentStatus === 'paid' ? (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {(order.methode_paiement || '').toLowerCase().includes('carte') ? 'Payé en ligne' : 'Payé'}
                          </span>
                        ) : (order.methode_paiement || '').toLowerCase().includes('carte') && paymentStatus !== 'paid' ? (
                          <div className="inline-flex items-center gap-1.5 justify-center w-full">
                            <button
                              type="button"
                              onClick={() => handleDeleteOne(order.order_id, order.order_number || order.order_id)}
                              title="Annuler et supprimer cette commande"
                              className="rounded-xl p-1.5 text-xs font-semibold bg-rose-100 text-rose-600 hover:bg-rose-200 transition shadow-sm dark:bg-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-900/50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {paymentStatus === 'canceled' || paymentStatus === 'failed' || paymentStatus === 'abandoned' ? 'Abandonné' : 'En attente'}
                          </span>
                        )}
                      </td>
                    ),
                  }

                  const isSelected = selectedIds.has(order.order_id)
                  return (
                    <tr
                      key={order.order_id}
                      onClick={() => setSearchParams({ view_order: order.order_id })}
                      className={`text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition ${isSelected ? 'bg-indigo-50 dark:bg-indigo-950/20' : ''}`}
                    >
                      {/* Checkbox par ligne */}
                      <td className="py-4 pl-4 pr-2" onClick={(e) => { e.stopPropagation(); toggleSelect(order.order_id) }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(order.order_id)}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      {ALL_COLUMNS.filter((c) => isVisible(c.key)).map((col) => cellMap[col.key])}
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {rows.length === 0 && (
              <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
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
