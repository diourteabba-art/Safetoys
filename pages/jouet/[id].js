// pages/jouet/[id].js
import { useRouter } from 'next/router';
import BottomNav from '../../components/BottomNav';

export async function getServerSideProps({ params }) {
  const { id } = params;
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // Produit + substances exactes
    const { data, error } = await supabase
      .from('produits')
      .select(`
        *,
        product_substances(
          concentration, unite, niveau_confiance, methode_acquisition,
          substances(nom, famille, cas_number, classification_clp, description),
          sources(nom, type, url, fiabilite)
        )
      `)
      .eq('id', parseInt(id))
      .single();

    if (error || !data) return { notFound: true };

    // Score enrichi
    const { data: scoreData } = await supabase
      .from('product_score_labels')
      .select('grade, final_score, interpretation, disclaimer, confidence_moyen')
      .eq('produit_id', parseInt(id))
      .single();

    // Risques probabilistes si mode probabiliste
let risquesProbables = [];
if (data.analyse_mode !== 'exact' && data.categorie) {
  const { data: risques } = await supabase
    .from('category_risks')
    .select(`
      probabilite, description, source,
      substance_id,
      substances:substance_id(nom, famille, classification_clp)
    `)
    .eq('categorie', data.categorie)
    .order('probabilite', { ascending: false });
  risquesProbables = risques || [];
}

   risquesProbables: risquesProbables.map(r => ({
  nom: r.substances?.nom || '',
  famille: r.substances?.famille || '',
  classification: r.substances?.classification_clp || '',
  probabilite: r.probabilite,
  description: r.description,
  source: r.source,
})),

    const score = scoreData?.grade || data.score || '?';

    const toy = {
      id: String(data.id),
      name: data.nom || '',
      brand: data.marque || '',
      category: data.categorie || '',
      age: data.age_min ? `${data.age_min}${data.age_max ? '-'+data.age_max : '+'} ans` : '',
      barcode: data.ean || '',
      score,
      analyseMode: data.analyse_mode || 'probabiliste',
      finalScore: scoreData?.final_score || null,
      interpretation: scoreData?.interpretation || null,
      disclaimer: scoreData?.disclaimer || null,
      confidenceMoyen: scoreData?.confidence_moyen || null,
      imageUrl: data.image_url || '',
      link: data.lien_officiel || '',
      status: data.statut || '',
      danger: score === 'D' ? 'Élevé' : score === 'C' ? 'Modéré' : score === 'B' ? 'Faible' : 'Faible',
      substances: substances.length > 0
        ? substances.map(s => s.nom).join(', ')
        : 'Aucune substance confirmée',
      substancesDetail: substances,
      risquesProbables: risquesProbables.map(r => ({
        nom: r.substances?.nom || '',
        famille: r.substances?.famille || '',
        classification: r.substances?.classification_clp || '',
        probabilite: r.probabilite,
        description: r.description,
        source: r.source,
      })),
    };

    return { props: { toy } };
  } catch (e) {
    console.error('jouet page error:', e);
    return { notFound: true };
  }
}

const SCORE_BG  = { A: '#E1F5EE', B: '#F0F8E8', C: '#FAEEDA', D: '#FCEBEB' };
const SCORE_COL = { A: '#085041', B: '#27500A', C: '#633806', D: '#501313' };
const PROB_LABEL = { 5: 'Très probable', 4: 'Probable', 3: 'Possible', 2: 'Peu probable', 1: 'Rare' };
const PROB_COLOR = { 5: '#A32D2D', 4: '#BA7517', 3: '#633806', 2: '#27500A', 1: '#085041' };
const PROB_BG    = { 5: '#FCEBEB', 4: '#FAEEDA', 3: '#FFF8EC', 2: '#F0F8E8', 1: '#E1F5EE' };
const METHODE_LABEL = {
  declaration_fabricant: 'Déclaration fabricant',
  base_publique: 'Base publique',
  test_laboratoire: 'Test laboratoire',
  estimation: 'Estimation',
};

