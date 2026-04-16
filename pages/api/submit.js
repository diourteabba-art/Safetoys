// pages/api/submit.js
const { submitToy } = require('../../lib/supabase');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });
  const { name, brand, category, age, barcode, comment, imageUrl } = req.body;
  if (!name || !brand) return res.status(400).json({ error: 'Nom et marque obligatoires' });
  try {
    const ok = await submitToy({ name, brand, category, age, barcode, comment, imageUrl });
    if (ok) return res.status(200).json({ success: true });
    return res.status(500).json({ error: 'Erreur lors de la soumission' });
  } catch (e) {
    console.error('submit error:', e);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
