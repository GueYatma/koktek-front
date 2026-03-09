import { useRef } from 'react'
import { X } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import { formatPrice } from '../utils/format'
import { resolveImageUrl } from '../utils/image'

type TicketItem = {
  imageUrl?: string | null
  productName: string
  variantName?: string | null
  variantValue?: string | null
  sku?: string | null
  quantity?: number
}

type OrderTicketModalProps = {
  open: boolean
  orderNumber: string
  /** Liste de tous les articles de la commande (prioritaire sur les champs unitaires) */
  items?: TicketItem[]
  /** Champs unitaires (compatibilité ascendante quand items n'est pas fourni) */
  productName?: string
  variantName?: string | null
  variantValue?: string | null
  sku?: string | null
  imageUrl?: string | null
  customerName?: string | null
  total: number
  subtotal?: number
  shippingTotal?: number
  status?: string | null
  logisticName?: string | null
  trackingNumber?: string | null
  trackingUrl?: string | null
  deliveryTimeEstimation?: string | null
  noticeText?: string
  hintText?: string
  headerLabel?: string
  title?: string
  noticeTone?: 'danger' | 'success'
  onClose?: () => void
  showPayByCard?: boolean
  onPayByCard?: () => void
  payByCardLabel?: string
  onContinueShopping?: () => void
}

