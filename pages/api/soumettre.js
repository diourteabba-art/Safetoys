// pages/api/soumettre.js
// Soumission avec analyse ECHA/REACH + score provisoire

// ─── BASE SUBSTANCES ECHA/REACH ───────────────────────────────
const SUBSTANCES_ECHA = [
  { id: 1,  keywords: ['dehp','phtalate dehp','bis(2-éthylhexyl)'],          danger: 'D', famille: 'Phtalate' },
  { id: 2,  keywords: ['dbp','dibutyl phtalate'],                             danger: 'D', famille: 'Phtalate' },
  { id: 3,  keywords: ['bbp','benzyl butyl'],                                 danger: 'D', famille: 'Phtalate' },
  { id: 4,  keywords: ['dibp','diisobutyl'],                                  danger: 'D', famille: 'Phtalate' },
  { id: 5,  keywords: ['dinp','diisononyl','di-isononyl'],                    danger: 'C', famille: 'Phtalate' },
  { id: 6,  keywords: ['bpa','bisphénol','bisphenol'],                        danger: 'D', famille: 'Phénol' },
  { id: 7,  keywords: ['formaldéhyde','formaldehyde'],                        danger: 'C', famille: 'Aldéhyde' },
  { id: 8,  keywords: ['plomb','lead'],                                        danger: 'D', famille: 'Métal lourd' },
  { id: 9,  keywords: ['cadmium'],                                             danger: 'D', famille: 'Métal lourd' },
  { id: 10, keywords: ['chrome vi','chrome 6','chromium vi'],                  danger: 'D', famille: 'Métal lourd' },
  { id: 11, keywords: ['nickel'],                                              danger: 'C', famille: 'Métal' },
  { id: 12, keywords: ['arsenic'],                                             danger: 'D', famille: 'Métal lourd' },
  { id: 13, keywords: ['borax','acide borique'],                              danger: 'D', famille: 'Bore' },
  { id: 14, keywords: ['pfos'],                                                danger: 'D', famille: 'PFAS' },
  { id: 15, keywords: ['pfoa'],                                                danger: 'D', famille: 'PFAS' },
  { id: 16, keywords: ['pfas','perfluor','polyfluor'],                         danger: 'D', famille: 'PFAS' },
  { id: 17, keywords: ['pbde','retardateur flamme','retardateur de flamme','bromé'], danger: 'D', famille: 'Retardateur' },
];

const MATIERES_SURES = [
  'bois fsc','bois pefc','caoutchouc naturel','coton bio','oeko-tex',
  'certifié bio','sans bpa','sans phtalates','peintures eau','non toxique',
];

const PROFILS_MARQUE = {
  'lego': 'A', 'playmobil': 'A', 'djeco': 'A', 'janod': 'A',
  'hape': 'A', 'kapla': 'A', 'ravensburger': 'A', 'vilac': 'A',
  'vulli': 'A', 'moulin roty': 'A', 'jellycat': 'A', 'haba': 'A',
  'nathan': 'A', 'crayola': 'A', 'asmodee': 'A', 'geomag': 'A',
  'ailefo': 'A', 'plan toys': 'A', 'goki': 'A', 'melissa': 'A',
  'micro': 'A', 'steiff': 'A', 'lilliputiens': 'A',
  'chicco': 'B', 'fisher': 'B', 'smoby': 'B', 'hasbro': 'B',
  'lunii': 'B', 'magna': 'B',
  'vtech': 'C', 'mattel': 'C',
};

function analyserSubstances(texte) {
  if (!texte) return { score: null, substances: [], danger: 'Inconnu' };
  const t = texte.toLowerCase();

  if (t.includes('aucune')) return { score: 'A', substances: [], danger: 'Faible' };

  const found = [];
  let maxDanger = 0;

  for (const s of SUBSTANCES_ECHA) {
    if (s.keywords.some(k => t.includes(k))) {
      found.push(s.id);
      const d = s.danger === 'D' ? 3 : s.danger === 'C' ? 2 : 1;
      if (d > maxDanger) maxDanger = d;
    }
  }

  const nbSures = MATIERES_SURES.filter(m => t.includes(m)).length;

  let score;
  if (found.length === 0 && nbSures >= 2) score = 'A';
  else if (found.length === 0) score = null;
  else if (maxDanger === 3) score = 'D';
  else if (maxDanger === 2) score = 'C';
  else score = 'B';

  const danger = score === 'D' ? 'Élevé' : score === 'C' ? 'Modéré' : score === 'B' ? 'Faible' : 'Inconnu';
  return { score, substances: found, danger };
}

