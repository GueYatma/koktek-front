import { useRef } from 'react'
import { X } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import { formatPrice } from '../utils/format'
import { resolveImageUrl } from '../utils/image'

type OrderTicketModalProps = {
  open: boolean
  orderNumber: string
  productName: string
  variantName?: string | null
  variantValue?: string | null
  sku?: string | null
  imageUrl?: string | null
  customerName?: string | null
  total: number
  subtotal?: number // NOUVEAU
  shippingTotal?: number // NOUVEAU
  noticeText?: string
  hintText?: string
  headerLabel?: string
  title?: string
  noticeTone?: 'danger' | 'success'
  onClose?: () => void
  onNavigateToProfile?: () => void
  showPayByCard?: boolean
  onPayByCard?: () => void
  payByCardLabel?: string
  onContinueShopping?: () => void // NOUVEAU CTA
}

const OrderTicketModal = ({
  open,
  orderNumber,
  productName,
  variantName,
  variantValue,
  sku,
  imageUrl,
  customerName,
  total,
  subtotal,
  shippingTotal,
  noticeText,
  hintText,
  headerLabel = 'BON DE COMMANDE',
  title = 'Commande Réservée !',
  noticeTone = 'danger',
  onClose,
  onNavigateToProfile,
  showPayByCard = false,
  onPayByCard,
  payByCardLabel = 'Finalement, je paie par carte',
  onContinueShopping,
}: OrderTicketModalProps) => {
  const ticketRef = useRef<HTMLDivElement | null>(null)
  const resolvedImageUrl = imageUrl ? resolveImageUrl(imageUrl) : ''
  const variantLabel = variantName?.trim() || 'Modèle / Variante'
  const variantValueLabel = variantValue?.trim() || '—'
  const skuLabel = sku?.trim()
  
  // Rendre le message de succès explicite si noticeTone === 'success'
  const defaultNotice = noticeTone === 'success' 
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
            <div className="text-center">
              <p className="text-sm font-semibold tracking-[0.42em] text-gray-400">
                {headerLabel}
              </p>
              <h2 className="mt-2 text-xl font-bold text-gray-900">
                {title}
              </h2>
              <p
                className={`mt-4 text-[13px] font-semibold tracking-wide ${noticeClass} px-2`}
              >
                {notice}
              </p>
              {hintText ? (
                <p className="mt-2 text-xs text-gray-500">{hintText}</p>
              ) : null}
            </div>

            <div className="mt-6 rounded-2xl bg-white/90 p-4 border border-amber-50">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                <div className="w-full text-center sm:text-left">
                  <p className="text-[0.65rem] uppercase tracking-[0.3em] text-gray-400">
                    N° Commande
                  </p>
                  <p className="mt-1 whitespace-nowrap text-lg font-bold tracking-[0.14em] text-gray-900">
                    {orderNumber}
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-2 border border-gray-100 shadow-sm">
                  <QRCodeCanvas
                    value={orderNumber}
                    size={100}
                    bgColor="#ffffff"
                    fgColor="#0f172a"
                    includeMargin
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-4 rounded-2xl bg-white p-4 shadow-sm border border-gray-50">
              {resolvedImageUrl ? (
                <img
                  src={resolvedImageUrl}
                  alt={productName}
                  className="h-24 w-24 flex-shrink-0 rounded-xl object-contain bg-gray-50/50 p-1 border border-gray-100"
                />
              ) : null}
              <div className="min-w-0 flex-1 text-sm text-gray-600">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400">
                  Détails Article
                </p>
                <p className="mt-2 text-sm font-bold text-gray-900 leading-tight">
                  {productName}
                </p>
                <p className="mt-1.5 text-[11px] text-gray-500 font-medium">
                  {variantLabel} : <span className="font-bold text-gray-800">{variantValueLabel}</span>
                </p>
                {skuLabel ? (
                  <p className="mt-1 text-[11px] text-gray-500">
                    SKU : <span className="font-semibold text-gray-700">{skuLabel}</span>
                  </p>
                ) : null}
                
                {/* --- NOUVEAU BLOC PRIX COHÉRENT --- */}
                <div className="mt-4 border-t border-gray-100 pt-3 space-y-1.5">
                  {(subtotal != null) && (
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-gray-500">Sous-total article</span>
                       <span className="font-semibold text-gray-800">{formatPrice(subtotal)}</span>
                    </div>
                  )}
                  {(shippingTotal != null) && (
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-gray-500">Livraison</span>
                       <span className="font-semibold text-gray-800">
                         {shippingTotal > 0 ? formatPrice(shippingTotal) : 'Inclus'}
                       </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1.5 mt-1 border-t border-gray-100">
                     <span className="text-[11px] font-bold uppercase tracking-wider text-gray-900">Total Payé</span>
                     <span className="text-sm font-black text-gray-900">{formatPrice(total)}</span>
                  </div>
                </div>

              </div>
            </div>

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

          {/* --- NOUVEAU MENU MARKETING POST-PAIEMENT --- */}
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

            <button
              type="button"
              onClick={onNavigateToProfile}
              className="flex w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-xs font-semibold text-gray-500 shadow-sm transition hover:bg-gray-50 hover:text-gray-800"
            >
              Retrouvez votre facture dans votre espace client
            </button>
          </div>

          {showPayByCard ? (
            <button
              type="button"
              onClick={onPayByCard}
              className="mt-4 w-full rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-orange-500"
            >
              {payByCardLabel}
            </button>
          ) : null}
        </div>
      </aside>
    </div>
  )
}

export default OrderTicketModal
