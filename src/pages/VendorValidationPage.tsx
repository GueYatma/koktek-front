import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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
  const [searchParams] = useSearchParams()
  const orderParam = useMemo(
    () => searchParams.get('order')?.trim() ?? '',
    [searchParams],
  )

  const [order, setOrder] = useState<OrderFullDetails | null>(null)
  const [productMap, setProductMap] = useState<Record<string, ProductSummary>>(
    {},
  )
  const [isLoading, setIsLoading] = useState(true)
  const [isPaying, setIsPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    let isActive = true

    const fetchOrder = async () => {
      if (!orderParam) {
        setError('Aucune commande fournie dans l’URL.')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const details = await getOrderFullDetails(orderParam)
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
  }, [orderParam])

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

  const totalAmount = useMemo(() => {
    if (!order) return 0
    if (typeof order.total === 'number') return order.total
    return lineItems.reduce(
      (sum, item) => sum + (item.line_total ?? item.unit_price ?? 0),
      0,
    )
  }, [order, lineItems])

  const resolveProductInfo = (item: OrderItemRecord) => {
    const productFromRelation = extractProductSummary(
      item.product_id as unknown,
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
    doc.text(`Total: ${formatPrice(totalAmount)}`, margin, y)
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

  if (isLoading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center text-gray-600">
        Chargement de la commande...
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center text-red-600">
        {error}
      </div>
    )
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center text-gray-600">
        Commande introuvable.
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Validation vendeur
        </h1>
        <p className="mt-2 text-sm text-gray-500">
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
            <p className="text-xs uppercase text-gray-400">Total à encaisser</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {formatPrice(totalAmount)}
            </p>
            <p className="text-sm text-gray-500">
              Paiement attendu en espèces
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {lineItems.map((item) => {
            const productInfo = resolveProductInfo(item)
            return (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4"
              >
                <img
                  src={productInfo.imageUrl}
                  alt={productInfo.title}
                  className="h-16 w-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {productInfo.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    Quantité: {item.quantity}
                  </p>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {formatPrice(item.line_total ?? item.unit_price ?? 0)}
                </span>
              </div>
            )
          })}
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
            {isPaying ? 'Validation en cours...' : "J'ai reçu l'argent en espèces"}
          </button>
        )}
      </div>
    </div>
  )
}

export default VendorValidationPage
