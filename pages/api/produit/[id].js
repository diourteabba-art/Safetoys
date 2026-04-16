// pages/api/produit/[id].js
export default async function handler(req, res) {
  const { id } = req.query;
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

    const { data, error } = await supabase
      .from('produits')
      .select(`*, product_substances(concentration, unite, niveau_confiance, methode_acquisition, date_mise_a_jour, substances(nom, famille, cas_number, ec_number, classification_clp, description), sources(nom, type, url, fiabilite))`)
      .eq('id', parseInt(id))
      .single();

    if (error || !data) return res.status(404).json({ error: 'Produit non trouvé' });

    const substances = (data.product_substances || []).map(ps => ({
      nom: ps.substances?.nom || '',
      famille: ps.substances?.famille || '',
      cas: ps.substances?.cas_number || '',
      classification: ps.substances?.classification_clp || '',
      description: ps.substances?.description || '',
      concentration: ps.concentration,
      unite: ps.unite,
      niveauConfiance: ps.niveau_confiance,
      methode: ps.methode_acquisition,
      source: ps.sources?.nom || '',
      sourceUrl: ps.sources?.url || '',
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
      alternative: '',
    });
  } catch (e) {
    console.error('produit error:', e);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
