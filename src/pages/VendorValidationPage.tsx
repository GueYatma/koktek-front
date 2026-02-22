import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { jsPDF } from 'jspdf'
import { DIRECTUS_BASE_URL } from '../utils/directus'
import { formatPrice } from '../utils/format'
import { resolveImageUrl } from '../utils/image'
import {
  getOrderFullDetails,
  markOrderPaid,
  type CustomerRecord,
  type OrderFullDetails,
  type OrderItemRecord,
} from '../lib/commerceApi'

const DIRECTUS_TOKEN = import.meta.env.VITE_DIRECTUS_TOKEN as
  | string
  | undefined

type ProductSummary = {
  id: string
  title: string
  image_url?: string
}

type VariantSummary = {
  id: string
  sku?: string
  option1_name?: string
  option1_value?: string
}

const buildHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (DIRECTUS_TOKEN) {
    headers.Authorization = `Bearer ${DIRECTUS_TOKEN}`
  }
  return headers
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

const extractProductSummary = (value: unknown): ProductSummary | null => {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const id = normalizeId(record.id)
  if (!id) return null
  const title =
    String(record.title ?? record.name ?? '').trim() || `Produit ${id}`
  const image_url = String(
    record.image_url ?? record.image ?? record.imageUrl ?? '',
  ).trim()
  return { id, title, image_url }
}

const extractVariantSummary = (value: unknown): VariantSummary | null => {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const id = normalizeId(record.id)
  if (!id) return null
  const sku = String(record.sku ?? '').trim()
  const option1_name = String(record.option1_name ?? record.option_name ?? '').trim()
  const option1_value = String(record.option1_value ?? record.option_value ?? '').trim()
  return { id, sku, option1_name, option1_value }
}

const fetchProductSummaries = async (ids: string[]) => {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)))
  if (uniqueIds.length === 0) return {} as Record<string, ProductSummary>

  const params = new URLSearchParams()
  params.set('filter[id][_in]', uniqueIds.join(','))
  params.set('fields', 'id,title,name,image_url,image,imageUrl')

  const response = await fetch(
    `${DIRECTUS_BASE_URL}/items/products?${params.toString()}`,
    {
      headers: buildHeaders(),
    },
  )

  if (!response.ok) {
    throw new Error('Impossible de récupérer les produits.')
  }

  const payload = (await response.json()) as {
    data?: Array<Record<string, unknown>>
  }

  const map: Record<string, ProductSummary> = {}
  ;(payload.data ?? []).forEach((row) => {
    const summary = extractProductSummary(row)
    if (summary) {
      map[summary.id] = summary
    }
  })

  return map
}

const loadImageAsDataUrl = async (url: string) => {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const blob = await response.blob()

    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error('Image load failed'))
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

const VendorValidationPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const orderParam = useMemo(
    () => searchParams.get('order')?.trim() ?? '',
    [searchParams],
  )

  const [searchInput, setSearchInput] = useState(orderParam)
  const [activeQuery, setActiveQuery] = useState(orderParam)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [scannerError, setScannerError] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanSuccess, setScanSuccess] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const scanFeedbackTimer = useRef<number | null>(null)

  const [order, setOrder] = useState<OrderFullDetails | null>(null)
  const [productMap, setProductMap] = useState<Record<string, ProductSummary>>(
    {},
  )
  const [isLoading, setIsLoading] = useState(true)
  const [isPaying, setIsPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    setSearchInput(orderParam)
    setActiveQuery(orderParam)
  }, [orderParam])

  const extractOrderValue = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return ''
    try {
      const url = new URL(trimmed)
      const param = url.searchParams.get('order')
      return param?.trim() || trimmed
    } catch {
      return trimmed
    }
  }

  const resolveOrderId = async (value: string) => {
    const normalized = value.trim()
    if (!normalized) return ''
    if (!/^KOK-/i.test(normalized)) return normalized

    const params = new URLSearchParams()
    params.set('filter[order_number][_eq]', normalized)
    params.set('fields', 'id')
    params.set('limit', '1')

    const response = await fetch(
      `${DIRECTUS_BASE_URL}/items/orders?${params.toString()}`,
      {
        headers: buildHeaders(),
      },
    )

    if (!response.ok) {
      throw new Error('Impossible de récupérer la commande.')
    }

    const payload = (await response.json()) as {
      data?: Array<{ id?: string }>
    }
    return payload.data?.[0]?.id ?? ''
  }

  const handleSearch = (value: string) => {
    const next = extractOrderValue(value)
    if (!next) {
      setError('Saisissez un identifiant ou numéro de commande.')
      setOrder(null)
      setProductMap({})
      setSuccess(false)
      return
    }
    setError(null)
    setSuccess(false)
    setSearchInput(next)
    setActiveQuery(next)
    setSearchParams({ order: next })
  }

  useEffect(() => {
    let isActive = true

    const fetchOrder = async () => {
      if (!activeQuery) {
        setIsLoading(false)
        setOrder(null)
        setProductMap({})
        return
      }

      setIsLoading(true)
      setError(null)
      setSuccess(false)

      try {
        const resolvedId = await resolveOrderId(activeQuery)
        if (!resolvedId) {
          throw new Error('Commande introuvable.')
        }

        const details = await getOrderFullDetails(resolvedId)
        if (!isActive) return

        setOrder(details)

        const itemIds = (details.order_items ?? [])
          .map((item) => normalizeId(item.product_id as unknown))
          .filter(Boolean)

        if (itemIds.length > 0) {
          const summaries = await fetchProductSummaries(itemIds)
          if (isActive) {
            setProductMap(summaries)
          }
        }
      } catch (fetchError) {
        console.error('Erreur chargement commande', fetchError)
        if (isActive) {
          setError("Impossible de charger la commande.")
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void fetchOrder()

    return () => {
      isActive = false
    }
  }, [activeQuery])

  const closeScanner = () => {
    setIsScannerOpen(false)
    setScannerError(null)
    setIsScanning(false)
    setScanSuccess(false)
    if (scanFeedbackTimer.current) {
      window.clearTimeout(scanFeedbackTimer.current)
      scanFeedbackTimer.current = null
    }
  }

  useEffect(() => {
    if (!isScannerOpen) return
    let isActive = true
    setScannerError(null)
    setIsScanning(false)
    setScanSuccess(false)

    const playScanBeep = () => {
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as typeof window & { webkitAudioContext?: typeof window.AudioContext })
            .webkitAudioContext
        if (!AudioCtx) return
        const ctx = new AudioCtx()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = 880
        gain.gain.value = 0.08
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + 0.12)
        osc.onended = () => {
          ctx.close().catch(() => null)
        }
      } catch {
        // Ignore les erreurs audio.
      }
    }

    const scanner = new Html5Qrcode('qr-reader')
    scannerRef.current = scanner

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (decodedText) => {
          if (!isActive) return
          const nextValue = extractOrderValue(decodedText)
          setSearchInput(nextValue)
          setActiveQuery(nextValue)
          setSearchParams({ order: nextValue })
          setSuccess(false)
          setError(null)
          setIsScanning(false)
          setScanSuccess(true)
          if (scanFeedbackTimer.current) {
            window.clearTimeout(scanFeedbackTimer.current)
          }
          scanFeedbackTimer.current = window.setTimeout(() => {
            setScanSuccess(false)
          }, 600)
          playScanBeep()
          if (navigator.vibrate) {
            navigator.vibrate(120)
          }

          await scanner
            .stop()
            .catch(() => null)
            .finally(() => {
              scanner.clear()
            })
          scannerRef.current = null
          setIsScannerOpen(false)
        },
        () => null,
      )
      .then(() => {
        if (isActive) {
          setIsScanning(true)
        }
      })
      .catch((scanError) => {
        console.error('Erreur scanner QR', scanError)
        if (isActive) {
          setScannerError(
            "Accès caméra refusé ou indisponible. Vérifiez les permissions.",
          )
          setIsScanning(false)
        }
      })

    return () => {
      isActive = false
      setIsScanning(false)
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => null)
          .finally(() => {
            scannerRef.current?.clear()
            scannerRef.current = null
          })
      }
      if (scanFeedbackTimer.current) {
        window.clearTimeout(scanFeedbackTimer.current)
        scanFeedbackTimer.current = null
      }
    }
  }, [isScannerOpen, setSearchParams])

  const customer = useMemo(() => {
    if (!order) return null
    if (order.customer_id && typeof order.customer_id === 'object') {
      return order.customer_id as CustomerRecord
    }
    return null
  }, [order])

  const delivery = order?.order_delivery ?? null

  const lineItems = useMemo<OrderItemRecord[]>(
    () => order?.order_items ?? [],
    [order],
  )

  const totals = useMemo(() => {
    if (!order) {
      return { subtotal: 0, shipping: 0, total: 0 }
    }
    const subtotal =
      typeof order.total_products_price === 'number'
        ? order.total_products_price
        : typeof order.subtotal === 'number'
          ? order.subtotal
          : lineItems.reduce((sum, item) => {
              const unit = item.unit_price ?? 0
              const line = item.line_total ?? unit * item.quantity
              return sum + line
            }, 0)
    const shipping =
      typeof order.shipping_price === 'number' ? order.shipping_price : 0
    const total =
      typeof order.total_price === 'number'
        ? order.total_price
        : typeof order.total === 'number'
          ? order.total
          : subtotal + shipping
    return { subtotal, shipping, total }
  }, [order, lineItems])

  const resolveProductInfo = (item: OrderItemRecord) => {
    const productFromRelation = extractProductSummary(
      item.product_id as unknown,
    )
    const variantFromRelation = extractVariantSummary(
      item.variant_id as unknown,
    )
    const productId = normalizeId(item.product_id as unknown)
    const fallback = productId ? productMap[productId] : undefined

    return {
      id: productId,
      title:
        productFromRelation?.title ??
        fallback?.title ??
        `Produit ${productId || ''}`,
      imageUrl: resolveImageUrl(
        productFromRelation?.image_url ?? fallback?.image_url ?? '',
      ),
      variant: variantFromRelation,
    }
  }

  const handleSharePdf = async (doc: jsPDF, fileName: string) => {
    const pdfBlob = doc.output('blob')
    const file = new File([pdfBlob], fileName, { type: 'application/pdf' })

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'Reçu de commande',
        text: 'Reçu de commande Koktek',
      })
      return
    }

    const url = URL.createObjectURL(pdfBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)
  }

  const generateReceiptPdf = async () => {
    if (!order) return

    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 40
    let y = margin

    // En-tête du reçu
    doc.setFontSize(18)
    doc.text(`Reçu commande ${order.id}`, margin, y)
    y += 28

    doc.setFontSize(12)
    doc.text(`Total: ${formatPrice(totals.total)}`, margin, y)
    y += 18

    doc.text('Payé en espèces', margin, y)
    y += 28

    // Boucle sur les articles pour inclure l’image + détails
    for (const item of lineItems) {
      const productInfo = resolveProductInfo(item)
      const imageUrl = productInfo.imageUrl

      // Traitement des images: on convertit l’URL en DataURL pour l’injecter dans le PDF.
      if (imageUrl) {
        const dataUrl = await loadImageAsDataUrl(imageUrl)
        if (dataUrl) {
          doc.addImage(dataUrl, 'JPEG', margin, y, 60, 60)
        }
      }

      doc.setFontSize(11)
      doc.text(productInfo.title, margin + 72, y + 16)
      doc.text(
        `Qté: ${item.quantity} • Prix: ${formatPrice(
          item.unit_price ?? 0,
        )}`,
        margin + 72,
        y + 34,
      )

      y += 80

      if (y > pageHeight - margin) {
        doc.addPage()
        y = margin
      }
    }

    const fileName = `recu-commande-${order.id}.pdf`
    await handleSharePdf(doc, fileName)
  }

  const handleCashReceived = async () => {
    if (!order || isPaying) return

    setIsPaying(true)
    setError(null)

    try {
      await markOrderPaid(order.id, {
        status: 'paid',
        payment_status: 'paid',
        payment_reference: 'cash',
      })

      await generateReceiptPdf()

      setSuccess(true)
    } catch (payError) {
      console.error('Erreur validation espèces', payError)
      setError("Impossible de valider la commande pour l'instant.")
    } finally {
      setIsPaying(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Validation vendeur
        </h1>
        <div className="mt-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
            Rechercher une commande
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  handleSearch(searchInput)
                }
              }}
              placeholder="ID ou numéro de commande (ex: KOK-...)"
              className="w-full flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handleSearch(searchInput)}
              className="rounded-xl border border-gray-200 bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-black"
            >
              Rechercher
            </button>
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-300"
              aria-label="Scanner un QR code"
            >
              📷
            </button>
          </div>
        </div>

        {isLoading ? (
          <p className="mt-6 text-sm text-gray-500">
            Chargement de la commande...
          </p>
        ) : error ? (
          <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : !order ? (
          <p className="mt-6 text-sm text-gray-500">
            Aucune commande trouvée. Scannez un QR code ou saisissez un numéro.
          </p>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700">
                Statut: {order.status ?? '—'}
              </span>
              <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700">
                Paiement: {order.payment_status ?? '—'}
              </span>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Commande : <span className="font-medium">{order.id}</span>
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs uppercase text-gray-400">Client</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {customer?.name ?? delivery?.recipient_name ?? 'Client'}
                </p>
                <p className="text-sm text-gray-500">
                  {customer?.email ?? delivery?.email ?? 'Email non renseigné'}
                </p>
                <p className="text-sm text-gray-500">
                  {customer?.phone ?? delivery?.phone ?? 'Téléphone non renseigné'}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs uppercase text-gray-400">
                  Statut de la commande
                </p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {order.status ?? '—'}
                </p>
                <p className="text-sm text-gray-500">
                  Paiement: {order.payment_status ?? '—'}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {lineItems.map((item) => {
                const productInfo = resolveProductInfo(item)
                const variantLabel =
                  productInfo.variant?.option1_name || 'Variante'
                const variantValue =
                  productInfo.variant?.option1_value || '—'
                const unitPrice = item.unit_price ?? 0
                const lineTotal = item.line_total ?? unitPrice * item.quantity
                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-gray-200 bg-white p-4"
                  >
                    <div className="flex gap-4">
                      <img
                        src={productInfo.imageUrl}
                        alt={productInfo.title}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {productInfo.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {variantLabel}: {variantValue}
                        </p>
                        <p className="text-xs text-gray-500">
                          SKU:{' '}
                          <span className="font-semibold text-gray-900">
                            {productInfo.variant?.sku || '—'}
                          </span>
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                          <span>Quantité: {item.quantity}</span>
                          <span>
                            Prix unitaire:{' '}
                            {formatPrice(unitPrice)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Total ligne</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatPrice(lineTotal)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs uppercase text-gray-400">Total</p>
              <div className="mt-3 space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Sous-total articles</span>
                  <span className="font-semibold text-gray-900">
                    {formatPrice(totals.subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Frais de livraison</span>
                  <span className="font-semibold text-gray-900">
                    {formatPrice(totals.shipping)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-base font-semibold text-gray-900">
                  <span>Total à encaisser</span>
                  <span>{formatPrice(totals.total)}</span>
                </div>
              </div>
            </div>

            {success ? (
              <p className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Paiement confirmé et reçu généré.
              </p>
            ) : (
              <button
                type="button"
                onClick={handleCashReceived}
                disabled={isPaying}
                className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-4 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPaying
                  ? 'Validation en cours...'
                  : "J'ai reçu l'argent en espèces"}
              </button>
            )}
          </>
        )}
      </div>

      {isScannerOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeScanner}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">
              Scanner le QR code
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Autorisez la caméra pour scanner le bon de commande.
            </p>
            <div
              className={`mt-4 overflow-hidden rounded-xl border transition ${
                scanSuccess
                  ? 'border-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]'
                  : 'border-gray-200'
              }`}
            >
              <div id="qr-reader" className="bg-black/5" />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
              <span>{isScanning ? 'Scan en cours...' : 'Initialisation...'}</span>
              <span className="inline-flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    isScanning ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'
                  }`}
                />
                {isScanning ? 'Caméra active' : 'Caméra prête'}
              </span>
            </div>
            {scannerError ? (
              <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                {scannerError}
              </p>
            ) : null}
            <button
              type="button"
              onClick={closeScanner}
              className="mt-4 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-300"
            >
              Fermer
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default VendorValidationPage
