import { X, Package, CreditCard, User, Truck, TrendingUp, Receipt } from 'lucide-react'
import { type AdminOrderDashboardRecord } from '../lib/commerceApi'
import { formatPrice } from '../utils/format'

type OrderDetailsModalProps = {
  isOpen: boolean
  order: AdminOrderDashboardRecord | null
  onClose: () => void
}

const n = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

const normalizeDetails = (value: unknown): Record<string, unknown>[] => {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(Boolean).map((e) => (typeof e === 'object' ? (e as Record<string, unknown>) : { value: e }))
  if (typeof value === 'string') {
    try { return normalizeDetails(JSON.parse(value.trim())) } catch { return [] }
  }
  if (typeof value === 'object') {
    const r = value as Record<string, unknown>
    const l = r.items || r.list || r.articles || r.data
    if (Array.isArray(l)) return normalizeDetails(l)
  }
  return []
}

const itemLabel = (item: Record<string, unknown>) => {
  const raw = (item.product_title as string) || (item.title as string) || (item.name as string) || ''
  if (raw && raw.toLowerCase() !== 'null') return raw
  const id = item.product_id ?? item.sku ?? item.id
  return id ? `Produit (${id})` : 'Produit sans titre'
}

const formatDate = (value?: string) => {
  if (!value) return '—'
  const d = new Date(value.endsWith('Z') || value.includes('+') ? value : value + 'Z')
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Paris' }).format(d)
}

const PAYMENT_STATUS: Record<string, string> = { paid: 'Payé', pending_cash: 'En attente (Espèces)', pending_payment: 'En attente' }
const DELIVERY_STATUS: Record<string, string> = { pending: 'En préparation', shipped: 'Expédié', in_transit: 'En transit', delivered: 'Livré' }

