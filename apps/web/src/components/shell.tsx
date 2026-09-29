"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Home,
  Search,
  Car,
  Settings,
  ShieldCheck,
} from "lucide-react";
const links = [
  { href: "/home", label: "Início", icon: Home },
  { href: "/explore", label: "Explorar", icon: Search },
  { href: "/subjects", label: "Minhas matérias", icon: BookOpen },
  { href: "/caronas", label: "Caronas", icon: Car },
  { href: "/settings", label: "Configurações", icon: Settings },
];
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="app-shell">
      <a className="skip" href="#content">
        Pular para o conteúdo
      </a>
      <aside className="sidebar">
        <Link href="/home" className="brand">
          <BookOpen size={40} />
          <span>
            enturma<span className="dot">.</span>
          </span>
        </Link>
        <nav aria-label="Principal">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={path === href ? "page" : undefined}
            >
              <Icon size={21} />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span>
            {links.find((l) => l.href === path)?.label ?? "Seu espaço"}
          </span>
          <Link className="button" href="/profile">
            Meu perfil
          </Link>
        </header>
        <main id="content">{children}</main>
        <footer>
          <ShieldCheck size={20} /> Catálogo acadêmico com fontes verificadas.
        </footer>
      </div>
    </div>
  );
}
