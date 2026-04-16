import Link from "next/link";

export function scoreLabel(score) {
  const map = { A: "Sûr", B: "Vigilance légère", C: "Modéré", D: "Danger élevé" };
  return map[score] || "Non évalué";
}

export default function ToyCard({ toy, compact }) {
  const score = toy.score || "?";
  const cls = `score-${["A","B","C","D"].includes(score) ? score : "q"}`;
  const hasImage = toy.imageUrl && toy.imageUrl.startsWith("http");

  if (compact) {
    return (
      <Link href={`/jouet/${toy.id}`} style={{ textDecoration: "none" }}>
        <div className="card card-row" style={{ cursor: "pointer", gap: 12 }}>
          {/* Image miniature */}
          {hasImage ? (
            <img src={toy.imageUrl} alt={toy.name}
              style={{ width: 52, height: 52, objectFit: "contain", borderRadius: 8,
                background: "var(--light-bg)", flexShrink: 0, border: "1px solid var(--border)" }} />
          ) : (
            <div style={{ width: 52, height: 52, borderRadius: 8, background: "var(--green-light)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24, flexShrink: 0 }}>🧸</div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 600, fontSize: 14, color: "var(--dark)", marginBottom: 2,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{toy.name}</p>
            <p style={{ fontSize: 12, color: "var(--gray)" }}>{toy.brand} · {toy.age}</p>
            <div style={{ marginTop: 5 }}>
              {toy.danger === "Élevé" && <span className="tag tag-bad">⚠ Danger élevé</span>}
              {toy.danger === "Modéré" && <span className="tag tag-warn">Modéré</span>}
              {toy.danger === "Faible" && <span className="tag tag-ok">Sûr</span>}
              {!toy.danger && <span className="tag" style={{ background:"#f0f0f0", color:"#888" }}>Non évalué</span>}
            </div>
          </div>
          <div className={`score-badge ${cls}`}>{score}</div>
        </div>
      </Link>
    );
  }

  return (
    <div className="card">
      {/* Grande image */}
      {hasImage && (
        <img src={toy.imageUrl} alt={toy.name}
          style={{ width: "100%", maxHeight: 220, objectFit: "contain",
            borderRadius: 10, marginBottom: 14, background: "#f7fbf9" }} />
      )}
      <div className="card-row" style={{ marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: 17, marginBottom: 3 }}>{toy.name}</p>
          <p style={{ fontSize: 13, color: "var(--gray)" }}>{toy.brand}</p>
          <p style={{ fontSize: 12, color: "var(--gray)" }}>{toy.category} · {toy.age}</p>
        </div>
        <div className={`score-badge ${cls}`} style={{ width: 56, height: 56, fontSize: 26 }}>{score}</div>
      </div>
      <div className="card" style={{
        background: score==="D"?"#FCEBEB":score==="C"?"#FAEEDA":score==="B"?"#F7FBF9":"var(--green-light)",
        border:"none", padding:12, marginBottom:0
      }}>
        <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{scoreLabel(score)}</p>
        <p style={{ fontSize: 12, color: "var(--gray)" }}>Niveau de danger : {toy.danger || "Non évalué"}</p>
      </div>
    </div>
  );
}
