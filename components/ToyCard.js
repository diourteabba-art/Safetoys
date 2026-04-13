import Link from "next/link";

export function scoreLabel(score) {
  const map = { A: "Sûr", B: "Vigilance légère", C: "Modéré", D: "Danger élevé" };
  return map[score] || "Inconnu";
}

export default function ToyCard({ toy, compact }) {
  const score = toy.score || "?";
  const cls = `score-${["A","B","C","D"].includes(score) ? score : "q"}`;

  if (compact) {
    return (
      <Link href={`/jouet/${toy.id}`} style={{ textDecoration: "none" }}>
        <div className="card card-row" style={{ cursor: "pointer" }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 600, fontSize: 14, color: "var(--dark)", marginBottom: 2 }}>{toy.name}</p>
            <p style={{ fontSize: 12, color: "var(--gray)" }}>{toy.brand} · {toy.age}</p>
            <div style={{ marginTop: 6 }}>
              {toy.danger === "Élevé" && <span className="tag tag-bad">⚠ Danger élevé</span>}
              {toy.danger === "Modéré" && <span className="tag tag-warn">Modéré</span>}
              {toy.danger === "Faible" && <span className="tag tag-ok">Sûr</span>}
            </div>
          </div>
          <div className={`score-badge ${cls}`}>{score}</div>
        </div>
      </Link>
    );
  }

  return (
    <div className="card">
      <div className="card-row" style={{ marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: 17, marginBottom: 3 }}>{toy.name}</p>
          <p style={{ fontSize: 13, color: "var(--gray)" }}>{toy.brand}</p>
          <p style={{ fontSize: 12, color: "var(--gray)" }}>{toy.category} · {toy.age}</p>
        </div>
        <div className={`score-badge ${cls}`} style={{ width: 56, height: 56, fontSize: 26 }}>{score}</div>
      </div>

      <div className="card" style={{ background: score === "D" ? "#FCEBEB" : score === "C" ? "#FAEEDA" : score === "B" ? "#F7FBF9" : "var(--green-light)", border: "none", padding: 12, marginBottom: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
          {scoreLabel(score)}
        </p>
        <p style={{ fontSize: 12, color: "var(--gray)" }}>Niveau de danger : {toy.danger}</p>
      </div>
    </div>
  );
}
