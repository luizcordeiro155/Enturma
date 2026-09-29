"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Profile } from "@enturma/contracts";
import { Gamepad2 } from "lucide-react";
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
  const [me, setMe] = useState<Profile>();
  useEffect(() => {
    let active = true;
    Promise.all([
      api<{ eligible: boolean }>("/learning/access").catch(() => ({ eligible: false })),
      api<Profile>("/users/me").catch(() => undefined),
    ]).then(([learningAccess, profile]) => {
      if (!active) return;
      setLearning(learningAccess.eligible);
      if (profile) setMe(profile);
    });
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
          <Link className="topbar-profile" href="/profile" aria-label="Abrir meu perfil">
            <span className="topbar-profile-avatar">
              {me?.hasAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/api/backend/users/${me.id}/avatar`} alt="" />
              ) : (
                (me?.name ?? "U").slice(0, 1).toUpperCase()
              )}
            </span>
            <span>{me?.name ?? "Meu perfil"}</span>
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
