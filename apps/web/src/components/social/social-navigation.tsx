"use client";
import { useEffect, useRef } from "react";
import { playMotion } from "@/lib/motion";
import {
  Film,
  Plus,
  Home,
  Settings2,
  Search,
  Send,
} from "lucide-react";
import type { SocialPerson, SocialView } from "@/lib/social";
import { NavigationLink } from "../navigation-link";
import { Avatar } from "../user-identity";
import { EnturmaAppIcon } from "../enturma-app-icon";

const destinations = {
  feed: { label: "Feed", icon: Home },
  clips: { label: "Clips", icon: Film },
  create: { label: "Criar", icon: Plus },
};

/** One navigation surface: a rail on desktop and a safe-area dock on mobile. */
export function SocialNavigation({
  view,
  order,
  highlight,
  select,
  me,
  profile,
  settings,
  explore,
}: {
  view: SocialView;
  order: SocialView[];
  highlight: SocialView | null;
  select: (view: SocialView) => void;
  me: SocialPerson;
  profile: () => void;
  settings: () => void;
  explore: () => void;
}) {
  const navigation = useRef<HTMLElement>(null);
  const previous = useRef<SocialView>(view);
  useEffect(() => {
    const active = navigation.current?.querySelector<HTMLElement>(
      '[aria-current="page"]',
    );
    if (!active) return;
    const rect = active.getBoundingClientRect();
    const from = navigation.current
      ?.querySelector<HTMLElement>(`[data-social-view="${previous.current}"]`)
      ?.getBoundingClientRect();
    const changed = previous.current !== view;
    previous.current = view;
    const indicator = active.querySelector(".social-nav-selection");
    if (!changed || !from || !indicator) return;
    const animation = playMotion(
      indicator,
      [
        { transform: `translate(${from.x - rect.x}px, ${from.y - rect.y}px)` },
        { transform: "translate(0, 0)" },
      ],
      { duration: 280 },
    );
    return () => animation?.cancel();
  }, [view, order]);
  return (
    <aside className="social-navigation">
      <NavigationLink
        href="/home"
        className="brand social-navigation-brand"
        draggable={false}
        aria-label="Enturma — voltar ao início"
      >
        <EnturmaAppIcon size={44} className="brand-app-icon" />
        <span>
          enturma<span className="dot">.</span>
        </span>
      </NavigationLink>
      <nav
        ref={navigation}
        aria-label="Ambientes do Social"
        className="social-navigation-items"
      >
        {order.map((key) => {
          const { label, icon: Icon } = destinations[key];
          return (
            <button
              key={key}
              data-social-view={key}
              type="button"
              onClick={() => select(key)}
              aria-current={view === key ? "page" : undefined}
              className={`${key === "create" ? "social-create-action" : ""} ${highlight === key ? "social-frequent" : ""}`}
              title={`${label} (Alt + ${key === "feed" ? 1 : key === "clips" ? 2 : 3})`}
            >
              {view === key && (
                <span className="social-nav-selection" aria-hidden="true" />
              )}
              <span className="social-nav-glyph">
                <Icon size={24} />
              </span>
              <span>{label}</span>
              {highlight === key && <i aria-label="Seu acesso mais usado" />}
            </button>
          );
        })}
        <button className="social-navigation-explore" type="button" onClick={explore} title="Explorar">
          <span className="social-nav-glyph">
            <Search size={24} />
          </span>
          <span>Explorar</span>
        </button>
        <NavigationLink href="/friends" title="Mensagens">
          <span className="social-nav-glyph">
            <Send size={24} />
          </span>
          <span>Mensagens</span>
        </NavigationLink>
        <button
          type="button"
          onClick={profile}
          aria-label="Meu perfil social"
          title="Perfil"
        >
          <span className="social-nav-glyph social-nav-avatar">
            <Avatar user={me} />
          </span>
          <span>Perfil</span>
        </button>
      </nav>
      <div className="social-navigation-footer">
        <button type="button" onClick={settings} title="Preferências">
          <Settings2 size={21} /> <span>Preferências</span>
        </button>
        <NavigationLink href="/home" title="Início do Enturma">
          <Home size={21} /> <span>Início do Enturma</span>
        </NavigationLink>
        <p>Sua turma. Suas descobertas.</p>
      </div>
    </aside>
  );
}
