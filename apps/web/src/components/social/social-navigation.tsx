"use client";
import { Aperture, Film, Plus, Home, Settings2 } from "lucide-react";
import type { SocialPerson, SocialView } from "@/lib/social";
import { NavigationLink } from "../navigation-link";
import { Avatar } from "../user-identity";
import { EnturmaAppIcon } from "../enturma-app-icon";

const destinations = {
  feed: { label: "Feed", icon: Aperture },
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
}: {
  view: SocialView;
  order: SocialView[];
  highlight: SocialView | null;
  select: (view: SocialView) => void;
  me: SocialPerson;
  profile: () => void;
  settings: () => void;
}) {
  return (
    <aside className="social-navigation">
      <NavigationLink
        href="/home"
        className="social-navigation-brand"
        aria-label="Enturma — voltar ao início"
      >
        <EnturmaAppIcon size={40} className="brand-app-icon" />
        <span>
          enturma<span className="dot">.</span>
        </span>
      </NavigationLink>
      <nav aria-label="Ambientes do Social" className="social-navigation-items">
        {order.map((key) => {
          const { label, icon: Icon } = destinations[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => select(key)}
              aria-current={view === key ? "page" : undefined}
              className={`${key === "create" ? "social-create-action" : ""} ${highlight === key ? "social-frequent" : ""}`}
              title={`${label} (Alt + ${key === "feed" ? 1 : key === "clips" ? 2 : 3})`}
            >
              <span className="social-nav-glyph">
                <Icon size={24} />
              </span>
              <span>{label}</span>
              {highlight === key && <i aria-label="Seu acesso mais usado" />}
            </button>
          );
        })}
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
