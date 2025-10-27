// pages/api/save-order.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sb = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const payload = req.body;
    // ensure minimal validation
    if (!payload?.customer || !Array.isArray(payload?.items) || payload.items.length === 0) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const { data, error } = await sb
      .from('orders')
      .insert([{
        order_id: String(payload.id || Date.now()),
        customer: payload.customer,
        items: payload.items,
        total: payload.total
      }]);

    if (error) throw error;
    return res.json({ success: true, row: data?.[0] ?? null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
