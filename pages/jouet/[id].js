// pages/jouet/[id].js
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import BottomNav from '../../components/BottomNav';
import { saveToHistory } from '../historique';

export async function getServerSideProps({ params }) {
  const { id } = params;
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/produit/${id}`
    );
    if (!res.ok) return { notFound: true };
    const toy = await res.json();
    return { props: { toy } };
  } catch { return { notFound: true }; }
}

const SCORE_BG = { A: '#E1F5EE', B: '#F0F8E8', C: '#FAEEDA', D: '#FCEBEB' };
const SCORE_LABEL = { A: 'Sûr', B: 'Vigilance légère', C: 'Modéré', D: 'Danger élevé' };
const METHODE_LABEL = {
  declaration_fabricant: 'Déclaration fabricant',
  base_publique: 'Base publique',
  test_laboratoire: 'Test laboratoire',
  estimation: 'Estimation',
};
const FIABILITE_STARS = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

export default function JouetPage({ toy }) {
  const router = useRouter();
  const score = toy.score || '?';
  const bg = SCORE_BG[score] || '#f0f0f0';

  useEffect(() => { saveToHistory(toy); }, [toy.id]);

  return (
    <>
      <nav className="top-nav">
        <span style={{ fontSize: 20, cursor: 'pointer' }} onClick={() => router.back()}>←</span>
        <span className="nav-title">Fiche produit</span>
        <div style={{ width: 24 }} />
      </nav>

      <div className="page-body">
        {/* Image */}
        {toy.imageUrl && (
          <div style={{ background: '#f7fbf9', borderRadius: 16, marginBottom: 16,
            overflow: 'hidden', border: '1px solid var(--border)' }}>
            <img src={toy.imageUrl} alt={toy.name}
              style={{ width: '100%', maxHeight: 220, objectFit: 'contain' }} />
          </div>
        )}

        {/* Header */}
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
          <div style={{ background: bg, borderRadius: 12, padding: '10px 14px' }}>
            <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{SCORE_LABEL[score] || 'Non évalué'}</p>
            <p style={{ fontSize: 12, color: 'var(--gray)' }}>Niveau de danger : {toy.danger}</p>
          </div>
        </div>

        {/* Substances détaillées */}
        {toy.substancesDetail?.length > 0 ? (
          <>
            <p className="section-title">Substances analysées</p>
            <div className="card">
              {toy.substancesDetail.map((s, i) => {
                const isRed = ['PFAS','Phtalate','Plomb','Cadmium','BPA','Borax','azoïque','bromé','PFOS','PFOA']
                  .some(k => s.nom.toLowerCase().includes(k.toLowerCase()));
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
                        {s.fiabilite > 0 && (
                          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10,
                            background: '#E1F5EE', color: '#085041' }}>
                            {FIABILITE_STARS(s.fiabilite)} {s.source}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`dot ${isRed ? 'dot-red' : 'dot-orange'}`} />
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <p className="section-title">Substances analysées</p>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                <div className="dot dot-green" />
                <p style={{ fontSize: 14 }}>Aucune substance préoccupante détectée</p>
              </div>
            </div>
          </>
        )}

        {/* Infos */}
        <p className="section-title">Informations</p>
        <div className="card">
          {[
            { label: 'Marque', val: toy.brand },
            { label: 'Catégorie', val: toy.category },
            { label: "Tranche d'âge", val: toy.age },
            { label: 'Code-barres', val: toy.barcode || 'Non renseigné' },
            { label: 'Statut', val: toy.status === 'verifie' ? '✅ Vérifié' : '⏳ En attente' },
          ].map((row, i) => (
            <div key={i} className="substance-row">
              <p style={{ fontSize: 12, color: 'var(--gray)' }}>{row.label}</p>
              <p style={{ fontSize: 13, fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{row.val}</p>
            </div>
          ))}
        </div>

        {toy.danger === 'Élevé' && (
          <div className="alert alert-danger">
            <span>⚠️</span>
            <div>
              <p style={{ fontWeight: 700, marginBottom: 2 }}>Produit déconseillé</p>
              <p>Ce jouet présente des substances dangereuses. Consultez un professionnel de santé si votre enfant y a été exposé.</p>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div style={{ background: 'var(--light-bg)', borderRadius: 12, padding: 12, marginTop: 16 }}>
          <p style={{ fontSize: 11, color: 'var(--gray)', lineHeight: 1.5 }}>
            Les informations fournies par SafeToys sont à titre indicatif et ne remplacent pas les tests de laboratoire officiels. Les scores sont calculés sur la base des données disponibles.
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
