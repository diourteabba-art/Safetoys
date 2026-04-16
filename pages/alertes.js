// pages/alertes.js
import { useState, useEffect } from "react";
import BottomNav from "../components/BottomNav";

const RISK_COLOR = {
  "Grave":  { bg: "#FCEBEB", color: "#501313", dot: "#E24B4A", badge: "#F7C1C1" },
  "Moyen":  { bg: "#FAEEDA", color: "#633806", dot: "#EF9F27", badge: "#FAC775" },
  "Faible": { bg: "#E1F5EE", color: "#085041", dot: "#1D9E75", badge: "#9FE1CB" },
};

function getRiskColor(level) {
  return RISK_COLOR[level] || RISK_COLOR["Moyen"];
}

export default function Alertes() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    fetch("/api/rapex")
      .then(r => r.json())
      .then(data => {
        setAlerts(data.alerts || []);
        setFiltered(data.alerts || []);
      })
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!search.trim()) { setFiltered(alerts); return; }
    const q = search.toLowerCase();
    setFiltered(alerts.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.brand.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q)
    ));
  }, [search, alerts]);

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
          <span className="logo-text">Alertes RAPEX</span>
        </div>
        <span style={{ fontSize: 11, color: "var(--gray)" }}>Safety Gate EU</span>
      </nav>

      <div className="page-body">
        {/* Bannière info */}
        <div className="alert alert-warn" style={{ marginBottom: 16 }}>
          <span>⚠️</span>
          <div>
            <p style={{ fontWeight: 600, marginBottom: 2 }}>Alertes officielles européennes</p>
            <p style={{ fontSize: 12 }}>Source : Safety Gate (Commission Européenne). Jouets retirés du marché pour danger chimique ou physique.</p>
          </div>
        </div>

        {/* Recherche */}
        <input
          className="search-input"
          style={{ marginBottom: 16 }}
          type="text"
          placeholder="Rechercher un jouet, une marque…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {/* Sources */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {[
            { label: "Safety Gate EU", url: "https://ec.europa.eu/safety-gate-alerts", color: "#185FA5" },
            { label: "ECHA REACH", url: "https://echa.europa.eu/candidate-list-table", color: "#1D9E75" },
            { label: "PFAS List", url: "https://echa.europa.eu/pfas", color: "#993556" },
          ].map(s => (
            <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20,
                background: s.color + "15", color: s.color, border: `1px solid ${s.color}40`,
                textDecoration: "none", fontWeight: 500 }}>
              ↗ {s.label}
            </a>
          ))}
        </div>

        {loading && <div className="spinner" />}

        {!loading && filtered.length === 0 && (
          <div className="empty">
            <div className="empty-icon">✅</div>
            <p style={{ fontWeight: 600 }}>Aucune alerte trouvée</p>
            <p style={{ fontSize: 13, color: "var(--gray)" }}>Aucun rappel correspondant à votre recherche.</p>
          </div>
        )}

        {/* Liste des alertes */}
        {!loading && filtered.map((alert, i) => {
          const c = getRiskColor(alert.riskLevel);
          const isOpen = expanded === i;
          return (
            <div key={i} className="card" style={{ marginBottom: 10, borderLeft: `3px solid ${c.dot}`, cursor: "pointer" }}
              onClick={() => setExpanded(isOpen ? null : i)}>

              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  {/* Badge risque */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20,
                      background: c.badge, color: c.color, fontWeight: 600 }}>
                      ⚠ {alert.riskLevel || "Risque"}
                    </span>
                    <span style={{ fontSize: 10, color: "var(--gray)" }}>{alert.date}</span>
                    <span style={{ fontSize: 10, color: "var(--gray)" }}>{alert.country}</span>
                  </div>

                  <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{alert.title}</p>
                  {alert.brand && <p style={{ fontSize: 12, color: "var(--gray)", marginBottom: 4 }}>{alert.brand}</p>}

                  {/* Résumé risque */}
                  <div style={{ background: c.bg, borderRadius: 8, padding: "6px 10px", marginBottom: isOpen ? 10 : 0 }}>
                    <p style={{ fontSize: 12, color: c.color }}>{alert.risk}</p>
                  </div>

                  {/* Détails dépliés */}
                  {isOpen && (
                    <div style={{ marginTop: 10 }}>
                      <p style={{ fontSize: 13, color: "var(--dark)", marginBottom: 8, lineHeight: 1.5 }}>
                        {alert.description}
                      </p>
                      {alert.measures && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--dark)" }}>Mesures :</span>
                          <span style={{ fontSize: 12, color: "var(--gray)" }}>{alert.measures}</span>
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 8 }}>
                        <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20,
                          background: "var(--green-light)", color: "var(--green-dark)", fontWeight: 500 }}>
                          Réf. {alert.id}
                        </span>
                        <a href={alert.url} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20,
                            background: "#E6F1FB", color: "#185FA5", fontWeight: 500,
                            textDecoration: "none" }}>
                          ↗ Voir sur Safety Gate
                        </a>
                      </div>
                    </div>
                  )}
                </div>
                <span style={{ color: "var(--gray)", fontSize: 16, flexShrink: 0, marginTop: 2 }}>
                  {isOpen ? "▲" : "▼"}
                </span>
              </div>
            </div>
          );
        })}

        {/* Lien vers Safety Gate complet */}
        <a href="https://ec.europa.eu/safety-gate-alerts/screen/consumer"
          target="_blank" rel="noopener noreferrer"
          className="btn btn-outline"
          style={{ textDecoration: "none", marginTop: 8, display: "block" }}>
          Voir toutes les alertes sur Safety Gate ↗
        </a>
      </div>

      <BottomNav />
    </>
  );
}
