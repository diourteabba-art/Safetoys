// pages/api/search.js
export default async function handler(req, res) {
  let { q } = req.query;
  if (!q || q.trim().length < 2) return res.status(400).json({ error: 'Requête trop courte' });

  q = q.trim();

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

    // Normaliser les accents côté JS pour construire plusieurs variantes
    const normalize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const qNorm = normalize(q);

    // Chercher avec et sans accents via OR
    const { data, error } = await supabase
      .from('produits')
      .select('id, nom, marque, categorie, age_min, age_max, ean, image_url, score, statut')
      .eq('statut', 'verifie')
      .or(`nom.ilike.%${q}%,marque.ilike.%${q}%,nom.ilike.%${qNorm}%,marque.ilike.%${qNorm}%`)
      .limit(20);

    if (error) {
      console.error('search error:', error);
      return res.status(500).json({ error: 'Erreur serveur' });
    }

    // Dédoublonner et formater
    const seen = new Set();
    const results = (data || [])
      .filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; })
      .map(p => ({
        id: String(p.id),
        name: p.nom,
        brand: p.marque || '',
        category: p.categorie || '',
        age: p.age_min ? `${p.age_min}${p.age_max ? '-'+p.age_max : '+'} ans` : '',
        barcode: p.ean || '',
        score: p.score || 'A',
        imageUrl: p.image_url || '',
        status: p.statut,
        danger: p.score === 'D' ? 'Élevé' : p.score === 'C' ? 'Modéré' : 'Faible',
        substances: '',
        substancesDetail: [],
      }));

    return res.status(200).json(results);
  } catch (e) {
    console.error('search error:', e);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
