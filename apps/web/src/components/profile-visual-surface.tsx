"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { Aperture } from "lucide-react";
import { useAppShellState } from "./app-shell-state";
import { ProfileBackdrop } from "./profile-motion";
import { ProfileCard, profileStyle, type PublicProfile } from "./user-identity";
import { ShowcaseView, type Showcase } from "./profile-showcase";

const WIDE = "(min-width: 761px)";
/** True on a computer-sized window; a phone keeps the editor's own preview. */
function useWideScreen() {
  return useSyncExternalStore(
    (changed) => {
      const media = window.matchMedia(WIDE);
      media.addEventListener("change", changed);
      return () => media.removeEventListener("change", changed);
    },
    () => window.matchMedia(WIDE).matches,
    () => false,
  );
}

/**
 * The mural column as visitors meet it in the open profile: the way into the Social, the
 * tabs and the mural itself. In a preview the header is a picture of that, not a control.
 */
function MuralPreview({ showcase }: { showcase: Showcase }) {
  const { socialEnabled } = useAppShellState();
  return (
    <div className="profile-community" data-preview="true">
      {socialEnabled ? (
        <span className="text-button" aria-hidden="true" inert>
          <Aperture size={18} /> Posts, Clips e seguidores
        </span>
      ) : null}
      <div className="profile-community-tabs" aria-hidden="true" inert>
        {["Mural", "Atividade", "Salas em comum", "Amigos em comum"].map(
          (label, index) => (
            <button
              type="button"
              role="tab"
              key={label}
              aria-selected={index === 0}
              tabIndex={-1}
            >
              {label}
            </button>
          ),
        )}
      </div>
      <div className="profile-community-panel">
        <ShowcaseView value={showcase} showBadges={false} compact detailed />
        {!showcase.widgets.some((widget) => widget.visible) ? (
          <p className="profile-community-empty">
            Escolha os widgets na edição para compor seu mural.
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function ProfileVisualSurface({
  user,
  showcase,
  actions,
  previewTab,
  preview = false,
  mural,
}: {
  user: PublicProfile;
  showcase: Showcase;
  actions?: ReactNode;
  previewTab?: "PROFILE" | "MURAL";
  preview?: boolean;
  mural?: ReactNode;
}) {
  const linked = showcase.appearance.muralMode === "PROFILE";
  // On a computer the editor's preview shows the mural exactly as the open profile does.
  const wide = useWideScreen();
  const asProfile = preview && wide && !mural;
  return (
    <div
      className={`profile-preview-combined profile-public-content profile-discord-public-layout profile-shared-surface ${linked ? "profile-mural-linked" : ""}`}
      data-preview-tab={previewTab}
      data-profile-preview={preview ? "true" : "false"}
      style={profileStyle(user)}
    >
      <section className="profile-preview-identity profile-public-primary">
        <ProfileCard user={user} showcase={showcase} actions={actions} />
      </section>
      <section
        className={`profile-preview-mural profile-public-advanced${mural || asProfile ? " profile-has-community" : ""}`}
      >
        <ProfileBackdrop appearance={showcase.appearance} mural />
        {mural ??
          (asProfile ? (
            <MuralPreview showcase={showcase} />
          ) : (
            <>
              <h2 className="profile-mural-title">Seu mural</h2>
              <ShowcaseView value={showcase} detailed showBadges={false} />
              {!showcase.widgets.some((widget) => widget.visible) ? (
                <p className="profile-mural-empty">
                  Escolha os widgets na edição para compor seu mural.
                </p>
              ) : null}
            </>
          ))}
      </section>
    </div>
  );
}
