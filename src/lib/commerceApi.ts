import { DIRECTUS_BASE_URL } from '../utils/directus'

const DIRECTUS_TOKEN = import.meta.env.VITE_DIRECTUS_TOKEN as
  | string
  | undefined

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
  customer_id?: string | null
  status?: string
  payment_status?: string | null
  payment_reference?: string | null
  currency?: string
  subtotal?: number | null
  total?: number | null
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
  product_id: string
  variant_id: string | null
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

const requestDirectus = async <T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> => {
  const url = buildUrl(path, options.params)
  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers: buildHeaders(),
    body: options.body ? JSON.stringify(options.body) : undefined,
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
  currency?: string
  subtotal?: number | null
  total?: number | null
  item_count?: number | null
}): Promise<OrderRecord> => {
  return createOne<OrderRecord>('orders', {
    order_number: input.order_number ?? `KOK-${Date.now()}`,
    cart_id: input.cart_id ?? null,
    customer_id: input.customer_id ?? null,
    status: input.status ?? 'pending_payment',
    payment_status: input.payment_status ?? null,
    currency: input.currency ?? 'EUR',
    subtotal: input.subtotal ?? null,
    total: input.total ?? null,
    item_count: input.item_count ?? null,
  })
}

export const getOrderFullDetails = async (
  orderId: string,
): Promise<OrderFullDetails> => {
  const params: Record<string, string> = {
    fields: '*,order_items.*,order_delivery.*,customer_id.*',
  }
  const payload = await requestDirectus<DirectusItemResponse<OrderFullDetails>>(
    `/items/orders/${orderId}`,
    { params },
  )
  return payload.data
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
    payment_reference?: string | null
  },
): Promise<OrderRecord> => {
  return updateOne<OrderRecord>('orders', orderId, {
    status: input.status ?? 'paid',
    payment_status: input.payment_status ?? 'paid',
    payment_reference: input.payment_reference ?? null,
  })
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

export const closeCart = async (
  cartId: string,
  status = 'converted',
): Promise<CartRecord> => {
  return updateOne<CartRecord>('carts', cartId, { status })
}
