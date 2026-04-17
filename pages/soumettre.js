// pages/soumettre.js
import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import BottomNav from '../components/BottomNav';

const CATEGORIES = [
  'Peluche','Jeu de construction','Jeu de société','Véhicule',
  'Art créatif',"Jeu d'éveil",'Puzzle','Instrument musique',
  'Jeu plein air','Jeu électronique','Déguisement','Jeu de rôle',
  'Science éducatif','Figurine','Autre',
];
const AGES = ['0-1 an','1-3 ans','3-6 ans','6-12 ans','12 ans et +'];

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

  const [form, setForm] = useState({
    name: initialName || '',
    brand: '',
    category: '',
    age: '',
    barcode: initialBarcode || '',
    materiaux: '',
    comment: '',
  });
  const [photo, setPhoto] = useState(null); // URL preview locale
  const [photoBase64, setPhotoBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  function update(key, val) {
    setForm(f => ({ ...f, [key]: val }));
  }

  async function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);

    // Preview locale
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhoto(ev.target.result);
      setPhotoBase64(ev.target.result);
    };
    reader.readAsDataURL(file);
    setUploadingPhoto(false);
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
      // 1. Upload photo si présente
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

      // 2. Soumettre le jouet
      const res = await fetch('/api/soumettre', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, imageUrl }),
      });

      const data = await res.json();
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Erreur lors de la soumission.');
      }
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

          {/* Score calculé */}
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
                Score basé sur le profil de la marque. Une analyse complète sera effectuée par notre équipe.
              </p>
            )}
          </div>

          {photo && (
            <img src={photo} alt={form.name}
              style={{ width: 120, height: 120, objectFit: 'contain', borderRadius: 12,
                border: '1px solid var(--border)', marginBottom: 20 }} />
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="btn btn-primary" onClick={() => router.push('/scanner')}>
              Scanner un autre jouet
            </button>
            <button className="btn btn-outline" onClick={() => {
              setResult(null);
              setForm({ name: '', brand: '', category: '', age: '', barcode: '', materiaux: '', comment: '' });
              setPhoto(null); setPhotoBase64(null);
            }}>
              Soumettre un autre jouet
            </button>
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
            <p style={{ fontSize: 12 }}>
              Renseignez les matériaux connus — notre système calcule automatiquement un score selon les réglementations européennes.
            </p>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: 16 }}>
            <span>❌</span><p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Photo du jouet */}
          <p className="section-title">Photo du jouet</p>
          <div
            onClick={() => photoInputRef.current?.click()}
            style={{
              border: '2px dashed var(--border)', borderRadius: 16,
              padding: 20, textAlign: 'center', cursor: 'pointer',
              marginBottom: 16, background: photo ? 'transparent' : 'var(--light-bg)',
            }}
          >
            {photo ? (
              <img src={photo} alt="Aperçu"
                style={{ maxHeight: 160, maxWidth: '100%', borderRadius: 10, objectFit: 'contain' }} />
            ) : (
              <>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📷</div>
                <p style={{ fontWeight: 600, color: 'var(--green)' }}>
                  {uploadingPhoto ? 'Chargement…' : 'Prendre une photo'}
                </p>
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

          {/* Infos produit */}
          <p className="section-title">Informations du jouet</p>
          <div className="form-group">
            <label className="form-label">Nom du jouet *</label>
            <input className="form-input" type="text" value={form.name}
              onChange={e => update('name', e.target.value)}
              placeholder="Ex: Peluche Ours Teddy" />
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
              <select className="form-input" value={form.age}
                onChange={e => update('age', e.target.value)}>
                <option value="">Choisir…</option>
                {AGES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Code-barres (EAN)</label>
            <input className="form-input" type="text" value={form.barcode}
              onChange={e => update('barcode', e.target.value)}
              placeholder="Ex: 3421272102001" inputMode="numeric" />
          </div>

          {/* Matériaux — clé pour le scoring */}
          <p className="section-title">Composition / Matériaux</p>
          <div className="alert alert-info" style={{ marginBottom: 12 }}>
            <span>💡</span>
            <p style={{ fontSize: 12 }}>
              Regardez l'emballage du jouet — les matériaux indiqués permettent de calculer un score précis. Ex: "plastique ABS", "bois FSC", "coton OEKO-TEX", "sans BPA"…
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
          Le score est calculé automatiquement selon les réglementations ECHA/REACH/EN 71.
          Notre équipe peut affiner l'analyse manuellement.
        </p>
      </div>

      <BottomNav />
    </>
  );
}
