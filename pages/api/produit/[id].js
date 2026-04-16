// pages/api/produit/[id].js
const { getProduitById } = require('../../../lib/supabase');

export default async function handler(req, res) {
  const { id } = req.query;
  try {
    const toy = await getProduitById(parseInt(id));
    if (toy) return res.status(200).json(toy);
    return res.status(404).json({ error: 'Produit non trouvé' });
  } catch (e) {
    console.error('produit error:', e);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
