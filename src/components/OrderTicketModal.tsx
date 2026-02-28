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
}: OrderTicketModalProps) => {
  const ticketRef = useRef<HTMLDivElement | null>(null)
  const resolvedImageUrl = imageUrl ? resolveImageUrl(imageUrl) : ''
  const variantLabel = variantName?.trim() || 'Modèle / Variante'
  const variantValueLabel = variantValue?.trim() || '—'
  const skuLabel = sku?.trim()
  const notice =
    noticeText ??
    'Votre commande sera préparée uniquement après réception de votre paiement en espèces dans notre boutique à Marseille.'
  const noticeClass =
    noticeTone === 'success' ? 'text-emerald-600' : 'text-red-600'



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
              <p className="text-sm font-semibold tracking-[0.42em] text-gray-500">
                {headerLabel}
              </p>
              <h2 className="mt-2 text-xl font-semibold text-gray-900">
                {title}
              </h2>
              <p
                className={`mt-3 text-sm font-semibold leading-relaxed ${noticeClass}`}
              >
                {notice}
              </p>
              {hintText ? (
                <p className="mt-2 text-xs text-gray-500">{hintText}</p>
              ) : null}
            </div>

            <div className="mt-5 rounded-2xl bg-white/90 p-4">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                <div className="w-full text-center sm:text-left">
                  <p className="text-[0.65rem] uppercase tracking-[0.3em] text-gray-400">
                    Numéro de commande
                  </p>
                  <p className="mt-1 whitespace-nowrap text-base font-semibold tracking-[0.14em] text-gray-900">
                    {orderNumber}
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-2 shadow-sm">
                  <QRCodeCanvas
                    value={orderNumber}
                    size={110}
                    bgColor="#ffffff"
                    fgColor="#0f172a"
                    includeMargin
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-3 rounded-2xl bg-white p-3 shadow-sm">
              {resolvedImageUrl ? (
                <img
                  src={resolvedImageUrl}
                  alt={productName}
                  className="h-20 w-20 flex-shrink-0 rounded-xl object-contain bg-white"
                />
              ) : null}
              <div className="min-w-0 flex-1 text-sm text-gray-600">
                <p className="text-xs uppercase tracking-[0.25em] text-gray-400">
                  Détails
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {productName}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {variantLabel} :{' '}
                  <span className="font-semibold text-gray-900">
                    {variantValueLabel}
                  </span>
                </p>
                {skuLabel ? (
                  <p className="mt-1 text-xs text-gray-500">
                    SKU :{' '}
                    <span className="font-semibold text-gray-900">
                      {skuLabel}
                    </span>
                  </p>
                ) : null}
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-400">Total</p>
                    <p className="font-semibold text-gray-900">
                      {formatPrice(total)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Client</p>
                    <p className="font-semibold text-gray-900">
                      {customerName || '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative mt-5">
              <div className="absolute -left-3 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-[#f5f0e8]" />
              <div className="absolute -right-3 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-[#f5f0e8]" />
              <div className="border-t border-dashed border-amber-200" />
            </div>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={onNavigateToProfile}
              className="flex w-full items-center justify-center rounded-xl bg-gray-900 px-4 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-gray-800"
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
