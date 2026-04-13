import Link from "next/link";
import BottomNav from "../components/BottomNav";

export default function Home() {
  return (
    <>
      <nav className="top-nav">
        <div className="logo">
          <div className="logo-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2L3 5v4c0 3 2.5 4.5 5 5 2.5-.5 5-2 5-5V5L8 2z" fill="white" opacity="0.9"/>
              <path d="M6 8l1.5 1.5L10 6.5" stroke="var(--green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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

        {/* Stats */}
        <div className="alert alert-info">
          <span style={{ fontSize: 18 }}>ℹ️</span>
          <div>
            <p style={{ fontWeight: 600, marginBottom: 2 }}>200 jouets référencés</p>
            <p>Base de données en cours de construction. Aidez-nous en soumettant des jouets !</p>
          </div>
        </div>

        {/* Les scores */}
        <p className="section-title">Comprendre les scores</p>
        <div className="card">
          {[
            { score: "A", label: "Sûr", desc: "Aucune substance préoccupante", cls: "score-A" },
            { score: "B", label: "Vigilance légère", desc: "Substances dans les limites réglementaires", cls: "score-B" },
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
      </div>

      <BottomNav />
    </>
  );
}