const OrderTicketModal = ({
  open,
  orderNumber,
  items,
  productName = 'Commande Koktek',
  variantName,
  variantValue,
  sku,
  imageUrl,
  customerName,
  total,
  subtotal,
  shippingTotal,
  status,
  logisticName,
  trackingNumber,
  trackingUrl,
  deliveryTimeEstimation,
  noticeText,
  hintText,
  headerLabel = 'BON DE COMMANDE',
  title = 'Commande Réservée !',
  noticeTone = 'danger',
  onClose,
  showPayByCard = false,
  onPayByCard,
  payByCardLabel = 'Finalement, je paie par carte',
  onContinueShopping,
}: OrderTicketModalProps) => {
  const ticketRef = useRef<HTMLDivElement | null>(null)

  // Construire la liste d'articles : utiliser `items` si fourni, sinon replier sur les champs unitaires
  const articleList: TicketItem[] =
    items && items.length > 0
      ? items
      : [{ imageUrl, productName, variantName, variantValue, sku, quantity: 1 }]

  const defaultNotice =
    noticeTone === 'success'
      ? 'Merci pour votre commande. Votre paiement a été confirmé avec succès.'
      : 'Votre commande sera préparée uniquement après réception de votre paiement en espèces dans notre boutique à Marseille.'
  const notice = noticeText ?? defaultNotice
  const noticeClass = noticeTone === 'success' ? 'text-emerald-600' : 'text-red-600'

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/45"
        aria-hidden="true"
        onClick={onClose}
      />
      <aside
        className={`fixed top-[10%] bottom-[10%] left-4 right-4 flex h-auto max-h-[80vh] w-auto flex-col overflow-hidden rounded-3xl bg-white shadow-2xl transition-all duration-300 md:bottom-auto md:left-auto md:right-0 md:top-0 md:h-full md:max-h-none md:max-w-md md:rounded-none ${
          open ? 'translate-y-0 opacity-100 md:translate-x-0 md:translate-y-0' : 'translate-y-8 opacity-0 md:translate-x-full md:translate-y-0 md:opacity-100'
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div
            ref={ticketRef}
            className="relative rounded-3xl border border-amber-100/80 bg-[#fffaf4] px-5 py-6 shadow-xl"
          >
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 opacity-30 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900 hover:opacity-100"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            ) : null}

            {/* En-tête texte */}
            <div className="text-center">
              <p className="text-sm font-semibold tracking-[0.42em] text-gray-400">
                {headerLabel}
              </p>
              <h2 className="mt-2 text-xl font-bold text-gray-900">{title}</h2>
              <p className={`mt-4 text-[13px] font-semibold tracking-wide ${noticeClass} px-2`}>
                {notice}
              </p>
              {hintText ? (
                <p className="mt-2 text-xs text-gray-500">{hintText}</p>
              ) : null}
            </div>

            {/* ── Bloc N° commande + QR (compact) ── */}
            <div className="mt-5 rounded-2xl bg-white/90 p-3 border border-amber-50">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[0.6rem] uppercase tracking-[0.3em] text-gray-400">N° Commande</p>
                  <p className="mt-0.5 text-sm font-bold tracking-tight text-gray-900 break-all leading-snug">
                    {orderNumber}
                  </p>
                </div>
                <div className="flex-shrink-0 rounded-xl bg-white p-1.5 border border-gray-100 shadow-sm">
                  <QRCodeCanvas
                    value={orderNumber}
                    size={64}
                    bgColor="#ffffff"
                    fgColor="#0f172a"
                    includeMargin={false}
                  />
                </div>
              </div>
            </div>

            {/* ── Liste des articles ── */}
            <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm border border-gray-50">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400 mb-3">
                Articles commandés
              </p>
              <div className="space-y-3">
                {articleList.map((item, idx) => {
                  const resolvedImg = item.imageUrl ? resolveImageUrl(item.imageUrl) : ''
                  const variantLabel = item.variantName?.trim() || 'Modèle'
                  const variantVal = item.variantValue?.trim() || '—'
                  return (
                    <div key={idx} className="flex items-start gap-3">
                      {resolvedImg ? (
                        <img
                          src={resolvedImg}
                          alt={item.productName}
                          className="h-14 w-14 flex-shrink-0 rounded-xl object-contain bg-gray-50/80 p-1 border border-gray-100"
                        />
                      ) : (
                        <div className="h-14 w-14 flex-shrink-0 rounded-xl bg-gray-100 border border-gray-100" />
                      )}
                      <div className="min-w-0 flex-1 text-sm">
                        <p className="font-bold text-gray-900 leading-tight text-[13px]">
                          {item.productName}
                        </p>
                        <p className="mt-0.5 text-[11px] text-gray-500">
                          {variantLabel} :{' '}
                          <span className="font-semibold text-gray-800">{variantVal}</span>
                        </p>
                        {item.sku?.trim() ? (
                          <p className="mt-0.5 text-[10px] text-gray-400">
                            SKU : <span className="font-medium">{item.sku}</span>
                          </p>
                        ) : null}
                      </div>
                      {(item.quantity ?? 1) > 1 && (
                        <span className="flex-shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600">
                          ×{item.quantity}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ── Récapitulatif financier (séparé de la liste articles) ── */}
            <div className="mt-3 rounded-2xl bg-white p-4 shadow-sm border border-gray-50">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400 mb-3">
                Récapitulatif
              </p>
              <div className="space-y-1.5">
                {subtotal != null && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Sous-total</span>
                    <span className="font-semibold text-gray-800">{formatPrice(subtotal)}</span>
                  </div>
                )}
                {shippingTotal != null && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Livraison</span>
                    <span className="font-semibold text-gray-800">
                      {shippingTotal > 0 ? formatPrice(shippingTotal) : 'Inclus'}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">TVA</span>
                  <span className="font-semibold text-gray-800">0 %</span>
                </div>
                <div className="flex justify-between items-center pt-2 mt-1 border-t border-gray-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-900">
                    Total {noticeTone === 'success' ? 'Payé' : 'À régler'}
                  </span>
                  <span className="text-sm font-black text-gray-900">{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            {/* ── Informations de livraison ── */}
            {(trackingNumber || status === 'shipped') && (
              <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm border border-emerald-50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-400" />
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-600 mb-3">
                  Informations de Livraison
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Statut</span>
                    <span className="font-semibold text-emerald-700">📦 Expédié</span>
                  </div>
                  {logisticName && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Transporteur</span>
                      <span className="font-semibold text-gray-900">{logisticName}</span>
                    </div>
                  )}
                  {trackingNumber && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">N° de Suivi</span>
                      <span className="font-mono font-medium text-gray-800 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                        {trackingNumber}
                      </span>
                    </div>
                  )}
                  {deliveryTimeEstimation && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Délai estimé</span>
                      <span className="font-medium text-gray-900">{deliveryTimeEstimation}</span>
                    </div>
                  )}
                </div>
                {trackingUrl && (
                  <a
                    href={trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex w-full items-center justify-center rounded-xl bg-gray-900 px-4 py-3 text-xs font-bold tracking-wide text-white shadow-md transition-all hover:bg-gray-800 hover:-translate-y-0.5"
                  >
                    Suivre mon colis
                  </a>
                )}
              </div>
            )}

            {/* ── Séparateur décoratif ── */}
            <div className="relative mt-6">
              <div className="absolute -left-3 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-[#f5f0e8]" />
              <div className="absolute -right-3 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-[#f5f0e8]" />
              <div className="border-t border-dashed border-amber-200" />
            </div>

            <div className="mt-5 text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Client</p>
              <p className="mt-1 font-semibold text-sm text-gray-800">{customerName || '—'}</p>
            </div>
          </div>

          {/* ── CTAs ── */}
          <div className="mt-6 space-y-3">
            {onContinueShopping ? (
              <button
                type="button"
                onClick={onContinueShopping}
                className="flex w-full items-center justify-center rounded-xl bg-gray-900 px-4 py-4 text-sm font-bold tracking-wide text-white shadow-lg transition-all hover:bg-gray-800 hover:-translate-y-0.5"
              >
                Continuer mes achats
              </button>
            ) : null}
            <div className="flex w-full items-center justify-center rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs font-medium text-gray-500 shadow-inner">
              📝 Votre facture vous a été envoyée par e-mail.
            </div>
          </div>

          {/* Link: Retour Boutique (Remplace l'ancienne action Destructrice onPayByCard) */}
          <a
            href="/catalogue"
            className="mt-4 flex w-full items-center justify-center rounded-xl bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-600 shadow-sm transition hover:bg-orange-100"
          >
            ← Retour à la boutique
          </a>
        </div>
      </aside>
    </div>
  )
}

export default OrderTicketModal
