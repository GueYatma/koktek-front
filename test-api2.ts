import { createDirectus, rest, readItems, staticToken } from '@directus/sdk';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_DIRECTUS_URL || 'https://admin.koktek.com';
const token = process.env.VITE_DIRECTUS_TOKEN || '';

const client = createDirectus(url).with(rest()).with(staticToken(token));

async function run() {
  try {
    const fromOrders = await client.request(readItems('orders', { limit: 1, sort: ['-created_at'] }));
    console.log("FROM orders:", fromOrders.map(r => ({ id: r.id, status: r.payment_status })));
    
    const fromView = await client.request(readItems('admin_orders_dashboard_final', { limit: 1, sort: ['-date_commande'] }));
    console.log("FROM view:", fromView.map(r => ({ id: r.order_number, status: r.status_paiement })));
  } catch (err) {
    console.error(err.message);
  }
}
run();
