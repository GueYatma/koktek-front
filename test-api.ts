import { createDirectus, rest, readItems, staticToken } from '@directus/sdk';

const client = createDirectus('https://admin.koktek.com').with(rest()).with(staticToken(process.env.VITE_DIRECTUS_TOKEN as string));

async function run() {
  const result = await client.request(readItems('admin_orders_dashboard_final', { limit: 5, sort: ['-date_commande'] }));
  console.log(result.map(r => ({id: r.order_number, status: r.status_paiement, date: r.date_commande})));
}
run();
