import Link from "next/link";
import BottomNav from "../components/BottomNav";

export default function NotFound() {
  return (
    <>
      <div className="page-body" style={{ textAlign: "center", paddingTop: 80 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🧸</div>
        <p style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Page introuvable</p>
        <p style={{ color: "var(--gray)", marginBottom: 24 }}>Ce jouet s'est peut-être égaré…</p>
        <Link href="/" className="btn btn-primary" style={{ textDecoration: "none" }}>Retour à l'accueil</Link>
      </div>
      <BottomNav />
    </>
  );
}