const OrderDetailsModal = ({ isOpen, order, onClose }: OrderDetailsModalProps) => {
  if (!isOpen || !order) return null

  const items = normalizeDetails(order.details_articles_json)
  const total = n(order.total_paye_client)
  const subtotal = n(order.sous_total_produits)
  const shippingClient = n(order.frais_port_encaisses)
  // Si la vue SQL retourne 0 pour les coûts CJ, on les recompute depuis les détails articles
  const rawCostCJ = n(order.cout_produits_estime)
  const rawShippingCJ = n(order.cout_expedition_estime)
  const itemsCostCJ = items.length > 0
    ? items.reduce((sum, item) => sum + n(item.cost_price ?? item.cout_cj ?? item.cost) * Math.max(1, n(item.quantity ?? item.quantite ?? item.qty)), 0)
    : 0
  const itemsShippingCJ = items.length > 0
    ? items.reduce((sum, item) => sum + n(item.shipping_cost ?? item.shipping_price ?? 0), 0)
    : 0
  const costCJ = rawCostCJ > 0 ? rawCostCJ : itemsCostCJ
  const shippingCJ = rawShippingCJ > 0 ? rawShippingCJ : itemsShippingCJ
  const stripe = n(order.frais_stripe)
  const urssaf = n(order.frais_urssaf)
  // Recalcul du bénéfice si les coûts CJ ont été recalculés depuis les items
  const rawProfit = n(order.benefice_net_estime)
  const profit = (rawCostCJ === 0 && itemsCostCJ > 0)
    ? total - costCJ - shippingCJ - stripe - urssaf
    : rawProfit
  const marginRate = total > 0 ? (profit / total) * 100 : 0
  const totalCharges = costCJ + shippingCJ + stripe + urssaf

  const profitColor = profit > 0
    ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
    : profit < 0
      ? 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800'
      : 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'

  const paymentLabel = PAYMENT_STATUS[(order.status_paiement || '').toLowerCase()] || order.status_paiement || '—'
  const deliveryLabel = DELIVERY_STATUS[(order.status_commande || '').toLowerCase()] || order.status_commande || '—'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-3 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-100 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-400">Commande</p>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {order.order_number || order.order_id}
            </h2>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {/* Client + Paiement Row */}
          <div className="grid gap-3 grid-cols-2">
            <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <User className="h-3.5 w-3.5 text-indigo-500" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Client</span>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{order.client_nom_complet || 'Non renseigné'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{order.client_email || '—'}</p>
              <p className="text-xs text-gray-400 mt-1">{formatDate(order.date_commande)}</p>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <CreditCard className="h-3.5 w-3.5 text-indigo-500" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Paiement</span>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{order.methode_paiement || '—'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{paymentLabel}</p>
            </div>
          </div>

          {/* Livraison Row */}
          <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 text-indigo-500" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Livraison</span>
              </div>
              <span className="rounded-full bg-indigo-100 dark:bg-indigo-900/30 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:text-indigo-400 uppercase">
                {deliveryLabel}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 dark:text-gray-400">
              <div>
                <p className="text-gray-400 text-[10px] uppercase">CJ Order</p>
                <p className="font-mono text-gray-700 dark:text-gray-300 truncate">{order.cj_order_id || '—'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-[10px] uppercase">Tracking</p>
                <p className="font-mono text-gray-700 dark:text-gray-300 truncate">{order.tracking_number || '—'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-[10px] uppercase">Délai</p>
                <p className="text-gray-700 dark:text-gray-300">{order.delai_livraison_estime || '—'}</p>
              </div>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="rounded-xl border border-slate-200 dark:border-gray-600 bg-slate-50/70 dark:bg-gray-700/30 p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <TrendingUp className="h-3.5 w-3.5 text-indigo-500" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Analyse financière</span>
            </div>
            {/* Revenue side */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>Sous-total produits</span>
                <span className="font-semibold">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>Port encaissé</span>
                <span className="font-semibold">{formatPrice(shippingClient)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 dark:text-gray-100 border-t border-slate-200 dark:border-gray-600 pt-1.5">
                <span>Total payé client</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
            {/* Costs side */}
            <div className="mt-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>− Coût produits CJ</span>
                <span className="text-gray-700 dark:text-gray-300">-{formatPrice(costCJ)}</span>
              </div>
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>− Expédition CJ</span>
                <span className="text-rose-500">-{formatPrice(shippingCJ)}</span>
              </div>
              {stripe > 0 && (
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>− Frais Stripe (1.5%+0.25€)</span>
                  <span className="text-violet-500">-{formatPrice(stripe)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>− URSSAF (12.3%)</span>
                <span className="text-amber-600 dark:text-amber-400">-{formatPrice(urssaf)}</span>
              </div>
              <div className="flex justify-between text-gray-500 dark:text-gray-400 border-t border-dashed border-slate-300 dark:border-gray-600 pt-1.5">
                <span>Total charges</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">-{formatPrice(totalCharges)}</span>
              </div>
            </div>
            {/* Profit banner */}
            <div className={`mt-3 flex items-center justify-between rounded-xl border px-4 py-2.5 ${profitColor}`}>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Bénéfice net</p>
                <p className="text-lg font-bold">{formatPrice(profit)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Marge</p>
                <p className="text-lg font-bold">{marginRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          {/* Articles */}
          <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Package className="h-3.5 w-3.5 text-indigo-500" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Articles ({n(order.nombre_articles)})
              </span>
            </div>
            {items.length > 0 ? (
              <div className="space-y-2">
                {items.map((item, i) => {
                  const label = itemLabel(item)
                  const qty = n(item.quantity ?? item.quantite ?? item.qty)
                  const unitPrice = n(item.unit_price ?? item.prix_unitaire ?? item.price)
                  const cost = n(item.cost_price ?? item.cout_cj ?? item.cost)
                  const ship = n(item.shipping_cost ?? item.shipping_price ?? 0)
                  const variant = (item.variant_name as string) || ''
                  return (
                    <div key={`${label}-${i}`} className="flex items-center justify-between gap-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{label}</p>
                        {variant && <p className="text-xs text-gray-400 truncate">{variant}</p>}
                        <p className="text-xs text-gray-500 dark:text-gray-400">Qté: {qty || 1}</p>
                      </div>
                      <div className="flex gap-3 text-right shrink-0">
                        <div>
                          <p className="text-[9px] uppercase text-gray-400">PV</p>
                          <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">{formatPrice(unitPrice)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase text-gray-400">Coût</p>
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{formatPrice(cost)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase text-gray-400">Expéd.</p>
                          <p className="text-xs font-semibold text-rose-500">{formatPrice(ship)}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400">Aucun détail article disponible.</p>
            )}
          </div>

          {/* Résumé articles brut */}
          {order.resume_articles && (
            <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Receipt className="h-3.5 w-3.5 text-indigo-500" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Résumé</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">{order.resume_articles}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OrderDetailsModal
