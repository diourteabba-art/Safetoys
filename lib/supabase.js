// lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// ─── RECHERCHE PAR CODE-BARRES ────────────────────────────────
export async function searchByBarcode(ean) {
  const { data, error } = await supabase
    .from('produits')
    .select(`
      *,
      product_substances (
        concentration, unite, niveau_confiance, methode_acquisition,
        substances ( nom, famille, cas_number, classification_clp ),
        sources ( nom, type, fiabilite )
      )
    `)
    .eq('ean', ean)
    .eq('statut', 'verifie')
    .single();

  if (error || !data) return null;
  return formatProduit(data);
}

// ─── RECHERCHE PAR NOM ────────────────────────────────────────
export async function searchByName(query) {
  const { data, error } = await supabase
    .from('produits')
    .select(`
      id, nom, marque, categorie, age_min, age_max,
      ean, image_url, score, statut,
      product_substances (
        substances ( nom, famille )
      )
    `)
    .eq('statut', 'verifie')
    .or(`nom.ilike.%${query}%,marque.ilike.%${query}%`)
    .limit(10);

  if (error || !data) return [];
  return data.map(formatProduit);
}

// ─── COMPTER LES PRODUITS VÉRIFIÉS ───────────────────────────
export async function countProduits() {
  const { count, error } = await supabase
    .from('produits')
    .select('*', { count: 'exact', head: true })
    .eq('statut', 'verifie');
  return error ? 0 : count;
}

// ─── SOUMETTRE UN JOUET ───────────────────────────────────────
export async function submitToy(fields) {
  const { error } = await supabase
    .from('submissions')
    .insert([{
      nom: fields.name || '',
      marque: fields.brand || '',
      categorie: fields.category || null,
      age_min: fields.age ? parseInt(fields.age) : null,
      ean: fields.barcode || null,
      image_url: fields.imageUrl || null,
      commentaire: fields.comment || null,
      statut: 'en_attente',
    }]);
  return !error;
}

// ─── OBTENIR UN PRODUIT PAR ID ────────────────────────────────
export async function getProduitById(id) {
  const { data, error } = await supabase
    .from('produits')
    .select(`
      *,
      product_substances (
        concentration, unite, niveau_confiance, methode_acquisition,
        date_mise_a_jour,
        substances (
          nom, famille, cas_number, ec_number,
          classification_clp, description
        ),
        sources ( nom, type, url, fiabilite )
      )
    `)
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return formatProduit(data);
}

// ─── FORMATER UN PRODUIT ──────────────────────────────────────
export function formatProduit(p) {
  const substances = (p.product_substances || []).map(ps => ({
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
    sourceType: ps.sources?.type || '',
    sourceUrl: ps.sources?.url || '',
    fiabilite: ps.sources?.fiabilite || 0,
  }));

  // Calcul du niveau de danger depuis les substances
  let danger = 'Faible';
  if (p.score === 'D') danger = 'Élevé';
  else if (p.score === 'C') danger = 'Modéré';
  else if (p.score === 'B') danger = 'Faible';

  return {
    id: String(p.id),
    name: p.nom || '',
    brand: p.marque || '',
    category: p.categorie || '',
    age: p.age_min ? `${p.age_min}${p.age_max ? '-' + p.age_max : '+'} ans` : '',
    barcode: p.ean || '',
    score: p.score || '?',
    imageUrl: p.image_url || '',
    link: p.lien_officiel || '',
    status: p.statut || '',
    danger,
    substances: substances.length > 0
      ? substances.map(s => s.nom).join(', ')
      : 'Aucune substance préoccupante détectée',
    substancesDetail: substances,
    alternative: '',
    source: substances.length > 0
      ? substances.map(s => s.source).filter(Boolean).join(', ')
      : 'Base SafeToys',
  };
}
