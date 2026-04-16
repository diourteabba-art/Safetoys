// pages/api/count.js
import { countProduits } from '../../lib/supabase';

export default async function handler(req, res) {
  try {
    const count = await countProduits();
    return res.status(200).json({ count });
  } catch (e) {
    return res.status(500).json({ count: 0 });
  }
}
