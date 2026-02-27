import { X, Package, CreditCard, User, Truck } from 'lucide-react'
import { type AdminOrderDashboardRecord } from '../lib/commerceApi'
import { formatPrice } from '../utils/format'

type OrderDetailsModalProps = {
  isOpen: boolean
  order: AdminOrderDashboardRecord | null
  onClose: () => void
}

const toNumberValue = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

const normalizeDetails = (value: unknown): Record<string, unknown>[] => {
  if (!value) return []
  if (Array.isArray(value)) {
    return value.filter(Boolean).map((entry) => (typeof entry === 'object' ? entry as Record<string, unknown> : { value: entry }))
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return []
    try {
      const parsed = JSON.parse(trimmed)
      return normalizeDetails(parsed)
    } catch {
      return []
    }
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    const list = record.items || record.list || record.articles || record.data
    if (Array.isArray(list)) return normalizeDetails(list)
  }
  return []
}

const resolveItemLabel = (item: Record<string, unknown>) => {
  const rawTitle =
    (item.titre as string) ||
    (item.title as string) ||
    (item.product_title as string) ||
    (item.nom_article as string) ||
    (item.name as string)

  const title = typeof rawTitle === 'string' ? rawTitle.trim() : ''
  if (title && title.toLowerCase() !== 'null' && title.toLowerCase() !== 'undefined') {
    return title
  }

  const rawId =
    item.id ??
    item.product_id ??
    item.article_id ??
    item.cj_id ??
    item.sku ??
    item.product_sku
  const idLabel =
    typeof rawId === 'string' || typeof rawId === 'number'
      ? String(rawId)
      : ''

  return idLabel ? `Produit sans titre (${idLabel})` : 'Produit sans titre'
}

const resolveItemQuantity = (item: Record<string, unknown>) =>
  toNumberValue(
    item.quantite ?? item.quantity ?? item.qty ?? item.qte ?? item.count,
  )

const resolveItemUnitPrice = (item: Record<string, unknown>) =>
  toNumberValue(
    item.prix_unitaire ?? item.unit_price ?? item.price ?? item.prix,
  )

const resolveItemCost = (item: Record<string, unknown>) =>
  toNumberValue(
    item.cout_cj ??
      item.cout_cj_estime ??
      item.cout ??
      item.cost_cj ??
      item.cost ??
      item.cj_cost,
  )

const OrderDetailsModal = ({ isOpen, order, onClose }: OrderDetailsModalProps) => {
  if (!isOpen) return null

  const items = normalizeDetails(order?.details_articles_json)
  const totalPaid = toNumberValue(order?.total_paye_client)
  const shippingPaid = toNumberValue(order?.frais_port_encaisses)
  const costEstimated = toNumberValue(order?.cout_produits_estime)
  const urssafCost = toNumberValue(order?.frais_urssaf)
  const netProfit = toNumberValue(order?.benefice_net_estime)
  const profitTone =
    netProfit > 0
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : netProfit < 0
        ? 'bg-rose-50 text-rose-700 border-rose-200'
        : 'bg-gray-50 text-gray-600 border-gray-200'

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
            {order?.order_number ?? order?.order_id ?? 'Commande'}
          </h2>
        </div>

        {!order ? (
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
                <p>
                  <span className="text-gray-400">Nom:</span>{' '}
                  {order.client_nom_complet || 'Non renseigné'}
                </p>
                <p>
                  <span className="text-gray-400">Email:</span>{' '}
                  {order.client_email || 'Non renseigné'}
                </p>
                <p>
                  <span className="text-gray-400">Commande:</span>{' '}
                  {order.order_number ?? order.order_id}
                </p>
                <p>
                  <span className="text-gray-400">Date:</span>{' '}
                  {order.date_commande || '—'}
                </p>
              </div>
            </section>

            {/* Paiement */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-indigo-500" />
                <h3 className="font-semibold text-gray-900">Paiement</h3>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <span className="text-gray-400">Méthode:</span>{' '}
                  <span className="font-medium">
                    {order.methode_paiement || '—'}
                  </span>
                </p>
                <p>
                  <span className="text-gray-400">Statut paiement:</span>{' '}
                  <span className="font-medium">
                    {order.status_paiement || '—'}
                  </span>
                </p>
                <p>
                  <span className="text-gray-400">Statut commande:</span>{' '}
                  <span className="font-medium">
                    {order.status_commande || '—'}
                  </span>
                </p>
              </div>
            </section>

            {/* Livraison */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-semibold text-gray-900">Livraison</h3>
                </div>
                {order.status_commande && (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 uppercase">
                    {order.status_commande.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-700 leading-relaxed">
                <p>
                  <span className="text-gray-400">CJ Order:</span>{' '}
                  {order.cj_order_id || '—'}
                </p>
                <p>
                  <span className="text-gray-400">Délai estimé:</span>{' '}
                  {order.delai_livraison_estime || '—'}
                </p>
              </div>
            </section>

            {/* Analyse financière */}
            <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-indigo-500" />
                <h3 className="font-semibold text-gray-900">Analyse financière</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                    Total payé client
                  </p>
                  <p className="mt-2 text-base font-semibold text-gray-900">
                    {formatPrice(totalPaid)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                    Frais de port encaissés
                  </p>
                  <p className="mt-2 text-base font-semibold text-gray-900">
                    {formatPrice(shippingPaid)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                    Coût CJ estimé
                  </p>
                  <p className="mt-2 text-base font-semibold text-gray-900">
                    {formatPrice(costEstimated)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                    URSSAF
                  </p>
                  <p className="mt-2 text-base font-semibold text-gray-900">
                    {formatPrice(urssafCost)}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <div
                  className={`inline-flex items-center gap-3 rounded-2xl border px-5 py-3 text-sm font-semibold shadow-sm ${profitTone} ${
                    netProfit > 0
                      ? 'bg-gradient-to-br from-emerald-50 via-white to-emerald-100 shadow-emerald-200/50'
                      : netProfit < 0
                        ? 'bg-gradient-to-br from-rose-50 via-white to-rose-100 shadow-rose-200/50'
                        : 'bg-white'
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-[0.25em]">Bénéfice net</span>
                  <span className="text-base font-bold">{formatPrice(netProfit)}</span>
                </div>
              </div>
            </section>

            {/* Produits */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-indigo-500" />
                <h3 className="font-semibold text-gray-900">Produits</h3>
              </div>
              <div className="space-y-3">
                {items.length > 0 ? (
                  items.map((item, index) => {
                    const label = resolveItemLabel(item)
                    const quantity = resolveItemQuantity(item)
                    const unitPrice = resolveItemUnitPrice(item)
                    const cjCost = resolveItemCost(item)

                    return (
                      <div
                        key={`${label}-${index}`}
                        className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 sm:flex-row sm:items-center"
                      >
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-gray-900">{label}</p>
                        <p className="text-xs text-gray-500">
                          Quantité: {quantity || 0}
                        </p>
                      </div>
                        <div className="flex items-center gap-4 text-xs text-gray-600 sm:text-sm">
                          <div className="text-right">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400">
                              PU
                            </p>
                            <p className="font-semibold text-gray-900">
                              {formatPrice(unitPrice)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400">
                              Coût CJ
                            </p>
                            <p className="font-semibold text-gray-900">
                              {formatPrice(cjCost)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
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
