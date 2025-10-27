// pages/api/menu.js
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sb = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res){
  try {
    const { data, error } = await sb.from('menu').select('*').order('id');
    if (error) throw error;
    res.json({ menu: data || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
