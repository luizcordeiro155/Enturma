"use client";

import type { ReactNode } from "react";
import { ProfileBackdrop } from "./profile-motion";
import { ProfileCard, profileStyle, type PublicProfile } from "./user-identity";
import { ShowcaseView, type Showcase } from "./profile-showcase";

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
        className={`profile-preview-mural profile-public-advanced${mural ? " profile-has-community" : ""}`}
      >
        <ProfileBackdrop appearance={showcase.appearance} mural />
        {mural ?? (
          <>
            <h2 className="profile-mural-title">Seu mural</h2>
            <ShowcaseView value={showcase} detailed showBadges={false} />
            {!showcase.widgets.some((widget) => widget.visible) ? (
              <p className="profile-mural-empty">
                Escolha os widgets na edição para compor seu mural.
              </p>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
