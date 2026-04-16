// pages/api/search.js
import { searchByName } from '../../lib/supabase';

export default async function handler(req, res) {
  const { q } = req.query;
  if (!q || q.length < 2) return res.status(400).json({ error: 'Requête trop courte' });
  try {
    const toys = await searchByName(q);
    return res.status(200).json(toys);
  } catch (e) {
    console.error('search error:', e);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
