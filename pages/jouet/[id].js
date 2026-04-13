import { useRouter } from "next/router";
import BottomNav from "../../components/BottomNav";
import ToyCard, { scoreLabel } from "../../components/ToyCard";

export async function getServerSideProps({ params }) {
  const { id } = params;
  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(process.env.AIRTABLE_TABLE_NAME || "Table 1")}/${id}`,
      { headers: { Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}` } }
    );
    if (!res.ok) return { notFound: true };
    const record = await res.json();
    const f = record.fields;
    const toy = {
      id: record.id,
      name: f["Nom du jouet"] || "",
      barcode: f["Code-barres (EAN)"] || "",
      brand: f["Marque"] || "",
      category: f["Catégorie"] || "",
      age: f["Tranche d'âge"] || "",
      score: f["Score"] || "?",
      substances: f["Substances détectées"] || "Non renseigné",
      danger: f["Niveau de danger"] || "Non renseigné",
      link: f["Lien produit"] || "",
      status: f["Statut"] || "",
      alternative: f["Alternative recommandée"] || "",
      source: f["Source / Justification"] || "",
    };
    return { props: { toy } };
  } catch {
    return { notFound: true };
  }
}

function DangerDot({ level }) {
  const cls = level === "Élevé" ? "dot-red" : level === "Modéré" ? "dot-orange" : "dot-green";
  return <div className={`dot ${cls}`} />;
}

function ScoreBg(score) {
  return score === "D" ? "#FCEBEB" : score === "C" ? "#FAEEDA" : score === "B" ? "#F0F8E8" : "#E1F5EE";
}

export default function JouetPage({ toy }) {
  const router = useRouter();
  const substances = toy.substances.split(",").map(s => s.trim()).filter(Boolean);
  const isOk = toy.substances.toLowerCase().includes("aucune");

  return (
    <>
      <nav className="top-nav">
        <span style={{ fontSize: 20, cursor: "pointer" }} onClick={() => router.back()}>←</span>
        <span className="nav-title">Fiche produit</span>
        <div style={{ width: 24 }} />
      </nav>

      <div className="page-body">
        {/* Header produit */}
        <div className="card">
          <div className="card-row" style={{ marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{toy.name}</p>
              <p style={{ fontSize: 13, color: "var(--gray)", marginBottom: 2 }}>{toy.brand}</p>
              <p style={{ fontSize: 12, color: "var(--gray)" }}>{toy.category} · {toy.age}</p>
            </div>
            <div className={`score-badge score-${["A","B","C","D"].includes(toy.score) ? toy.score : "q"}`}
              style={{ width: 58, height: 58, fontSize: 28 }}>
              {toy.score}
            </div>
          </div>

          {/* Score bar */}
          <div style={{ background: ScoreBg(toy.score), borderRadius: 12, padding: "10px 14px" }}>
            <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{scoreLabel(toy.score)}</p>
            <p style={{ fontSize: 12, color: "var(--gray)" }}>Niveau de danger : {toy.danger}</p>
          </div>
        </div>

        {/* Substances */}
        <p className="section-title">Substances analysées</p>
        <div className="card">
          {isOk ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
              <div className="dot dot-green" />
              <p style={{ fontSize: 14 }}>Aucune substance préoccupante détectée</p>
            </div>
          ) : (
            substances.map((s, i) => {
              const isRed = ["PFAS", "Plomb", "Cadmium", "phtalates DEHP", "BPA"].some(k => s.toLowerCase().includes(k.toLowerCase()));
              const isOrange = !isRed;
              return (
                <div key={i} className="substance-row">
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500 }}>{s}</p>
                  </div>
                  <DangerDot level={isRed ? "Élevé" : "Modéré"} />
                </div>
              );
            })
          )}
        </div>

        {/* Alternative */}
        {toy.alternative && (
          <>
            <p className="section-title">Alternative recommandée</p>
            <div className="card" style={{ background: "var(--green-light)", border: "1px solid var(--green-mid)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 24 }}>✅</span>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14, color: "var(--green-dark)" }}>{toy.alternative}</p>
                  <p style={{ fontSize: 12, color: "var(--green-dark)", opacity: 0.8 }}>Option plus sûre recommandée</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Infos produit */}
        <p className="section-title">Informations</p>
        <div className="card">
          {[
            { label: "Marque", val: toy.brand },
            { label: "Catégorie", val: toy.category },
            { label: "Tranche d'âge", val: toy.age },
            { label: "Code-barres", val: toy.barcode || "Non renseigné" },
            { label: "Statut", val: toy.status },
            { label: "Source", val: toy.source },
          ].map((row, i) => (
            <div key={i} className="substance-row">
              <p style={{ fontSize: 12, color: "var(--gray)" }}>{row.label}</p>
              <p style={{ fontSize: 13, fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>{row.val}</p>
            </div>
          ))}
        </div>

        {/* Alertes PFAS/RAPEX */}
        {toy.danger === "Élevé" && (
          <div className="alert alert-danger">
            <span>⚠️</span>
            <div>
              <p style={{ fontWeight: 700, marginBottom: 2 }}>Produit déconseillé</p>
              <p>Ce jouet présente des substances dangereuses dépassant les seuils recommandés.</p>
            </div>
          </div>
        )}

        {toy.link && (
          <a href={toy.link} target="_blank" rel="noopener noreferrer"
            className="btn btn-outline" style={{ textDecoration: "none", marginTop: 8 }}>
            Voir le produit officiel ↗
          </a>
        )}
      </div>

      <BottomNav />
    </>
  );
}
