// pages/api/scan.js
import { searchByBarcode } from '../../lib/supabase';

export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'Code manquant' });
  try {
    const toy = await searchByBarcode(code);
    if (toy) return res.status(200).json(toy);
    return res.status(404).json({ error: 'Jouet non trouvé' });
  } catch (e) {
    console.error('scan error:', e);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
