// components/BottomNav.js
import Link from "next/link";
import { useRouter } from "next/router";

export default function BottomNav() {
  const { pathname } = useRouter();
  const items = [
    { href: "/", icon: "⊞", label: "Accueil" },
    { href: "/scanner", icon: "◎", label: "Scanner" },
    { href: "/recherche", icon: "⌕", label: "Recherche" },
    { href: "/alertes", icon: "⚠", label: "Alertes" },
    { href: "/historique", icon: "◷", label: "Historique" },
  ];
  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <Link key={item.href} href={item.href}
          className={`bnav-item${pathname === item.href ? " active" : ""}`}>
          <span className="bnav-icon" style={{ fontSize: item.href === "/alertes" ? 16 : 20 }}>
            {item.icon}
          </span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
