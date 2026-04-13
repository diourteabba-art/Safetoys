import { useState } from "react";
import { useRouter } from "next/router";
import BottomNav from "../components/BottomNav";

const CATEGORIES = ["Peluche", "Jeu de construction", "Jeu de société", "Véhicule", "Art créatif", "Jeu d'éveil", "Puzzle", "Instrument musique", "Jeu plein air", "Jeu électronique", "Déguisement", "Jeu de rôle", "Science éducatif", "Loisirs créatifs", "Sport intérieur", "Jeu traditionnel", "Bain / Piscine", "Figurine", "Autre"];
const AGES = ["0-3 ans", "3-6 ans", "6-12 ans", "12 ans et +"];

export default function Soumettre() {
  const router = useRouter();
  const { barcode: initialBarcode, name: initialName } = router.query;

  const [form, setForm] = useState({
    name: initialName || "",
    brand: "",
    category: "",
    age: "",
    barcode: initialBarcode || "",
    comment: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  function update(key, val) {
    setForm(f => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.brand) {
      setError("Le nom et la marque sont obligatoires.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) setSuccess(true);
      else setError("Erreur lors de la soumission. Réessayez.");
    } catch {
      setError("Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <>
        <nav className="top-nav">
          <span className="nav-title">Merci !</span>
        </nav>
        <div className="page-body" style={{ textAlign: "center", paddingTop: 60 }}>
          <div style={{ fontSize: 72, marginBottom: 20 }}>🎉</div>
          <p style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Soumission reçue !</p>
          <p style={{ color: "var(--gray)", marginBottom: 30, fontSize: 15 }}>
            Ce jouet sera vérifié par notre équipe avant d'être publié. Merci de contribuer à la sécurité des enfants !
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button className="btn btn-primary" onClick={() => router.push("/scanner")}>Scanner un autre jouet</button>
            <button className="btn btn-outline" onClick={() => { setSuccess(false); setForm({ name: "", brand: "", category: "", age: "", barcode: "", comment: "" }); }}>Soumettre un autre</button>
          </div>
        </div>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <nav className="top-nav">
        <span style={{ fontSize: 20, cursor: "pointer" }} onClick={() => router.back()}>←</span>
        <span className="nav-title">Soumettre un jouet</span>
        <div style={{ width: 24 }} />
      </nav>

      <div className="page-body">
        {initialBarcode && (
          <div className="alert alert-warn">
            <span>⚠️</span>
            <p>Code-barres <strong>{initialBarcode}</strong> non trouvé dans notre base. Aidez la communauté en complétant les infos !</p>
          </div>
        )}

        <div className="alert alert-info" style={{ marginBottom: 20 }}>
          <span>👥</span>
          <div>
            <p style={{ fontWeight: 600, marginBottom: 2 }}>Mode collaboratif</p>
            <p>Votre soumission sera vérifiée avant publication. Merci pour votre contribution !</p>
          </div>
        </div>

        {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nom du jouet *</label>
            <input className="form-input" type="text" value={form.name}
              onChange={e => update("name", e.target.value)}
              placeholder="Ex: Peluche Ours Teddy" />
          </div>

          <div className="form-group">
            <label className="form-label">Marque / Fabricant *</label>
            <input className="form-input" type="text" value={form.brand}
              onChange={e => update("brand", e.target.value)}
              placeholder="Ex: Steiff, LEGO, Playmobil…" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Catégorie</label>
              <select className="form-input" value={form.category}
                onChange={e => update("category", e.target.value)}>
                <option value="">Choisir…</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tranche d'âge</label>
              <select className="form-input" value={form.age}
                onChange={e => update("age", e.target.value)}>
                <option value="">Choisir…</option>
                {AGES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Code-barres (EAN)</label>
            <input className="form-input" type="text" value={form.barcode}
              onChange={e => update("barcode", e.target.value)}
              placeholder="Ex: 3421272102001" inputMode="numeric" />
          </div>

          <div className="form-group">
            <label className="form-label">Composition connue / Commentaire</label>
            <textarea className="form-input" value={form.comment}
              onChange={e => update("comment", e.target.value)}
              placeholder="Matériaux connus, substances suspectes, contexte d'achat…" />
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Envoi en cours…" : "✅ Soumettre pour vérification"}
          </button>
        </form>

        <p style={{ fontSize: 11, color: "var(--gray)", textAlign: "center", marginTop: 16 }}>
          Les informations soumises sont vérifiées par notre équipe avant d'être publiées.
        </p>
      </div>

      <BottomNav />
    </>
  );
}
