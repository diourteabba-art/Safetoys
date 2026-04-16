// pages/jouet/[id].js
// Fiche produit avec image, RAPEX check, ECHA/REACH, et sauvegarde historique

import { useEffect } from "react";
import { useRouter } from "next/router";
import BottomNav from "../../components/BottomNav";
import { scoreLabel } from "../../components/ToyCard";
import { saveToHistory } from "../historique";

export async function getServerSideProps({ params }) {
  const { id } = params;
  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(process.env.AIRTABLE_TABLE_NAME || "jouets")}/${id}`,
      { headers: { Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}` } }
    );
    if (!res.ok) return { notFound: true };
    const record = await res.json();
    const f = record.fields;
    const toy = {
      id: record.id,
      name: f["Nom du jouet"] || "",
      barcode: String(f["Code-barres (EAN)"] || ""),
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
      imageUrl: f["Image URL"] || "",
    };

    // Vérifier si le jouet est dans les alertes RAPEX
    let rapexAlert = null;
    try {
      const rapexRes = await fetch(
        `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"}/api/rapex?keyword=${encodeURIComponent(toy.name)}`,
        { signal: AbortSignal.timeout(5000) }
      );
      const rapexData = await rapexRes.json();
      if (rapexData.alerts?.length > 0) {
        rapexAlert = rapexData.alerts[0];
      }
    } catch (_) {}

    // Vérifier les substances sur ECHA/REACH
    const substancesList = toy.substances.split(",").map(s => s.trim()).filter(Boolean);
    let echaWarnings = [];
    for (const sub of substancesList.slice(0, 3)) {
      try {
        const echaRes = await fetch(
          `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"}/api/substances?name=${encodeURIComponent(sub)}`,
          { signal: AbortSignal.timeout(3000) }
        );
        const echaData = await echaRes.json();
        if (echaData.found) echaWarnings.push(...echaData.results);
      } catch (_) {}
    }

    return { props: { toy, rapexAlert, echaWarnings } };
  } catch { return { notFound: true }; }
}

function DangerDot({ level }) {
  const cls = level === "Élevé" ? "dot-red" : level === "Modéré" ? "dot-orange" : "dot-green";
  return <div className={`dot ${cls}`} />;
}

export default function JouetPage({ toy, rapexAlert, echaWarnings }) {
  const router = useRouter();
  const substances = toy.substances.split(",").map(s => s.trim()).filter(Boolean);
  const isOk = toy.substances.toLowerCase().includes("aucune");
  const score = toy.score;
  const scoreBg = score==="D"?"#FCEBEB":score==="C"?"#FAEEDA":score==="B"?"#F0F8E8":"#E1F5EE";

  // Sauvegarder dans l'historique au chargement
  useEffect(() => {
    saveToHistory(toy);
  }, [toy.id]);

  return (
    <>
      <nav className="top-nav">
        <span style={{ fontSize: 20, cursor: "pointer" }} onClick={() => router.back()}>←</span>
        <span className="nav-title">Fiche produit</span>
        <div style={{ width: 24 }} />
      </nav>

      <div className="page-body">

        {/* Alerte RAPEX si applicable */}
        {rapexAlert && (
          <div className="alert alert-danger" style={{ marginBottom: 16 }}>
            <span>🚨</span>
            <div>
              <p style={{ fontWeight: 700, marginBottom: 2 }}>Alerte Safety Gate EU !</p>
              <p style={{ fontSize: 12 }}>{rapexAlert.description}</p>
              <a href={rapexAlert.url} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 11, color: "#501313", fontWeight: 600 }}>Voir l'alerte officielle ↗</a>
            </div>
          </div>
        )}

        {/* Image du produit */}
        {toy.imageUrl && (
          <div style={{ background: "#f7fbf9", borderRadius: 16, marginBottom: 16,
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden", border: "1px solid var(--border)" }}>
            <img src={toy.imageUrl} alt={toy.name}
              style={{ width: "100%", maxHeight: 220, objectFit: "contain" }} />
          </div>
        )}

        {/* Header produit */}
        <div className="card">
          <div className="card-row" style={{ marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{toy.name}</p>
              <p style={{ fontSize: 13, color: "var(--gray)", marginBottom: 2 }}>{toy.brand}</p>
              <p style={{ fontSize: 12, color: "var(--gray)" }}>{toy.category} · {toy.age}</p>
            </div>
            <div className={`score-badge score-${["A","B","C","D"].includes(score)?score:"q"}`}
              style={{ width: 58, height: 58, fontSize: 28 }}>{score}</div>
          </div>
          <div style={{ background: scoreBg, borderRadius: 12, padding: "10px 14px" }}>
            <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{scoreLabel(score)}</p>
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
              const isRed = ["PFAS","Plomb","Cadmium","DEHP","BPA","Borax","azoïque","bromé"].some(k => s.toLowerCase().includes(k.toLowerCase()));
              // Chercher info ECHA
              const echaMatch = echaWarnings.find(w => w.name.toLowerCase().includes(s.toLowerCase().split(" ")[0]));
              return (
                <div key={i} className="substance-row">
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 500 }}>{s}</p>
                    {echaMatch && (
                      <p style={{ fontSize: 11, color: isRed ? "#A32D2D" : "#854F0B", marginTop: 2 }}>
                        {echaMatch.category} · {echaMatch.danger?.substring(0, 60)}…
                      </p>
                    )}
                    {echaMatch && (
                      <span style={{ fontSize: 10, background: "#E6F1FB", color: "#185FA5",
                        padding: "1px 6px", borderRadius: 10, fontWeight: 500 }}>
                        Source : {echaMatch.source}
                      </span>
                    )}
                  </div>
                  <DangerDot level={isRed ? "Élevé" : "Modéré"} />
                </div>
              );
            })
          )}
        </div>

        {/* Sources ECHA/REACH */}
        {echaWarnings.length > 0 && (
          <>
            <p className="section-title">Références réglementaires</p>
            <div className="card">
              {echaWarnings.slice(0, 3).map((w, i) => (
                <div key={i} style={{ padding: "8px 0", borderBottom: i < echaWarnings.length-1 ? "1px solid var(--border)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 10, background: "#E1F5EE", color: "#085041",
                      padding: "1px 6px", borderRadius: 10, fontWeight: 600 }}>{w.source}</span>
                    <span style={{ fontSize: 11, color: "var(--gray)" }}>{w.category}</span>
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 500, marginBottom: 2 }}>{w.name}</p>
                  {w.limit && <p style={{ fontSize: 11, color: "var(--gray)" }}>Limite : {w.limit}</p>}
                  <a href={w.sourceUrl} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 10, color: "#185FA5" }}>Voir sur {w.source} ↗</a>
                </div>
              ))}
            </div>
          </>
        )}

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
