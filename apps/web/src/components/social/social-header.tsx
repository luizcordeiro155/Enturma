"use client";
import "@fontsource/grand-hotel/400.css";
import { Aperture, ChevronLeft, Plus, Settings2 } from "lucide-react";
import { NavigationLink } from "../navigation-link";
import { NotificationBell } from "../notifications";

/**
 * The only top bar inside the Social: the app-wide top bar is hidden here, so its
 * way home, notifications and appearance settings live in this bar instead.
 * Search goes through Explorar; there is no separate magnifier.
 */
export function SocialHeader({
  create,
  explore,
  settings,
}: {
  create: () => void;
  explore: () => void;
  settings: () => void;
}) {
  return (
    <header className="social-header">
      <div className="social-header-brand">
        <NavigationLink
          href="/home"
          className="social-back"
          aria-label="Voltar ao início do Enturma"
          title="Início do Enturma"
        >
          <ChevronLeft size={22} aria-hidden="true" />
        </NavigationLink>
        <button
          type="button"
          className="icon-control"
          aria-label="Criar publicação"
          onClick={create}
        >
          <Plus size={24} />
        </button>
      </div>
      <h1 className="social-wordmark" aria-label="Enturma Social.">
        Enturma
      </h1>
      <div className="social-header-actions">
        <button
          type="button"
          className="icon-control social-mobile-explore"
          aria-label="Explorar"
          title="Explorar e buscar pessoas"
          onClick={explore}
        >
          <Aperture size={21} aria-hidden="true" />
        </button>
        <NotificationBell />
        <button
          type="button"
          className="icon-control"
          aria-label="Preferências do Social"
          onClick={settings}
        >
          <Settings2 size={21} />
        </button>
      </div>
    </header>
  );
}