function scoreParMarque(marque) {
  if (!marque) return null;
  const m = marque.toLowerCase();
  for (const [key, score] of Object.entries(PROFILS_MARQUE)) {
    if (m.includes(key)) return score;
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const { name, brand, category, age, barcode, comment, imageUrl, materiaux } = req.body;
  if (!name || !brand) return res.status(400).json({ error: 'Nom et marque obligatoires' });

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

    // ─── Analyse ECHA/REACH ───────────────────────────────────
    const texteAnalyse = [comment || '', materiaux || ''].join(' ');
    const analyse = analyserSubstances(texteAnalyse);

    // Score final : substances > marque > provisoire B
    const scoreMarque = scoreParMarque(brand);
    const score = analyse.score || scoreMarque || 'B';
    const danger = analyse.danger !== 'Inconnu' ? analyse.danger :
      score === 'D' ? 'Élevé' : score === 'C' ? 'Modéré' : 'Faible';

    const isProvisoire = !analyse.score;

    // ─── Parsing tranche d'âge ────────────────────────────────
    const ageMatch = (age || '').match(/(\d+)/g);
    const age_min = ageMatch ? parseInt(ageMatch[0]) : 0;
    const age_max = ageMatch?.length > 1 ? parseInt(ageMatch[1]) : 12;

    // ─── Insertion dans produits ──────────────────────────────
    const { data: produit, error: produitError } = await supabase
      .from('produits')
      .insert([{
        nom: name.substring(0, 255),
        marque: brand.substring(0, 255),
        categorie: category || null,
        age_min,
        age_max,
        ean: barcode || null,
        image_url: imageUrl || null,
        score,
        statut: 'verifie',
        lien_officiel: null,
      }])
      .select('id')
      .single();

    if (produitError) {
      // Si doublon EAN, on sauvegarde quand même dans submissions
      if (produitError.code === '23505') {
        await supabase.from('submissions').insert([{
          nom: name, marque: brand, categorie: category || null,
          age_min, ean: barcode || null, image_url: imageUrl || null,
          commentaire: `Doublon EAN. ${comment || ''}`, statut: 'en_attente',
        }]);
        return res.status(200).json({
          success: true, score, isProvisoire: true,
          message: 'Ce jouet existe déjà. Votre contribution a été notée.',
        });
      }
      throw new Error(produitError.message);
    }

    // ─── Liaison substances ECHA ──────────────────────────────
    if (analyse.substances.length > 0 && produit?.id) {
      const liens = analyse.substances.map(sid => ({
        produit_id: produit.id,
        substance_id: sid,
        source_id: 6, // base_publique
        niveau_confiance: 'faible',
        methode_acquisition: 'base_publique',
        date_mise_a_jour: new Date().toISOString().split('T')[0],
      }));
      await supabase.from('product_substances').insert(liens);
    }

    // ─── Sauvegarder aussi dans submissions pour traçabilité ──
    await supabase.from('submissions').insert([{
      nom: name, marque: brand, categorie: category || null,
      age_min, ean: barcode || null, image_url: imageUrl || null,
      commentaire: comment || null,
      statut: 'valide',
      produit_id: produit?.id,
    }]);

    return res.status(200).json({
      success: true,
      id: produit?.id,
      score,
      danger,
      isProvisoire,
      substancesDetectees: analyse.substances.length,
      message: isProvisoire
        ? `Score ${score} provisoire basé sur la marque. Analyse en cours.`
        : `Score ${score} calculé selon ${analyse.substances.length} substance(s) ECHA/REACH.`,
    });
  } catch (e) {
    console.error('soumettre error:', e);
    return res.status(500).json({ error: 'Erreur serveur', detail: e.message });
  }
}
