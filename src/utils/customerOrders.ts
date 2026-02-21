export type StoredOrder = {
  id: string
  orderNumber: string
  total: number
  productName: string
  variantName?: string | null
  variantValue?: string | null
  imageUrl?: string | null
  customerName?: string | null
  createdAt: string
}

const STORAGE_KEY = 'koktek_customer_orders_v1'

const normalizeEmail = (email: string) => email.trim().toLowerCase()

const readAllOrders = (): Record<string, StoredOrder[]> => {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as Record<string, StoredOrder[]>
  } catch {
    return {}
  }
}

const writeAllOrders = (data: Record<string, StoredOrder[]>) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export const getOrdersForEmail = (email: string): StoredOrder[] => {
  const key = normalizeEmail(email)
  if (!key) return []
  const all = readAllOrders()
  const orders = Array.isArray(all[key]) ? all[key] : []
  return [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export const saveOrderForEmail = (email: string, order: StoredOrder) => {
  const key = normalizeEmail(email)
  if (!key) return
  const all = readAllOrders()
  const current = Array.isArray(all[key]) ? all[key] : []
  const existingIndex = current.findIndex(
    (item) =>
      item.id === order.id || item.orderNumber === order.orderNumber,
  )
  if (existingIndex >= 0) {
    current[existingIndex] = { ...current[existingIndex], ...order }
  } else {
    current.push(order)
  }
  all[key] = current
  writeAllOrders(all)
}
