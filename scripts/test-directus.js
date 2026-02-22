#!/usr/bin/env node

const DIRECTUS_URL =
  process.env.DIRECTUS_URL || process.env.VITE_DIRECTUS_BASE_URL || 'https://directus.koktek.com'
const DIRECTUS_TOKEN =
  process.env.DIRECTUS_TOKEN || process.env.VITE_DIRECTUS_TOKEN || ''

const CUSTOMER_ID = process.env.CUSTOMER_ID || ''
const PRODUCT_ID = process.env.PRODUCT_ID || ''

if (!DIRECTUS_TOKEN) {
  console.error('Missing DIRECTUS_TOKEN or VITE_DIRECTUS_TOKEN')
  process.exit(1)
}

if (!CUSTOMER_ID || !PRODUCT_ID) {
  console.error('Missing CUSTOMER_ID or PRODUCT_ID')
  process.exit(1)
}

const payload = {
  status: 'pending_payment',
  customer_id: CUSTOMER_ID,
  order_items: {
    create: [
      {
        product_id: PRODUCT_ID,
        quantity: 1,
        unit_price: 10,
      },
    ],
  },
  order_delivery: {
    create: {
      recipient_name: 'Test',
      address_line1: '1 rue Test',
      city: 'Paris',
      postal_code: '75000',
      country: 'France',
    },
  },
}

const run = async () => {
  const response = await fetch(`${DIRECTUS_URL}/items/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DIRECTUS_TOKEN}`,
    },
    body: JSON.stringify(payload),
  })

  const text = await response.text()
  console.log('Status:', response.status)
  console.log('Response:', text)
}

run().catch((error) => {
  console.error('Request failed:', error)
  process.exit(1)
})
