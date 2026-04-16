export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'Code manquant' });
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    const { data, error } = await supabase
      .from('produits')
      .select('*, product_substances(concentration, unite, niveau_confiance, methode_acquisition, substances(nom, famille, cas_number, classification_clp), sources(nom, type, fiabilite))')
      .eq('ean', code)
      .eq('statut', 'verifie')
      .single();
    if (error || !data) return res.status(404).json({ error: 'Jouet non trouvé' });
    const substances = (data.product_substances || []).map(ps => ({
      nom: ps.substances?.nom || '',
      famille: ps.substances?.famille || '',
      concentration: ps.concentration,
      unite: ps.unite,
      niveauConfiance: ps.niveau_confiance,
      methode: ps.methode_acquisition,
      source: ps.sources?.nom || '',
      fiabilite: ps.sources?.fiabilite || 0,
    }));
    return res.status(200).json({
      id: String(data.id),
      name: data.nom,
      brand: data.marque || '',
      category: data.categorie || '',
      age: data.age_min ? `${data.age_min}${data.age_max ? '-'+data.age_max : '+'} ans` : '',
      barcode: data.ean || '',
      score: data.score || '?',
      imageUrl: data.image_url || '',
      link: data.lien_officiel || '',
      status: data.statut,
      danger: data.score === 'D' ? 'Élevé' : data.score === 'C' ? 'Modéré' : 'Faible',
      substances: substances.map(s => s.nom).join(', ') || 'Aucune substance préoccupante',
      substancesDetail: substances,
    });
  } catch (e) {
    console.error('scan error:', e);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
