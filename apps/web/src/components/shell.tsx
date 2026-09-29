"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Gamepad2 } from "lucide-react";
import { ExperienceControls } from "./experience-controls";
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
  const [learning, setLearning] = useState(false);
  useEffect(() => {
    let active = true;
    api<{ eligible: boolean }>("/learning/access")
      .then((r) => {
        if (active) setLearning(r.eligible);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [path]);
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
          {learning ? (
            <Link
              href="/learn"
              aria-current={path === "/learn" ? "page" : undefined}
            >
              <Gamepad2 size={21} />
              Praticar programação
            </Link>
          ) : null}
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
          <div className="topbar-actions">
            <ExperienceControls />
            <Link className="button" href="/profile">
              Meu perfil
            </Link>
          </div>
        </header>
        <main id="content">{children}</main>
        <footer>
          <ShieldCheck size={20} /> Catálogo acadêmico com fontes verificadas.
        </footer>
      </div>
    </div>
  );
}
