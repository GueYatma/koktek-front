import { createDirectus, rest, readItems, staticToken } from '@directus/sdk';

const directusClient = createDirectus(process.env.DIRECTUS_BASE_URL || 'http://localhost:8055')
  .with(rest())
  .with(staticToken(process.env.VITE_DIRECTUS_TOKEN || ''));

async function test() {
  const rawOrdersResult = await directusClient.request(
    readItems('orders', {
      sort: ['-created_at'],
      limit: 1,
      fields: [
        '*', 
        'order_items.*', 
        'order_items.variant_id.cost_price', 
        'order_items.product_id.cost_price'
      ] as any,
    }),
  );
  console.log(JSON.stringify(rawOrdersResult[0].order_items, null, 2));
}
test();
