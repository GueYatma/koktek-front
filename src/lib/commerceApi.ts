import { createDirectus, readItem, readItems, rest, staticToken } from '@directus/sdk'
import { DIRECTUS_BASE_URL } from '../utils/directus'

const DIRECTUS_TOKEN = import.meta.env.VITE_DIRECTUS_TOKEN as
  | string
  | undefined

const directusClient = DIRECTUS_TOKEN
  ? createDirectus(DIRECTUS_BASE_URL)
      .with(staticToken(DIRECTUS_TOKEN))
      .with(rest())
  : createDirectus(DIRECTUS_BASE_URL).with(rest())

const orderDetailFields: string[] = [
  '*',
  'customer_id.*',
]

type DirectusItemResponse<T> = {
  data: T
}

type DirectusListResponse<T> = {
  data: T[]
}

type DirectusError = {
  errors?: { message?: string }[]
}

export type CartRecord = {
  id: string
  status?: string
  currency?: string
  created_at?: string
  updated_at?: string
}

export type CartItemRecord = {
  id: string
  cart_id: string
  product_id: string
  variant_id: string | null
  quantity: number
  unit_price?: number | null
  currency?: string
  created_at?: string
  updated_at?: string
}

export type OrderRecord = {
  id: string
  order_number?: string | null
  cart_id?: string | null
  customer_id?: string | CustomerRecord | null
  status?: string
  payment_status?: string | null
  payment_method?: string | null
  currency?: string
  total?: number | null
  total_price?: number | null
  total_products_price?: number | null
  shipping_price?: number | null
  shipping_address?: Record<string, unknown> | string | null
  logistic_name?: string | null
  tracking_number?: string | null
  tracking_url?: string | null
  delivery_time_estimation?: string | null
  item_count?: number | null
  created_at?: string
  updated_at?: string
}

export type OrderFullDetails = Omit<OrderRecord, 'customer_id'> & {
  customer_id?: CustomerRecord | string | null
  order_items?: OrderItemRecord[]
  order_delivery?: OrderDeliveryRecord | null
}

export type OrderItemRecord = {
  id: string
  order_id: string
  product_id: string | Record<string, unknown>
  variant_id: string | Record<string, unknown> | null
  quantity: number
  unit_price?: number | null
  line_total?: number | null
  currency?: string
  created_at?: string
  updated_at?: string
}

export type OrderDeliveryRecord = {
  id: string
  order_id: string
  status?: string
  recipient_name: string
  email: string
  phone?: string | null
  address_line1: string
  address_line2?: string | null
  postal_code: string
  city: string
  region?: string | null
  country: string
  delivery_method?: string | null
  carrier?: string | null
  tracking_number?: string | null
  shipped_at?: string | null
  delivered_at?: string | null
  created_at?: string
  updated_at?: string
}

export type VariantCostRecord = {
  id: string
  product_id?: string | null
  sku?: string | null
  price?: number | null
  cost_price?: number | null
}

export type OrderBillingRecord = {
  id: string
  order_id: string
  billing_name: string
  company_name?: string | null
  tax_id?: string | null
  email: string
  phone?: string | null
  address_line1: string
  address_line2?: string | null
  postal_code: string
  city: string
  region?: string | null
  country: string
  created_at?: string
  updated_at?: string
}

export type CustomerRecord = {
  id: string
  name?: string | null
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  phone?: string | null
  address_line1?: string | null
  address_line2?: string | null
  postal_code?: string | null
  zip_code?: string | null
  city?: string | null
  region?: string | null
  country?: string | null
  country_code?: string | null
  created_at?: string
  updated_at?: string
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  params?: Record<string, string>
  body?: unknown
}

const buildUrl = (path: string, params?: Record<string, string>) => {
  const endpoint = new URL(path, DIRECTUS_BASE_URL)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      endpoint.searchParams.set(key, value)
    })
  }
  return endpoint.toString()
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

const parseError = (payload: DirectusError) => {
  const message = payload.errors?.[0]?.message
  return message ? `Directus error: ${message}` : 'Directus error'
}

const toNumberValue = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }
  return fallback
}

const omitNil = (payload: Record<string, unknown>) => {
  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined || payload[key] === null) {
      delete payload[key]
    }
  })
  return payload
}

const chunkArray = <T>(array: T[], size: number): T[][] => {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, i * size + size)
  )
}

