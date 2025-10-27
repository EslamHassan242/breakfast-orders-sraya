// pages/api/orders-today.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sb = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  try {
    // get today's date start and end in UTC
    const today = new Date().toISOString().slice(0,10); // YYYY-MM-DD
    const { data, error } = await sb
      .from('orders')
      .select('*')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59.999`)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return res.json({ orders: data || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
