"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Check, Gamepad2, MailCheck } from "lucide-react";
import { NotificationBell } from "./notifications";
import { ExperienceControls } from "./experience-controls";
import { usePathname } from "next/navigation";
import {
  MessageCircle,
  BookOpen,
  Home,
  Search,
  Car,
  Settings,
  ShieldCheck,
  Users,
  Download,
} from "lucide-react";
import { CommunityFeedback } from "./community-feedback";
import { isInstalledApp } from "./desktop-updates";
import { MobileNavigation } from "./mobile-navigation";
const links = [
  { href: "/home", label: "Início", icon: Home },
  { href: "/forum", label: "Fórum", icon: MessageCircle },
  { href: "/notebooks", label: "Cadernos IA", icon: BookOpen },
  { href: "/friends", label: "Amigos", icon: Users },
  { href: "/explore", label: "Explorar", icon: Search },
  { href: "/challenges", label: "Desafios acadêmicos", icon: Gamepad2 },
  { href: "/subjects", label: "Minhas matérias", icon: BookOpen },
  { href: "/caronas", label: "Caronas", icon: Car },
  { href: "/settings", label: "Configurações", icon: Settings },
  { href: "/download", label: "Baixar aplicativo", icon: Download },
];
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [installedApp, setInstalledApp] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setInstalledApp(isInstalledApp()), 0);
    return () => clearTimeout(t);
  }, []);
  const [learning, setLearning] = useState(false);
  const [, setEmailVerified] = useState<boolean | null>(null);
  const [emailCelebration, setEmailCelebration] = useState(false);
  const [emailCelebrationSeconds, setEmailCelebrationSeconds] = useState(8);
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
    let active = true;
    let previous: boolean | null = null;

    const refreshVerification = async () => {
      if (previous === true || document.visibilityState !== "visible") return;
      try {
        const profile = await api<{ emailVerified: boolean }>("/users/me");
        if (!active) return;

        const stored = localStorage.getItem("enturma-email-verified-last");
        const wasUnverified = previous === false || stored === "false";

        setEmailVerified(profile.emailVerified);
        localStorage.setItem(
          "enturma-email-verified-last",
          profile.emailVerified ? "true" : "false",
        );

        if (profile.emailVerified && wasUnverified) {
          previous = true;
          setEmailCelebrationSeconds(8);
          setEmailCelebration(true);
          localStorage.setItem("enturma-email-verified-at", String(Date.now()));
          const channel =
            typeof BroadcastChannel !== "undefined"
              ? new BroadcastChannel("enturma-account-status")
              : null;
          channel?.postMessage({ type: "email-verified", at: Date.now() });
          channel?.close();
        } else {
          previous = profile.emailVerified;
        }
      } catch {
        // A sessão pode ter expirado; outras rotas já tratam o login novamente.
      }
    };

    void refreshVerification();
    const poll = window.setInterval(refreshVerification, 15000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refreshVerification();
    };
    window.addEventListener("focus", refreshVerification);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      active = false;
      window.clearInterval(poll);
      window.removeEventListener("focus", refreshVerification);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useEffect(() => {
    if (!emailCelebration) return;
    const tick = window.setInterval(() => {
      setEmailCelebrationSeconds((value) => Math.max(0, value - 1));
    }, 1000);
    const close = window.setTimeout(() => setEmailCelebration(false), 8000);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(close);
    };
  }, [emailCelebration]);
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
          {links
            .filter((l) => !installedApp || l.href !== "/download")
            .map(({ href, label, icon: Icon }) => (
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
            <NotificationBell />
            <ExperienceControls />
            <Link className="button" href="/profile">
              Meu perfil
            </Link>
          </div>
        </header>
        <main id="content">
          <CommunityFeedback />
          {children}
        </main>
        <footer>
          <ShieldCheck size={20} /> Catálogo acadêmico com fontes verificadas.
          <span>Enturma Web v0.3.0</span>
        </footer>
      </div>

      <MobileNavigation />
      {emailCelebration ? (
        <div
          className="account-celebration-backdrop"
          role="status"
          aria-live="polite"
        >
          <section className="account-celebration-card account-celebration-enter">
            <div className="account-celebration-animation" aria-hidden="true">
              <span className="account-celebration-ring ring-one" />
              <span className="account-celebration-ring ring-two" />
              <span className="account-celebration-core">
                <MailCheck size={52} />
              </span>
              <span className="account-celebration-spark spark-a" />
              <span className="account-celebration-spark spark-b" />
              <span className="account-celebration-spark spark-c" />
            </div>
            <span className="account-celebration-kicker">
              <Check size={16} />
              Confirmação concluída
            </span>
            <h2>E-mail confirmado com sucesso!</h2>
            <p>
              Seu e-mail foi verificado em outro dispositivo e o Enturma
              atualizou sua conta automaticamente.
            </p>
            <div className="account-celebration-progress" aria-hidden="true">
              <span />
            </div>
            <small>
              Esta mensagem fecha automaticamente em {emailCelebrationSeconds}s.
            </small>
            <button
              type="button"
              className="button wide"
              onClick={() => setEmailCelebration(false)}
            >
              Continuar
            </button>
          </section>
        </div>
      ) : null}
    </div>
  );
}
