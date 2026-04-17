// pages/soumettre.js
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import BottomNav from '../components/BottomNav';

const CATEGORIES = [
  'Peluche','Jeu de construction','Jeu de société','Véhicule',
  'Art créatif',"Jeu d'éveil",'Puzzle','Instrument musique',
  'Jeu plein air','Jeu électronique','Déguisement','Jeu de rôle',
  'Science éducatif','Figurine','Autre',
];
const AGES = ['0-1 an','1-3 ans','2-5 ans','3-6 ans','4-8 ans','5-10 ans','6-12 ans','7-12 ans','8-12 ans','10 ans et +','12 ans et +','Tous âges'];

const SCORE_INFO = {
  A: { label: 'Sûr', bg: '#E1F5EE', color: '#085041' },
  B: { label: 'Vigilance légère', bg: '#F0F8E8', color: '#27500A' },
  C: { label: 'Modéré', bg: '#FAEEDA', color: '#633806' },
  D: { label: 'Danger élevé', bg: '#FCEBEB', color: '#501313' },
};

export default function Soumettre() {
  const router = useRouter();
  const { barcode: initialBarcode, name: initialName } = router.query;
  const photoInputRef = useRef(null);
  const searchTimeout = useRef(null);

  const [form, setForm] = useState({
    name: initialName || '',
    brand: '',
    category: '',
    age: '',
    barcode: initialBarcode || '',
    materiaux: '',
    comment: '',
  });
  const [photo, setPhoto] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [existingToys, setExistingToys] = useState([]); // jouets déjà dans la base
  const [searching, setSearching] = useState(false);

  // ─── RECHERCHE EN TEMPS RÉEL ─────────────────────────────
  const searchExisting = useCallback(async (query) => {
    if (!query || query.length < 3) { setExistingToys([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setExistingToys(Array.isArray(data) ? data.slice(0, 3) : []);
    } catch { setExistingToys([]); }
    finally { setSearching(false); }
  }, []);

  function update(key, val) {
    setForm(f => ({ ...f, [key]: val }));
    if (key === 'name') {
      clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => searchExisting(val), 600);
    }
  }

  async function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhoto(ev.target.result);
      setPhotoBase64(ev.target.result);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.brand) {
      setError('Le nom et la marque sont obligatoires.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      let imageUrl = null;
      if (photoBase64) {
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: photoBase64,
            filename: form.name.replace(/\s+/g, '_').substring(0, 30),
          }),
        });
        if (uploadRes.ok) {
          const { url } = await uploadRes.json();
          imageUrl = url;
        }
      }

      const res = await fetch('/api/soumettre', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, imageUrl }),
      });
      const data = await res.json();
      if (data.success) setResult(data);
      else setError(data.error || 'Erreur lors de la soumission.');
    } catch {
      setError('Erreur de connexion. Réessayez.');
    } finally {
      setLoading(false);
    }
  }

  // ─── ÉCRAN SUCCÈS ─────────────────────────────────────────
  if (result) {
    const scoreInfo = SCORE_INFO[result.score] || { label: 'En analyse', bg: '#f0f0f0', color: '#888' };
    return (
      <>
        <nav className="top-nav">
          <div style={{ width: 24 }} />
          <span className="nav-title">Soumission réussie !</span>
          <div style={{ width: 24 }} />
        </nav>
        <div className="page-body" style={{ textAlign: 'center', paddingTop: 40 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <p style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Merci !</p>
          <p style={{ fontSize: 14, color: 'var(--gray)', marginBottom: 24 }}>
            {form.name} a été ajouté à la base SafeToys.
          </p>
          <div style={{ background: scoreInfo.bg, borderRadius: 16, padding: 20, marginBottom: 20 }}>
            <p style={{ fontSize: 12, color: scoreInfo.color, marginBottom: 8 }}>
              {result.isProvisoire ? 'Score provisoire' : 'Score calculé ECHA/REACH'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <div className={`score-badge score-${result.score}`} style={{ width: 56, height: 56, fontSize: 26 }}>
                {result.score}
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontWeight: 700, fontSize: 16, color: scoreInfo.color }}>{scoreInfo.label}</p>
                {result.substancesDetectees > 0 && (
                  <p style={{ fontSize: 12, color: scoreInfo.color }}>
                    {result.substancesDetectees} substance(s) ECHA détectée(s)
                  </p>
                )}
              </div>
            </div>
            {result.isProvisoire && (
              <p style={{ fontSize: 11, color: scoreInfo.color, marginTop: 10, opacity: 0.8 }}>
                Score basé sur le profil de la marque. Analyse en cours.
              </p>
            )}
          </div>
          {photo && (
            <img src={photo} alt={form.name}
              style={{ width: 120, height: 120, objectFit: 'contain', borderRadius: 12,
                border: '1px solid var(--border)', marginBottom: 20 }} />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="btn btn-primary" onClick={() => router.push('/scanner')}>Scanner un autre jouet</button>
            <button className="btn btn-outline" onClick={() => {
              setResult(null);
              setForm({ name: '', brand: '', category: '', age: '', barcode: '', materiaux: '', comment: '' });
              setPhoto(null); setPhotoBase64(null); setExistingToys([]);
            }}>Soumettre un autre jouet</button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--gray)', marginTop: 16, lineHeight: 1.5 }}>
            Votre contribution aide des milliers de parents à protéger leurs enfants. Merci ! 🛡️
          </p>
        </div>
        <BottomNav />
      </>
    );
  }

  // ─── FORMULAIRE ───────────────────────────────────────────
  return (
    <>
      <nav className="top-nav">
        <span style={{ fontSize: 20, cursor: 'pointer' }} onClick={() => router.back()}>←</span>
        <span className="nav-title">Soumettre un jouet</span>
        <div style={{ width: 24 }} />
      </nav>

      <div className="page-body">
        {initialBarcode && (
          <div className="alert alert-warn" style={{ marginBottom: 16 }}>
            <span>⚠️</span>
            <p>Code <strong>{initialBarcode}</strong> non trouvé. Complétez les infos pour l'ajouter !</p>
          </div>
        )}

        <div className="alert alert-info" style={{ marginBottom: 20 }}>
          <span>🔬</span>
          <div>
            <p style={{ fontWeight: 600, marginBottom: 2 }}>Analyse automatique ECHA/REACH</p>
            <p style={{ fontSize: 12 }}>Renseignez les matériaux pour obtenir un score précis selon les réglementations européennes.</p>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: 16 }}>
            <span>❌</span><p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Photo */}
          <p className="section-title">Photo du jouet</p>
          <div onClick={() => photoInputRef.current?.click()}
            style={{ border: '2px dashed var(--border)', borderRadius: 16,
              padding: 20, textAlign: 'center', cursor: 'pointer',
              marginBottom: 12, background: photo ? 'transparent' : 'var(--light-bg)' }}>
            {photo ? (
              <img src={photo} alt="Aperçu"
                style={{ maxHeight: 160, maxWidth: '100%', borderRadius: 10, objectFit: 'contain' }} />
            ) : (
              <>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📷</div>
                <p style={{ fontWeight: 600, color: 'var(--green)' }}>Prendre une photo</p>
                <p style={{ fontSize: 12, color: 'var(--gray)' }}>Photo du jouet ou de son emballage</p>
              </>
            )}
            <input ref={photoInputRef} type="file" accept="image/*" capture="environment"
              onChange={handlePhoto} style={{ display: 'none' }} />
          </div>
          {photo && (
            <button type="button" className="btn btn-outline btn-sm"
              style={{ marginBottom: 16, width: 'auto' }}
              onClick={() => { setPhoto(null); setPhotoBase64(null); }}>
              Supprimer la photo
            </button>
          )}

          {/* Nom avec détection doublon */}
          <p className="section-title">Informations du jouet</p>
          <div className="form-group">
            <label className="form-label">Nom du jouet *</label>
            <input className="form-input" type="text" value={form.name}
              onChange={e => update('name', e.target.value)}
              placeholder="Ex: Peluche Ours Teddy" />

            {/* Résultats existants */}
            {searching && (
              <p style={{ fontSize: 12, color: 'var(--gray)', marginTop: 6 }}>🔍 Recherche en cours…</p>
            )}
            {!searching && existingToys.length > 0 && (
              <div style={{ marginTop: 8, border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ background: '#FAEEDA', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14 }}>⚠️</span>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#633806' }}>
                    Ce jouet est peut-être déjà dans notre base :
                  </p>
                </div>
                {existingToys.map((toy, i) => (
                  <Link key={i} href={`/jouet/${toy.id}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', textDecoration: 'none',
                      borderTop: '1px solid var(--border)',
                      background: 'var(--color-background-primary)' }}>
                    {toy.imageUrl ? (
                      <img src={toy.imageUrl} alt={toy.name}
                        style={{ width: 40, height: 40, objectFit: 'contain',
                          borderRadius: 8, background: 'var(--light-bg)', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: 8,
                        background: 'var(--green-light)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🧸</div>
                    )}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)' }}>{toy.name}</p>
                      <p style={{ fontSize: 11, color: 'var(--gray)' }}>{toy.brand}</p>
                    </div>
                    <div className={`score-badge score-${['A','B','C','D'].includes(toy.score) ? toy.score : 'q'}`}
                      style={{ width: 32, height: 32, fontSize: 14 }}>
                      {toy.score}
                    </div>
                  </Link>
                ))}
                <div style={{ padding: '8px 12px', background: 'var(--light-bg)', borderTop: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 11, color: 'var(--gray)' }}>
                    Si c'est le même jouet, consultez sa fiche plutôt que de le soumettre à nouveau.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Marque / Fabricant *</label>
            <input className="form-input" type="text" value={form.brand}
              onChange={e => update('brand', e.target.value)}
              placeholder="Ex: Steiff, LEGO, Playmobil…" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Catégorie</label>
              <select className="form-input" value={form.category}
                onChange={e => update('category', e.target.value)}>
                <option value="">Choisir…</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tranche d'âge</label>
              <input className="form-input" type="text"
                list="ages-list"
                value={form.age}
                onChange={e => update('age', e.target.value)}
                placeholder="Ex: 3-6 ans, 7 ans+, dès 18 mois…" />
              <datalist id="ages-list">
                {AGES.map(a => <option key={a} value={a} />)}
              </datalist>
              <p style={{ fontSize: 11, color: 'var(--gray)', marginTop: 4 }}>
                Choisissez dans la liste ou saisissez librement
              </p>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Code-barres (EAN)</label>
            <input className="form-input" type="text" value={form.barcode}
              onChange={e => update('barcode', e.target.value)}
              placeholder="Ex: 3421272102001" inputMode="numeric" />
          </div>

          <p className="section-title">Composition / Matériaux</p>
          <div className="alert alert-info" style={{ marginBottom: 12 }}>
            <span>💡</span>
            <p style={{ fontSize: 12 }}>
              Regardez l'emballage — les matériaux permettent de calculer un score précis. Ex: "plastique ABS", "bois FSC", "coton OEKO-TEX", "sans BPA"…
            </p>
          </div>
          <div className="form-group">
            <label className="form-label">Matériaux indiqués sur l'emballage</label>
            <textarea className="form-input" value={form.materiaux}
              onChange={e => update('materiaux', e.target.value)}
              placeholder="Ex: Corps en ABS sans phtalates, yeux en verre, rembourrage polyester…" />
          </div>

          <div className="form-group">
            <label className="form-label">Commentaire supplémentaire</label>
            <textarea className="form-input" value={form.comment}
              onChange={e => update('comment', e.target.value)}
              placeholder="Contexte d'achat, observations particulières…" />
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Analyse en cours…' : '🔬 Soumettre et analyser'}
          </button>
        </form>

        <p style={{ fontSize: 11, color: 'var(--gray)', textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
          Score calculé selon ECHA/REACH/EN 71. Notre équipe peut affiner l'analyse manuellement.
        </p>
      </div>
      <BottomNav />
    </>
  );
}
