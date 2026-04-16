// pages/api/submit.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });
  const { name, brand, category, age, barcode, comment, imageUrl } = req.body;
  if (!name || !brand) return res.status(400).json({ error: 'Nom et marque obligatoires' });

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

    const { error } = await supabase.from('submissions').insert([{
      nom: name,
      marque: brand,
      categorie: category || null,
      age_min: age ? parseInt(age) : null,
      ean: barcode || null,
      image_url: imageUrl || null,
      commentaire: comment || null,
      statut: 'en_attente',
    }]);

    if (error) {
      console.error('submit error:', error);
      return res.status(500).json({ error: 'Erreur Supabase' });
    }
    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('submit error:', e);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
