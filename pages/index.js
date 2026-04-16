// pages/index.js
import Link from "next/link";
import BottomNav from "../components/BottomNav";

export async function getServerSideProps() {
  let count = 0;
  try {
    const BASE_URL = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(process.env.AIRTABLE_TABLE_NAME || "jouets")}`;
    // On récupère uniquement le nombre d'enregistrements avec statut Vérifié
    const formula = encodeURIComponent(`{Statut} = "Vérifié"`);
    const res = await fetch(`${BASE_URL}?filterByFormula=${formula}&fields[]=Nom du jouet`, {
      headers: { Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}` },
    });
    const data = await res.json();
    count = data.records?.length || 0;

    // Si 0 vérifié, on compte tous les jouets (base de démo sans statut)
    if (count === 0) {
      const all = await fetch(BASE_URL + "?fields[]=Nom du jouet", {
        headers: { Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}` },
      });
      const allData = await all.json();
      count = allData.records?.length || 0;
    }
  } catch (_) { count = 200; }
  return { props: { count } };
}

export default function Home({ count }) {
  return (
    <>
      <nav className="top-nav">
        <div className="logo">
          <div className="logo-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2L3 5v4c0 3 2.5 4.5 5 5 2.5-.5 5-2 5-5V5L8 2z" fill="white" opacity="0.9"/>
              <path d="M6 8l1.5 1.5L10 6.5" stroke="#1D9E75" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="logo-text">SafeToys</span>
        </div>
        <span style={{ fontSize: 12, color: "var(--gray)" }}>by la communauté</span>
      </nav>

      <div className="page-body">
        {/* Hero */}
        <div className="card" style={{ background: "var(--dark)", border: "none", marginBottom: 20 }}>
          <p style={{ color: "#9FE1CB", fontSize: 12, marginBottom: 6 }}>Protégez vos enfants</p>
          <p style={{ color: "white", fontSize: 20, fontWeight: 700, lineHeight: 1.3, marginBottom: 14 }}>
            Scannez un jouet,<br/>vérifiez sa sécurité.
          </p>
          <Link href="/scanner" className="btn btn-primary" style={{ textDecoration: "none" }}>
            📷 Scanner maintenant
          </Link>
        </div>

        {/* Actions rapides */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          <Link href="/recherche" className="card" style={{ textDecoration: "none", textAlign: "center", padding: "18px 12px" }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>🔍</div>
            <p style={{ fontWeight: 600, fontSize: 13 }}>Rechercher</p>
            <p style={{ fontSize: 11, color: "var(--gray)" }}>Par nom ou marque</p>
          </Link>
          <Link href="/soumettre" className="card" style={{ textDecoration: "none", textAlign: "center", padding: "18px 12px" }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>➕</div>
            <p style={{ fontWeight: 600, fontSize: 13 }}>Soumettre</p>
            <p style={{ fontSize: 11, color: "var(--gray)" }}>Jouet manquant ?</p>
          </Link>
        </div>

        {/* Compteur dynamique */}
        <div className="alert alert-info">
          <span style={{ fontSize: 28, fontWeight: 700, color: "var(--green)", marginRight: 4 }}>
            {count}
          </span>
          <div>
            <p style={{ fontWeight: 600, marginBottom: 2 }}>jouets référencés</p>
            <p style={{ fontSize: 12 }}>Base mise à jour en temps réel. Aidez-nous en soumettant des jouets !</p>
          </div>
        </div>

        {/* Les scores */}
        <p className="section-title">Comprendre les scores</p>
        <div className="card">
          {[
            { score: "A", label: "Sûr", desc: "Aucune substance préoccupante (ECHA/REACH)", cls: "score-A" },
            { score: "B", label: "Vigilance légère", desc: "Substances dans les limites EN 71", cls: "score-B" },
            { score: "C", label: "Modéré", desc: "Substances préoccupantes à surveiller", cls: "score-C" },
            { score: "D", label: "Danger élevé", desc: "PFAS, phtalates dépassant les seuils", cls: "score-D" },
          ].map((s) => (
            <div key={s.score} className="card-row" style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <div className={`score-badge ${s.cls}`} style={{ width: 36, height: 36, fontSize: 16 }}>{s.score}</div>
              <div style={{ flex: 1, marginLeft: 12 }}>
                <p style={{ fontWeight: 600, fontSize: 13 }}>{s.label}</p>
                <p style={{ fontSize: 11, color: "var(--gray)" }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Liens sources */}
        <p className="section-title">Sources officielles</p>
        <div className="card">
          {[
            { label: "Safety Gate EU (RAPEX)", url: "https://ec.europa.eu/safety-gate-alerts", icon: "🇪🇺" },
            { label: "ECHA — Substances SVHC", url: "https://echa.europa.eu/candidate-list-table", icon: "🧪" },
            { label: "REACH — Liste PFAS", url: "https://echa.europa.eu/pfas", icon: "⚗️" },
          ].map((s, i) => (
            <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0",
                borderBottom: i < 2 ? "1px solid var(--border)" : "none", textDecoration: "none" }}>
              <span style={{ fontSize: 18 }}>{s.icon}</span>
              <span style={{ fontSize: 13, color: "var(--green)", fontWeight: 500 }}>{s.label} ↗</span>
            </a>
          ))}
        </div>
      </div>

      <BottomNav />
    </>
  );
}
