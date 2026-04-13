import { useState, useCallback } from "react";
import { useRouter } from "next/router";
import BottomNav from "../components/BottomNav";
import ToyCard from "../components/ToyCard";

export default function Recherche() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const router = useRouter();

  async function handleSearch(e) {
    e.preventDefault();
    if (query.trim().length < 2) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <nav className="top-nav">
        <span style={{ fontSize: 20, cursor: "pointer" }} onClick={() => router.back()}>←</span>
        <span className="nav-title">Rechercher</span>
        <div style={{ width: 24 }} />
      </nav>

      <div className="page-body">
        <form onSubmit={handleSearch} style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              className="search-input"
              style={{ flex: 1 }}
              type="text"
              placeholder="Nom du jouet, marque…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
            />
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              style={{ flexShrink: 0 }}
            >
              Chercher
            </button>
          </div>
        </form>

        {loading && <div className="spinner" />}

        {!loading && searched && results.length === 0 && (
          <div className="empty">
            <div className="empty-icon">🔍</div>
            <p style={{ fontWeight: 600, marginBottom: 8 }}>Aucun résultat</p>
            <p style={{ fontSize: 13, marginBottom: 16 }}>Ce jouet n'est pas encore référencé.</p>
            <a
              href={`/soumettre?name=${encodeURIComponent(query)}`}
              className="btn btn-primary btn-sm"
              style={{ textDecoration: "none" }}
            >
              ➕ Le soumettre
            </a>
          </div>
        )}

        {!loading && results.length > 0 && (
          <>
            <p className="section-title">{results.length} résultat{results.length > 1 ? "s" : ""}</p>
            {results.map(toy => (
              <ToyCard key={toy.id} toy={toy} compact />
            ))}
          </>
        )}

        {!searched && (
          <div className="empty">
            <div className="empty-icon">🧸</div>
            <p style={{ fontSize: 14, color: "var(--gray)" }}>Tapez le nom d'un jouet ou d'une marque pour commencer</p>
          </div>
        )}
      </div>

      <BottomNav />
    </>
  );
}