const requestDirectus = async <T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> => {
  const url = buildUrl(path, options.params)
  const payload = options.body
  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers: buildHeaders(),
    body: payload ? JSON.stringify(payload) : undefined,
  })

  if (!response.ok) {
    let details = ''
    try {
      const payload = (await response.json()) as DirectusError
      details = parseError(payload)
    } catch {
      details = `Directus request failed: ${response.status}`
    }
    throw new Error(details)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

const createOne = async <T>(
  collection: string,
  data: Record<string, unknown>,
): Promise<T> => {
  const payload = await requestDirectus<DirectusItemResponse<T>>(
    `/items/${collection}`,
    {
      method: 'POST',
      body: data,
    },
  )
  return payload.data
}

const createMany = async <T>(
  collection: string,
  data: Record<string, unknown>[],
): Promise<T[]> => {
  const payload = await requestDirectus<DirectusListResponse<T>>(
    `/items/${collection}`,
    {
      method: 'POST',
      body: data,
    },
  )
  return payload.data
}

const updateOne = async <T>(
  collection: string,
  id: string,
  data: Record<string, unknown>,
): Promise<T> => {
  const payload = await requestDirectus<DirectusItemResponse<T>>(
    `/items/${collection}/${id}`,
    {
      method: 'PATCH',
      body: data,
    },
  )
  return payload.data
}

const deleteOne = async (collection: string, id: string): Promise<void> => {
  await requestDirectus<void>(`/items/${collection}/${id}`, {
    method: 'DELETE',
  })
}

export const createCart = async (input: {
  status?: string
  currency?: string
  customer_id?: string | null
}): Promise<CartRecord> => {
  return createOne<CartRecord>('carts', {
    status: input.status ?? 'open',
    currency: input.currency ?? 'EUR',
    customer_id: input.customer_id ?? null,
  })
}

export const getCartItems = async (cartId: string): Promise<CartItemRecord[]> => {
  const params: Record<string, string> = {
    'filter[cart_id][_eq]': cartId,
    fields: '*',
  }
  const payload = await requestDirectus<DirectusListResponse<CartItemRecord>>(
    `/items/cart_items`,
    { params },
  )
  return payload.data
}

export const addCartItem = async (input: {
  cart_id: string
  product_id: string
  variant_id?: string | null
  quantity: number
  unit_price?: number | null
  currency?: string
}): Promise<CartItemRecord> => {
  return createOne<CartItemRecord>('cart_items', {
    cart_id: input.cart_id,
    product_id: input.product_id,
    variant_id: input.variant_id ?? null,
    quantity: input.quantity,
    unit_price: input.unit_price ?? null,
    currency: input.currency ?? 'EUR',
  })
}

export const updateCartItem = async (
  id: string,
  input: {
    quantity?: number
    unit_price?: number | null
  },
): Promise<CartItemRecord> => {
  return updateOne<CartItemRecord>('cart_items', id, {
    ...input,
  })
}

export const removeCartItem = async (id: string): Promise<void> => {
  await deleteOne('cart_items', id)
}

export const createOrder = async (input: {
  cart_id?: string | null
  customer_id?: string | null
  order_number?: string | null
  status?: string
  payment_status?: string | null
  payment_method?: string | null
  currency?: string
  subtotal?: number | null
  total?: number | null
  total_price?: number | null
  total_products_price?: number | null
  shipping_price?: number | null
  shipping_address?: Record<string, unknown> | string | null
  logistic_name?: string | null
  item_count?: number | null
}): Promise<OrderRecord> => {
  const resolvedOrderNumber =
    input.order_number === null
      ? undefined
      : input.order_number ?? `KOK-${Date.now()}`
  const payload = omitNil({
    order_number: resolvedOrderNumber,
    cart_id: input.cart_id ?? undefined,
    customer_id: input.customer_id ?? undefined,
    status: input.status ?? 'pending_payment',
    payment_status: input.payment_status ?? 'pending_payment',
    currency: input.currency ?? 'EUR',
    subtotal: toNumberValue(input.subtotal ?? input.total, 0),
    total: toNumberValue(input.total, 0),
    total_price: toNumberValue(input.total_price ?? input.total, 0),
    total_products_price: toNumberValue(
      input.total_products_price ?? input.subtotal ?? input.total,
      0,
    ),
    shipping_price: toNumberValue(input.shipping_price ?? 0, 0),
    shipping_address: input.shipping_address ?? undefined,
    logistic_name: input.logistic_name ?? undefined,
    item_count: toNumberValue(input.item_count ?? 0, 0),
    payment_method: input.payment_method ?? undefined,
  })
  
  return createOne<OrderRecord>('orders', payload)
}

export const getOrderFullDetails = async (
  orderId: string,
): Promise<OrderFullDetails> => {
  const result = await directusClient.request(
    readItem('orders', orderId, {
      fields: orderDetailFields,
    }),
  )
  return result as OrderFullDetails
}

export const getOrderItemsByOrderId = async (
  orderId: string,
): Promise<OrderItemRecord[]> => {
  const params: Record<string, string> = {
    'filter[order_id][_eq]': orderId,
    fields: '*,product_id.*,variant_id.*',
  }
  const payload = await requestDirectus<DirectusListResponse<OrderItemRecord>>(
    `/items/order_items`,
    { params },
  )
  return payload.data
}

export const getOrdersForHistory = async (input?: {
  limit?: number
}): Promise<OrderRecord[]> => {
  const result = await directusClient.request(
    readItems('orders', {
      sort: ['-created_at'],
      limit: input?.limit ?? 200,
      fields: [
        'id',
        'order_number',
        'status',
        'payment_status',
        'total_price',
        'total_products_price',
        'shipping_price',
        'created_at',
        'customer_id.first_name',
        'customer_id.last_name',
        'customer_id.email',
      ],
    }),
  )
  return result as OrderRecord[]
}

export const getCustomerOrdersByEmail = async (
  email: string,
): Promise<OrderRecord[]> => {
  const result = await directusClient.request(
    readItems('orders', {
      filter: {
        'customer_id.email': {
          _eq: email,
        },
      },
      sort: ['-created_at'],
      fields: [
        'id',
        'order_number',
        'status',
        'payment_status',
        'total_price',
        'created_at',
        'logistic_name',
        'tracking_number',
        'tracking_url',
        'delivery_time_estimation',
      ],
    }),
  )
  return result as OrderRecord[]
}

export const getOrderItemsByOrderIds = async (
  orderIds: string[],
): Promise<OrderItemRecord[]> => {
  const uniqueIds = Array.from(new Set(orderIds.filter(Boolean)))
  if (uniqueIds.length === 0) return []
  
  const chunks = chunkArray(uniqueIds, 50)
  const results = await Promise.all(
    chunks.map(async (chunk) => {
      const params: Record<string, string> = {
        'filter[order_id][_in]': chunk.join(','),
        fields: 'id,order_id,product_id,variant_id,quantity,unit_price',
      }
      const payload = await requestDirectus<DirectusListResponse<OrderItemRecord>>(
        `/items/order_items`,
        { params },
      )
      return payload.data ?? []
    })
  )
  return results.flat()
}

export const getOrderDeliveriesByOrderIds = async (
  orderIds: string[],
): Promise<OrderDeliveryRecord[]> => {
  const uniqueIds = Array.from(new Set(orderIds.filter(Boolean)))
  if (uniqueIds.length === 0) return []

  const chunks = chunkArray(uniqueIds, 50)
  const results = await Promise.all(
    chunks.map(async (chunk) => {
      const params: Record<string, string> = {
        'filter[order_id][_in]': chunk.join(','),
        fields:
          'id,order_id,status,delivery_method,carrier,tracking_number,shipped_at,delivered_at',
      }
      const payload = await requestDirectus<
        DirectusListResponse<OrderDeliveryRecord>
      >(`/items/order_delivery`, { params })
      return payload.data ?? []
    })
  )
  return results.flat()
}

export const getVariantsByIds = async (
  variantIds: string[],
): Promise<VariantCostRecord[]> => {
  const uniqueIds = Array.from(new Set(variantIds.filter(Boolean)))
  if (uniqueIds.length === 0) return []
  
    const chunks = chunkArray(uniqueIds, 50)
    const results = await Promise.all(
      chunks.map(async (chunk) => {
        try {
          const params: Record<string, string> = {
            'filter[id][_in]': chunk.join(','),
            fields: 'id,product_id,sku,price,cost_price',
          }
          const payload = await requestDirectus<DirectusListResponse<VariantCostRecord>>(
            `/items/product_variants`,
            { params },
          )
          return payload.data ?? []
        } catch (error) {
          console.warn('Could not fetch variants:', error)
          return []
        }
      })
    )
  return results.flat()
}

export const createOrderItems = async (
  items: Array<{
    order_id: string
    product_id: string
    variant_id?: string | null
    quantity: number
    unit_price?: number | null
    line_total?: number | null
    currency?: string
  }>,
): Promise<OrderItemRecord[]> => {
  const payload = items.map((item) => ({
    order_id: item.order_id,
    product_id: item.product_id,
    variant_id: item.variant_id ?? null,
    quantity: item.quantity,
    unit_price: item.unit_price ?? null,
    line_total: item.line_total ?? null,
    currency: item.currency ?? 'EUR',
  }))
  return createMany<OrderItemRecord>('order_items', payload)
}

export const createOrderDelivery = async (input: {
  order_id: string
  status?: string
  recipient_name: string
  email: string
  phone?: string | null
  address_line1: string
  address_line2?: string | null
  postal_code: string
  city: string
  region?: string | null
  country: string
  delivery_method?: string | null
  carrier?: string | null
  tracking_number?: string | null
  shipped_at?: string | null
  delivered_at?: string | null
}): Promise<OrderDeliveryRecord> => {
  return createOne<OrderDeliveryRecord>('order_delivery', {
    order_id: input.order_id,
    status: input.status ?? 'pending',
    recipient_name: input.recipient_name,
    email: input.email,
    phone: input.phone ?? null,
    address_line1: input.address_line1,
    address_line2: input.address_line2 ?? null,
    postal_code: input.postal_code,
    city: input.city,
    region: input.region ?? null,
    country: input.country,
    delivery_method: input.delivery_method ?? null,
    carrier: input.carrier ?? null,
    tracking_number: input.tracking_number ?? null,
    shipped_at: input.shipped_at ?? null,
    delivered_at: input.delivered_at ?? null,
  })
}

export const createOrderBilling = async (input: {
  order_id: string
  billing_name: string
  company_name?: string | null
  tax_id?: string | null
  email: string
  phone?: string | null
  address_line1: string
  address_line2?: string | null
  postal_code: string
  city: string
  region?: string | null
  country: string
}): Promise<OrderBillingRecord> => {
  return createOne<OrderBillingRecord>('order_billing', {
    order_id: input.order_id,
    billing_name: input.billing_name,
    company_name: input.company_name ?? null,
    tax_id: input.tax_id ?? null,
    email: input.email,
    phone: input.phone ?? null,
    address_line1: input.address_line1,
    address_line2: input.address_line2 ?? null,
    postal_code: input.postal_code,
    city: input.city,
    region: input.region ?? null,
    country: input.country,
  })
}

export const markOrderPaid = async (
  orderId: string,
  input: {
    status?: string
    payment_status?: string
    payment_method?: string
  },
): Promise<OrderRecord> => {
  const payload: Record<string, unknown> = {
    status: input.status ?? 'paid',
    payment_status: input.payment_status ?? 'paid',
  }
  if (input.payment_method) {
    payload.payment_method = input.payment_method
  }
  return updateOne<OrderRecord>('orders', orderId, payload)
}

export const createCustomer = async (input: {
  first_name: string
  last_name: string
  email: string
  phone?: string | null
  address_line1: string
  address_line2?: string | null
  zip_code: string
  city: string
  region?: string | null
  country_code: string
}): Promise<CustomerRecord> => {
  return createOne<CustomerRecord>('customers', {
    first_name: input.first_name,
    last_name: input.last_name,
    email: input.email,
    phone: input.phone ?? null,
    address_line1: input.address_line1,
    address_line2: input.address_line2 ?? null,
    zip_code: input.zip_code,
    city: input.city,
    region: input.region ?? null,
    country_code: input.country_code,
  })
}

export const getCustomerByEmail = async (
  email: string,
): Promise<CustomerRecord | null> => {
  const params: Record<string, string> = {
    'filter[email][_eq]': email,
    limit: '1',
  }
  const payload = await requestDirectus<DirectusListResponse<CustomerRecord>>(
    `/items/customers`,
    { params },
  )
  return payload.data?.[0] ?? null
}

export const getCustomerById = async (
  id: string,
): Promise<CustomerRecord | null> => {
  if (!id) return null
  const params: Record<string, string> = {
    fields: 'id,first_name,last_name,email,phone,address_line1,city,zip_code,country_code',
  }
  const payload = await requestDirectus<DirectusItemResponse<CustomerRecord>>(
    `/items/customers/${id}`,
    { params },
  )
  return payload.data ?? null
}

export const closeCart = async (
  cartId: string,
  status = 'converted',
): Promise<CartRecord> => {
  return updateOne<CartRecord>('carts', cartId, { status })
}

export type AdminOrderDashboardRecord = {
  order_id: string
  order_number: string
  date_commande: string
  status_commande: string
  status_paiement: string
  methode_paiement: string
  client_nom_complet: string
  client_email: string
  total_paye_client: string | number
  sous_total_produits: string | number
  frais_port_encaisses: string | number
  cout_produits_estime: string | number
  cout_expedition_estime: string | number
  frais_stripe: string | number
  frais_urssaf: string | number
  benefice_net_estime: string | number
  cj_order_id?: string | null
  tracking_number?: string | null
  delai_livraison_estime?: string | null
  nombre_articles: string | number
  resume_articles?: string | null
  details_articles_json?: any
}

export const getAdminOrdersDashboard = async (input?: {
  limit?: number
}): Promise<AdminOrderDashboardRecord[]> => {
  const result = await directusClient.request(
    readItems('admin_orders_dashboard_final', {
      sort: ['-date_commande'],
      limit: input?.limit ?? 200,
    }),
  )
  return result as AdminOrderDashboardRecord[]
}
