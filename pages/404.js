// pages/404.js
import Link from "next/link";
import BottomNav from "../components/BottomNav";

export default function NotFound() {
  return (
    <>
      <nav className="top-nav">
        <div style={{ width: 24 }} />
        <span className="nav-title">SafeToys</span>
        <div style={{ width: 24 }} />
      </nav>

      <div className="page-body" style={{ textAlign: 'center', paddingTop: 60 }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>🧸</div>
        <p style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Page introuvable</p>
        <p style={{ fontSize: 14, color: 'var(--gray)', marginBottom: 32, lineHeight: 1.6 }}>
          Ce jouet ou cette page n'existe pas encore dans notre base.
          Vous pouvez le soumettre pour aider la communauté !
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link href="/" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            🏠 Retour à l'accueil
          </Link>
          <Link href="/scanner" className="btn btn-outline" style={{ textDecoration: 'none' }}>
            📷 Scanner un jouet
          </Link>
          <Link href="/soumettre" className="btn btn-outline" style={{ textDecoration: 'none' }}>
            ➕ Soumettre un jouet
          </Link>
        </div>
      </div>
      <BottomNav />
    </>
  );
}
