import { useRef } from 'react'
import { X } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import { jsPDF } from 'jspdf'
import { toPng } from 'html-to-image'
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

  const buildTicketPng = async () => {
    if (!ticketRef.current) return null
    try {
      return await toPng(ticketRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#fffaf4',
      })
    } catch (error) {
      console.error('Erreur génération ticket PNG', error)
      return null
    }
  }

  const buildTicketPdf = async (pngDataUrl: string) => {
    const img = new Image()
    img.src = pngDataUrl
    await img.decode()

    const doc = new jsPDF({
      orientation: img.width > img.height ? 'l' : 'p',
      unit: 'px',
      format: [img.width, img.height],
      compress: true,
      hotfixes: ['px_scaling'],
    })
    doc.addImage(pngDataUrl, 'PNG', 0, 0, img.width, img.height)
    return doc
  }

  const handleDownloadTicket = async () => {
    if (!orderNumber) return
    const pngDataUrl = await buildTicketPng()
    if (!pngDataUrl) return

    const doc = await buildTicketPdf(pngDataUrl)
    doc.save(`bon-commande-${orderNumber}.pdf`)
  }

  const handleShareTicket = async () => {
    if (!orderNumber) return
    const pngDataUrl = await buildTicketPng()
    if (!pngDataUrl) return

    const pngBlob = await (await fetch(pngDataUrl)).blob()
    const pngFile = new File([pngBlob], `bon-commande-${orderNumber}.png`, {
      type: pngBlob.type || 'image/png',
    })

    if (navigator.share && navigator.canShare?.({ files: [pngFile] })) {
      try {
        await navigator.share({
          title: 'Bon de commande Koktek',
          files: [pngFile],
        })
      } catch {
        // Ignore les annulations utilisateur.
      }
      return
    }

    const link = document.createElement('a')
    link.href = pngDataUrl
    link.download = `bon-commande-${orderNumber}.png`
    link.click()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-8"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/45"
        aria-hidden="true"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm sm:max-w-md">
        <div
          ref={ticketRef}
          className="rounded-3xl border border-amber-100/80 bg-[#fffaf4] px-5 py-6 shadow-xl"
          onClick={(event) => event.stopPropagation()}
        >
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-amber-100/60 bg-white text-gray-500 transition hover:text-gray-900"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
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
                <p className="mt-1 text-base font-semibold tracking-[0.14em] text-gray-900 whitespace-nowrap">
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
                  SKU : <span className="font-semibold text-gray-900">{skuLabel}</span>
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

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleDownloadTicket}
            className="flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:text-gray-900"
          >
            📥 Télécharger le bon
          </button>
          <button
            type="button"
            onClick={handleShareTicket}
            className="flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:text-gray-900"
          >
            📲 Partager
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
    </div>
  )
}

export default OrderTicketModal
