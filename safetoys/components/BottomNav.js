import Link from "next/link";
import { useRouter } from "next/router";

export default function BottomNav() {
  const { pathname } = useRouter();
  const items = [
    { href: "/", icon: "⊞", label: "Accueil" },
    { href: "/scanner", icon: "◎", label: "Scanner" },
    { href: "/recherche", icon: "⌕", label: "Recherche" },
    { href: "/soumettre", icon: "+", label: "Soumettre" },
  ];
  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`bnav-item${pathname === item.href ? " active" : ""}`}
        >
          <span className="bnav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
