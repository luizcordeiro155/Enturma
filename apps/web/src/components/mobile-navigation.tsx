"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { EnturmaAppIcon } from "./enturma-app-icon";
import {
  Home,
  Users,
  CalendarDays,
  MessagesSquare,
  BookOpen,
  UserRound,
  Menu,
  X,
  Car,
  Settings,
  Gamepad2,
} from "lucide-react";
import { isInstalledApp, isMobileApp, useAppUpdateState } from "./desktop-updates";
const tabs = [
  ["/home", "Início", Home],
  ["/campus", "Hoje", CalendarDays],
  ["/forum", "Comunidade", MessagesSquare],
  ["/notebooks", "Cadernos", BookOpen],
  ["/profile", "Perfil", UserRound],
] as const;
export function MobileNavigation() {
  const path = usePathname();
  const updateState = useAppUpdateState();
  const updatePending =
    isMobileApp() &&
    ["available", "downloading", "ready"].includes(updateState?.status ?? "");
  const [open, setOpen] = useState(false);
  const [installedApp, setInstalledApp] = useState(false);
  const sheet = useRef<HTMLDialogElement>(null);
  useEffect(() => { setInstalledApp(isInstalledApp()); }, []);
  useEffect(() => {
    if (!open || !sheet.current) return;
    const el = sheet.current;
    el.showModal();
    const a =
      document.documentElement.dataset.reducedMotion === "true" ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
        ? undefined
        : el.animate(
            [{ transform: "translateY(100%)" }, { transform: "none" }],
            { duration: 260, easing: "ease-out" },
          );
    return () => {
      a?.cancel();
      el.close();
    };
  }, [open]);
  return (
    <>
      <nav className="mobile-bottom-nav" aria-label="Navegação mobile">
        {tabs.map(([href, label, Icon]) => (
          <Link
            href={href}
            aria-current={path === href ? "page" : undefined}
            key={href}
          >
            <Icon size={21} />
            <span>{label}</span>
          </Link>
        ))}
        <button
          type="button"
          aria-label="Mais opções"
          onClick={() => setOpen(true)}
        >
          <Menu size={21} />
          <span>Mais</span>
        </button>
      </nav>
      {open && (
        <dialog
          ref={sheet}
          className="mobile-more-sheet"
          aria-label="Mais opções do Enturma"
          onCancel={() => setOpen(false)}
        >
          <header>
            <h2>Seu Enturma</h2>
            <button
              aria-label="Fechar menu"
              className="icon-control"
              onClick={() => setOpen(false)}
            >
              <X />
            </button>
          </header>
          {(
            [
              ["/friends", "Amigos", Users],
              ["/caronas", "Caronas", Car],
              ["/settings", "Configurações", Settings],
              ["/challenges", "Desafios acadêmicos", Gamepad2],
              ["/learn", "Programação", Gamepad2],
              ["/download", "Baixar o Enturma", EnturmaAppIcon],
            ] as const
          ).filter(([href])=>!(href==="/download"&&installedApp)).map(([href, label, Icon]) => (
              <Link
                href={href}
                key={href}
                className={
                  updatePending && href === "/settings"
                    ? "app-update-pending-link"
                    : undefined
                }
                onClick={() => setOpen(false)}
              >
                <Icon size={22} />
                {label}
                {updatePending && href === "/settings" ? (
                  <span className="app-update-badge">Atualização</span>
                ) : null}
              </Link>
            ))}
        </dialog>
      )}
    </>
  );
}
