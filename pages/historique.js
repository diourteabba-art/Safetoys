// pages/historique.js
// Historique personnel stocké dans localStorage du navigateur

import { useState, useEffect } from "react";
import Link from "next/link";
import BottomNav from "../components/BottomNav";

const HISTORY_KEY = "safetoys_history";
const MAX_ITEMS = 50;

export function saveToHistory(toy) {
  if (typeof window === "undefined") return;
  try {
    const existing = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    const filtered = existing.filter(t => t.id !== toy.id);
    const updated = [{ ...toy, scannedAt: new Date().toISOString() }, ...filtered].slice(0, MAX_ITEMS);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (_) {}
}

export function getHistory() {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
}

export function clearHistory() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(HISTORY_KEY);
}

const SCORE_STYLE = {
  A: { bg: "#9FE1CB", color: "#085041" },
  B: { bg: "#C0DD97", color: "#27500A" },
  C: { bg: "#FAC775", color: "#633806" },
  D: { bg: "#F7C1C1", color: "#501313" },
};

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days === 1) return "Hier";
  return `Il y a ${days} jours`;
}

export default function Historique() {
  const [history, setHistory] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  function handleClear() {
    clearHistory();
    setHistory([]);
    setShowConfirm(false);
  }

  // Stats
  const stats = {
    total: history.length,
    safe: history.filter(t => t.score === "A" || t.score === "B").length,
    danger: history.filter(t => t.score === "D").length,
    moderate: history.filter(t => t.score === "C").length,
  };

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
          <span className="logo-text">Mon historique</span>
        </div>
        {history.length > 0 && (
          <button onClick={() => setShowConfirm(true)}
            style={{ fontSize: 12, color: "#E24B4A", background: "none", border: "none", cursor: "pointer" }}>
            Effacer
          </button>
        )}
      </nav>

      <div className="page-body">

        {/* Confirmation effacement */}
        {showConfirm && (
          <div style={{ background: "#FCEBEB", borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <p style={{ fontWeight: 600, marginBottom: 8, color: "#501313" }}>Effacer l'historique ?</p>
            <p style={{ fontSize: 13, color: "#793232", marginBottom: 12 }}>Cette action est irréversible.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-sm" onClick={handleClear}
                style={{ background: "#E24B4A", color: "white", border: "none" }}>Confirmer</button>
              <button className="btn btn-sm btn-outline" onClick={() => setShowConfirm(false)}>Annuler</button>
            </div>
          </div>
        )}

        {history.length === 0 ? (
          <div className="empty" style={{ paddingTop: 60 }}>
            <div className="empty-icon">📋</div>
            <p style={{ fontWeight: 600, marginBottom: 8 }}>Aucun historique</p>
            <p style={{ fontSize: 13, color: "var(--gray)", marginBottom: 24 }}>
              Les jouets que vous scannez ou recherchez apparaîtront ici automatiquement.
            </p>
            <Link href="/scanner" className="btn btn-primary btn-sm" style={{ textDecoration: "none" }}>
              Scanner un jouet
            </Link>
          </div>
        ) : (
          <>
            {/* Stats résumé */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
              {[
                { label: "Scannés", val: stats.total, bg: "var(--color-background-secondary)" },
                { label: "Sûrs", val: stats.safe, bg: "#E1F5EE" },
                { label: "Danger", val: stats.danger, bg: "#FCEBEB" },
              ].map((s, i) => (
                <div key={i} style={{ background: s.bg, borderRadius: 12, padding: "12px 8px", textAlign: "center" }}>
                  <p style={{ fontSize: 22, fontWeight: 700, marginBottom: 2 }}>{s.val}</p>
                  <p style={{ fontSize: 11, color: "var(--gray)" }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Info localStorage */}
            <div className="alert alert-info" style={{ marginBottom: 16 }}>
              <span>🔒</span>
              <p style={{ fontSize: 12 }}>Votre historique est stocké uniquement sur cet appareil. Aucune donnée n'est envoyée à nos serveurs.</p>
            </div>

            <p className="section-title">{history.length} jouet{history.length > 1 ? "s" : ""} consulté{history.length > 1 ? "s" : ""}</p>

            {/* Liste */}
            {history.map((toy, i) => {
              const score = toy.score || "?";
              const sc = SCORE_STYLE[score] || { bg: "#f0f0f0", color: "#888" };
              return (
                <Link key={i} href={`/jouet/${toy.id}`} style={{ textDecoration: "none" }}>
                  <div className="card card-row" style={{ cursor: "pointer", marginBottom: 10 }}>
                    {/* Image */}
                    {toy.imageUrl ? (
                      <img src={toy.imageUrl} alt={toy.name}
                        style={{ width: 48, height: 48, objectFit: "contain", borderRadius: 8,
                          background: "var(--light-bg)", flexShrink: 0, border: "1px solid var(--border)" }} />
                    ) : (
                      <div style={{ width: 48, height: 48, borderRadius: 8, background: "#E1F5EE",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🧸</div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 2,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{toy.name}</p>
                      <p style={{ fontSize: 12, color: "var(--gray)", marginBottom: 3 }}>{toy.brand}</p>
                      <p style={{ fontSize: 11, color: "var(--gray)" }}>{timeAgo(toy.scannedAt)}</p>
                    </div>

                    {/* Score badge */}
                    <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: sc.bg, color: sc.color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 700, fontSize: 16 }}>
                      {score}
                    </div>
                  </div>
                </Link>
              );
            })}
          </>
        )}
      </div>

      <BottomNav />
    </>
  );
}
