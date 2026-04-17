// pages/recherche.js
import { useState } from "react";
import Link from "next/link";
import BottomNav from "../components/BottomNav";

// Normaliser les accents pour la recherche
function normalize(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export default function Recherche() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim() || query.trim().length < 2) return;
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

  async function handleChange(e) {
    const val = e.target.value;
    setQuery(val);
    if (val.length >= 3) {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(val.trim())}`);
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
        setSearched(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    } else {
      setResults([]);
      setSearched(false);
    }
  }

  const SCORE_COLOR = { A: '#085041', B: '#27500A', C: '#633806', D: '#501313' };
  const SCORE_BG    = { A: '#E1F5EE', B: '#F0F8E8', C: '#FAEEDA', D: '#FCEBEB' };

  return (
    <>
      <nav className="top-nav">
        <div style={{ width: 24 }} />
        <span className="nav-title">Rechercher</span>
        <div style={{ width: 24 }} />
      </nav>

      <div className="page-body">
        <form onSubmit={handleSearch} style={{ marginBottom: 16 }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%',
              transform: 'translateY(-50%)', fontSize: 18, pointerEvents: 'none' }}>🔍</span>
            <input
              className="search-input"
              style={{ paddingLeft: 42 }}
              type="text"
              placeholder="Nom du jouet, marque…"
              value={query}
              onChange={handleChange}
              autoFocus
            />
          </div>
        </form>

        {loading && (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <div className="spinner" />
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="empty">
            <div className="empty-icon">🔍</div>
            <p style={{ fontWeight: 600, marginBottom: 8 }}>Aucun résultat pour "{query}"</p>
            <p style={{ fontSize: 13, color: 'var(--gray)', marginBottom: 20 }}>
              Ce jouet n'est pas encore dans notre base.
            </p>
            <Link href={`/soumettre?name=${encodeURIComponent(query)}`}
              className="btn btn-primary"
              style={{ textDecoration: 'none', display: 'inline-block' }}>
              ➕ Soumettre ce jouet
            </Link>
          </div>
        )}

        {!loading && results.length > 0 && (
          <>
            <p style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 12 }}>
              {results.length} résultat{results.length > 1 ? 's' : ''} pour "{query}"
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {results.map(toy => {
                const score = toy.score || '?';
                const bg = SCORE_BG[score] || '#f0f0f0';
                const col = SCORE_COLOR[score] || '#888';
                return (
                  <Link key={toy.id} href={`/jouet/${toy.id}`}
                    style={{ textDecoration: 'none' }}>
                    <div className="card card-row" style={{ gap: 12, alignItems: 'center' }}>
                      {/* Image ou placeholder */}
                      {toy.imageUrl ? (
                        <img src={toy.imageUrl} alt={toy.name}
                          style={{ width: 56, height: 56, objectFit: 'contain',
                            borderRadius: 10, background: '#f7fbf9', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 56, height: 56, borderRadius: 10,
                          background: bg, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                          🧸
                        </div>
                      )}

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 2,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {toy.name}
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 4 }}>
                          {toy.brand}{toy.age ? ` · ${toy.age}` : ''}
                        </p>
                        {toy.category && (
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10,
                            background: 'var(--light-bg)', color: 'var(--gray)' }}>
                            {toy.category}
                          </span>
                        )}
                      </div>

                      <div className={`score-badge score-${['A','B','C','D'].includes(score) ? score : 'q'}`}
                        style={{ width: 40, height: 40, fontSize: 18, flexShrink: 0 }}>
                        {score}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {!searched && (
          <div style={{ marginTop: 8 }}>
            <p className="section-title">Recherches populaires</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['LEGO','Playmobil','Djeco','Kapla','Ravensburger','Hape','Janod','Pokémon','Dobble','Chicco'].map(tag => (
                <button key={tag}
                  onClick={() => { setQuery(tag); handleChange({ target: { value: tag } }); }}
                  style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border)',
                    background: 'var(--light-bg)', fontSize: 13, cursor: 'pointer',
                    color: 'var(--dark)' }}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </>
  );
}
