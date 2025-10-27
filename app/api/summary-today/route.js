// pages/api/summary-today.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sb = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  try {
    const today = new Date().toISOString().slice(0,10);
    const { data, error } = await sb
      .from('orders')
      .select('items')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59.999`);

    if (error) throw error;

    const counts = {};
    (data || []).forEach(row => {
      (row.items || []).forEach(it => {
        counts[it.id] = counts[it.id] || { id: it.id, name: it.name, qty: 0 };
        counts[it.id].qty += (it.qty || 0);
      });
    });

    return res.json({ summary: Object.values(counts) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