function ConfidenceBar({ value }) {
  if (!value) return null;
  const pct = Math.round(value * 100);
  const color = pct >= 85 ? '#1D9E75' : pct >= 70 ? '#EF9F27' : '#E24B4A';
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: 'var(--gray)' }}>Niveau de confiance des données</span>
        <span style={{ fontSize: 11, fontWeight: 600, color }}>{pct}%</span>
      </div>
      <div style={{ background: 'var(--border)', borderRadius: 20, height: 6 }}>
        <div style={{ width: `${pct}%`, height: 6, borderRadius: 20, background: color }} />
      </div>
    </div>
  );
}

export default function JouetPage({ toy }) {
  const router = useRouter();
  const score = toy.score || '?';
  const bg  = SCORE_BG[score]  || '#f0f0f0';
  const col = SCORE_COL[score] || '#888';
  const isExact = toy.analyseMode === 'exact';

  return (
    <>
      <nav className="top-nav">
        <span style={{ fontSize: 20, cursor: 'pointer' }} onClick={() => router.back()}>←</span>
        <span className="nav-title">Fiche produit</span>
        <div style={{ width: 24 }} />
      </nav>

      <div className="page-body">

        {toy.imageUrl && (
          <div style={{ background: '#f7fbf9', borderRadius: 16, marginBottom: 16,
            overflow: 'hidden', border: '1px solid var(--border)' }}>
            <img src={toy.imageUrl} alt={toy.name}
              style={{ width: '100%', maxHeight: 220, objectFit: 'contain' }} />
          </div>
        )}

        {/* Header score */}
        <div className="card">
          <div className="card-row" style={{ marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{toy.name}</p>
              <p style={{ fontSize: 13, color: 'var(--gray)', marginBottom: 2 }}>{toy.brand}</p>
              <p style={{ fontSize: 12, color: 'var(--gray)' }}>{toy.category} · {toy.age}</p>
            </div>
            <div className={`score-badge score-${['A','B','C','D'].includes(score) ? score : 'q'}`}
              style={{ width: 58, height: 58, fontSize: 28 }}>{score}</div>
          </div>

          {/* Badge mode d'analyse */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{
              fontSize: 10, padding: '3px 10px', borderRadius: 20, fontWeight: 600,
              background: isExact ? '#E1F5EE' : '#FAEEDA',
              color: isExact ? '#085041' : '#633806'
            }}>
              {isExact ? '🔬 Données confirmées' : '📊 Estimation par catégorie'}
            </span>
          </div>

          <div style={{ background: bg, borderRadius: 12, padding: '12px 14px' }}>
            {toy.finalScore && isExact && (
              <p style={{ fontWeight: 700, fontSize: 14, color: col, marginBottom: 4 }}>
                Score ECHA/REACH : {toy.finalScore}
              </p>
            )}
            <p style={{ fontSize: 12, color: col, lineHeight: 1.5 }}>
              {toy.interpretation || (
                isExact
                  ? 'Analyse basée sur les substances confirmées'
                  : `Estimation basée sur les risques connus pour la catégorie "${toy.category}"`
              )}
            </p>
            {isExact && <ConfidenceBar value={toy.confidenceMoyen} />}
          </div>

          {toy.disclaimer && (
            <div style={{ marginTop: 10, padding: '8px 12px',
              background: 'var(--light-bg)', borderRadius: 8,
              borderLeft: '3px solid var(--border)' }}>
              <p style={{ fontSize: 11, color: 'var(--gray)', lineHeight: 1.5 }}>
                ℹ️ {toy.disclaimer}
              </p>
            </div>
          )}
        </div>

        {/* Substances exactes (mode exact) */}
        {isExact && (
          <>
            <p className="section-title">Substances analysées (ECHA/REACH)</p>
            <div className="card">
              {toy.substancesDetail?.length > 0 ? (
                toy.substancesDetail.map((s, i) => {
                  const isRed = ['PFAS','Phtalate','Plomb','Cadmium','BPA','PFOS','PFOA']
                    .some(k => (s.nom + s.famille).toLowerCase().includes(k.toLowerCase()));
                  return (
                    <div key={i} className="substance-row">
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{s.nom}</p>
                        {s.famille && <p style={{ fontSize: 11, color: 'var(--gray)' }}>{s.famille}</p>}
                        {s.concentration && (
                          <p style={{ fontSize: 11, color: isRed ? '#A32D2D' : '#633806' }}>
                            Concentration : {s.concentration} {s.unite}
                          </p>
                        )}
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                          {s.methode && (
                            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10,
                              background: '#E6F1FB', color: '#185FA5' }}>
                              {METHODE_LABEL[s.methode] || s.methode}
                            </span>
                          )}
                          {s.source && (
                            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10,
                              background: '#E1F5EE', color: '#085041' }}>
                              {s.source}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={`dot ${isRed ? 'dot-red' : 'dot-orange'}`} />
                    </div>
                  );
                })
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                  <div className="dot dot-green" />
                  <p style={{ fontSize: 14 }}>Aucune substance réglementée identifiée</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Risques probabilistes (mode probabiliste) */}
        {!isExact && toy.risquesProbables?.length > 0 && (
          <>
            <p className="section-title">Risques probables pour cette catégorie</p>
            <div className="alert alert-warn" style={{ marginBottom: 12 }}>
              <span>📊</span>
              <div>
                <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>
                  Estimation basée sur les données RAPEX et études scientifiques
                </p>
                <p style={{ fontSize: 11, color: 'var(--gray)' }}>
                  Aucune donnée spécifique disponible pour ce produit. 
                  Les risques ci-dessous sont basés sur les jouets similaires de la catégorie "{toy.category}".
                </p>
              </div>
            </div>
            <div className="card">
              {toy.risquesProbables.map((r, i) => (
                <div key={i} className="substance-row">
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{r.nom}</p>
                    {r.famille && <p style={{ fontSize: 11, color: 'var(--gray)', marginBottom: 4 }}>{r.famille}</p>}
                    <p style={{ fontSize: 11, color: 'var(--gray)', lineHeight: 1.4 }}>{r.description}</p>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, marginTop: 4,
                      display: 'inline-block',
                      background: PROB_BG[r.probabilite] || '#f0f0f0',
                      color: PROB_COLOR[r.probabilite] || '#888' }}>
                      {PROB_LABEL[r.probabilite] || 'Inconnu'} · Source : {r.source}
                    </span>
                  </div>
                  <div className={`dot ${r.probabilite >= 4 ? 'dot-red' : r.probabilite >= 3 ? 'dot-orange' : 'dot-green'}`} />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Infos produit */}
        <p className="section-title">Informations</p>
        <div className="card">
          {[
            { label: 'Marque', val: toy.brand },
            { label: 'Catégorie', val: toy.category },
            { label: "Tranche d'âge", val: toy.age },
            { label: 'Code-barres', val: toy.barcode || 'Non renseigné' },
            { label: 'Statut', val: toy.status === 'verifie' ? '✅ Vérifié' : '⏳ En attente' },
            { label: 'Analyse', val: isExact ? '🔬 Données confirmées' : '📊 Estimation catégorie' },
          ].map((row, i) => (
            <div key={i} className="substance-row">
              <p style={{ fontSize: 12, color: 'var(--gray)' }}>{row.label}</p>
              <p style={{ fontSize: 13, fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{row.val}</p>
            </div>
          ))}
        </div>

        {score === 'D' && (
          <div className="alert alert-danger">
            <span>⚠️</span>
            <div>
              <p style={{ fontWeight: 700, marginBottom: 2 }}>Vigilance recommandée</p>
              <p style={{ fontSize: 12 }}>
                Ce jouet présente des substances soumises à interdiction ou forte restriction.
                Consultez un professionnel si votre enfant y a été exposé.
              </p>
            </div>
          </div>
        )}

        <div style={{ background: 'var(--light-bg)', borderRadius: 12, padding: 12, marginTop: 8 }}>
          <p style={{ fontSize: 11, color: 'var(--gray)', lineHeight: 1.5 }}>
            {isExact
              ? 'Score calculé selon ECHA/REACH/EN 71 sur données confirmées. Ne remplace pas un test de laboratoire accrédité.'
              : 'Score estimé selon les risques connus pour cette catégorie de jouets (RAPEX, études scientifiques). Les informations sont à titre indicatif.'}
          </p>
        </div>

        {toy.link && (
          <a href={toy.link} target="_blank" rel="noopener noreferrer"
            className="btn btn-outline" style={{ textDecoration: 'none', marginTop: 12, display: 'block' }}>
            Voir le produit officiel ↗
          </a>
        )}
      </div>
      <BottomNav />
    </>
  );
}
