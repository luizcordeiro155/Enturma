"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Car,
  History,
  Map,
  ShieldCheck,
  UserRound,
} from "lucide-react";

type RideMode = "PASSENGER" | "DRIVER";

function useRideMode() {
  const [mode, setMode] = useState<RideMode>("PASSENGER");

  useEffect(() => {
    const read = () => {
      const saved = localStorage.getItem("enturma-ride-mode");
      setMode(saved === "DRIVER" ? "DRIVER" : "PASSENGER");
    };
    read();
    const custom = (event: Event) => {
      const next = (event as CustomEvent<RideMode>).detail;
      if (next === "PASSENGER" || next === "DRIVER") setMode(next);
      else read();
    };
    const storage = (event: StorageEvent) => {
      if (event.key === "enturma-ride-mode") read();
    };
    window.addEventListener("enturma-ride-mode-change", custom);
    window.addEventListener("storage", storage);
    return () => {
      window.removeEventListener("enturma-ride-mode-change", custom);
      window.removeEventListener("storage", storage);
    };
  }, []);

  return mode;
}

function items(mode: RideMode) {
  return [
    { href: "/caronas", label: "Mapa", icon: Map },
    { href: "/caronas/matches", label: "Corridas", icon: History },
    {
      href: "/caronas/configuracoes",
      label: mode === "DRIVER" ? "Perfil do motorista" : "Perfil do passageiro",
      icon: mode === "DRIVER" ? Car : UserRound,
    },
  ];
}

export function RideDesktopNavigation() {
  const path = usePathname();
  const mode = useRideMode();

  return (
    <aside className="ride-hub-sidebar" aria-label="Navegação de Caronas">
      <div className="ride-hub-brand">
        <span className="ride-hub-brand-mark"><Car size={22} /></span>
        <span>
          <strong>Caronas</strong>
          <small>{mode === "DRIVER" ? "Modo motorista" : "Modo passageiro"}</small>
        </span>
      </div>
      <nav>
        {items(mode).map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={path === href || (href !== "/caronas" && path.startsWith(href)) ? "page" : undefined}
          >
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <div className="ride-hub-spacer" />
      <Link href="/settings" className="ride-hub-safety">
        <ShieldCheck size={19} />
        <span>
          <strong>Segurança</strong>
          <small>Privacidade e conta</small>
        </span>
      </Link>
      <Link href="/home" className="ride-hub-back">
        <ArrowLeft size={19} /> Voltar ao Enturma
      </Link>
    </aside>
  );
}

export function RideMobileNavigation() {
  const path = usePathname();
  const mode = useRideMode();

  return (
    <nav className="ride-hub-mobile-nav" aria-label="Navegação de Caronas">
      {items(mode).map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={path === href || (href !== "/caronas" && path.startsWith(href)) ? "page" : undefined}
        >
          <Icon size={22} />
          <span>{label}</span>
        </Link>
      ))}
      <Link href="/home">
        <ArrowLeft size={22} />
        <span>Enturma</span>
      </Link>
    </nav>
  );
}
