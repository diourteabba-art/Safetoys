// pages/index.js
import Link from "next/link";
import BottomNav from "../components/BottomNav";

export async function getServerSideProps() {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    const { count } = await supabase
      .from('produits')
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'verifie');
    return { props: { count: count || 0 } };
  } catch {
    return { props: { count: 0 } };
  }
}

export default function Home({ count }) {
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
        <div style={{ width: 24 }} />
      </nav>

      <div className="page-body">
        {/* Hero — style sombre original */}
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

        {/* Compteur dynamique Supabase */}
        <div className="alert alert-info" style={{ marginBottom: 20 }}>
          <span style={{ fontSize: 18 }}>🛡️</span>
          <div>
            <p style={{ fontWeight: 600, marginBottom: 2 }}>
              {count > 0 ? `${count} jouets référencés` : 'Base en construction'}
            </p>
            <p style={{ fontSize: 12 }}>
              Base mise à jour en continu. Aidez-nous en soumettant des jouets !
            </p>
          </div>
        </div>

        {/* Comprendre les scores */}
        <p className="section-title">Comprendre les scores</p>
        <div className="card">
          {[
            { score: "A", label: "Sûr",              desc: "Aucune substance réglementée identifiée",              cls: "score-A" },
            { score: "B", label: "Vigilance légère",  desc: "Substances sous surveillance réglementaire",           cls: "score-B" },
            { score: "C", label: "Modéré",            desc: "Substances soumises à restriction REACH/EN 71",       cls: "score-C" },
            { score: "D", label: "Danger élevé",      desc: "Substances interdites ou fortement restreintes",       cls: "score-D" },
          ].map((s, i, arr) => (
            <div key={s.score} className="card-row"
              style={{ padding: "8px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div className={`score-badge ${s.cls}`} style={{ width: 36, height: 36, fontSize: 16 }}>{s.score}</div>
              <div style={{ flex: 1, marginLeft: 12 }}>
                <p style={{ fontWeight: 600, fontSize: 13 }}>{s.label}</p>
                <p style={{ fontSize: 11, color: "var(--gray)" }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div style={{ background: 'var(--light-bg)', borderRadius: 12, padding: '12px 14px', marginTop: 16 }}>
          <p style={{ fontSize: 11, color: 'var(--gray)', lineHeight: 1.6 }}>
            🔬 Scores calculés selon ECHA/REACH/EN 71. Les informations SafeToys sont indicatives
            et ne remplacent pas un test de laboratoire accrédité.
          </p>
        </div>
      </div>

      <BottomNav />
    </>
  );
}
