// pages/api/search.js
export default async function handler(req, res) {
  const { q } = req.query;
  if (!q || q.length < 2) return res.status(400).json({ error: 'Requête trop courte' });

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

    const { data, error } = await supabase
      .from('produits')
      .select('id, nom, marque, categorie, age_min, age_max, ean, image_url, score, statut')
      .eq('statut', 'verifie')
      .or(`nom.ilike.%${q}%,marque.ilike.%${q}%`)
      .limit(10);

    if (error || !data) return res.status(200).json([]);

    return res.status(200).json(data.map(p => ({
      id: String(p.id),
      name: p.nom,
      brand: p.marque || '',
      category: p.categorie || '',
      age: p.age_min ? `${p.age_min}${p.age_max ? '-'+p.age_max : '+'} ans` : '',
      barcode: p.ean || '',
      score: p.score || '?',
      imageUrl: p.image_url || '',
      status: p.statut,
      danger: p.score === 'D' ? 'Élevé' : p.score === 'C' ? 'Modéré' : 'Faible',
      substances: '',
      substancesDetail: [],
    })));
  } catch (e) {
    console.error('search error:', e);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
