"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Gamepad2 } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  Accessibility,
  BookOpen,
  Car,
  Home,
  Moon,
  Search,
  Settings,
  ShieldCheck,
  Sun,
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
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [accessible, setAccessible] = useState(false);

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

  useEffect(() => {
    const storedTheme = localStorage.getItem("enturma-theme");
    const nextTheme =
      storedTheme === "dark" || storedTheme === "light"
        ? storedTheme
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    const storedAccess = localStorage.getItem("enturma-accessibility") === "true";
    setTheme(nextTheme);
    setAccessible(storedAccess);
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.dataset.accessibility = storedAccess ? "on" : "off";
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("enturma-theme", next);
    document.documentElement.dataset.theme = next;
  }

  function toggleAccessibility() {
    const next = !accessible;
    setAccessible(next);
    localStorage.setItem("enturma-accessibility", String(next));
    document.documentElement.dataset.accessibility = next ? "on" : "off";
  }

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
            <button
              type="button"
              className="icon-control secondary"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
              title={theme === "dark" ? "Modo claro" : "Modo escuro"}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              type="button"
              className={accessible ? "icon-control secondary active" : "icon-control secondary"}
              onClick={toggleAccessibility}
              aria-pressed={accessible}
              aria-label="Alternar modo de acessibilidade"
              title="Acessibilidade"
            >
              <Accessibility size={18} />
              <span>Acessibilidade</span>
            </button>
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
