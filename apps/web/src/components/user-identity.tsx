"use client";
/* eslint-disable @next/next/no-img-element -- authenticated avatars use the same-origin API */
import { useEffect, useRef, useState, useId, useCallback } from "react";
import type { ReactNode } from "react";
import {
  profileColor,
  profileContrast,
  type ProfileVisualAppearance,
} from "@enturma/contracts";
import { ProfileBackdrop, profileEntrance } from "./profile-motion";
import { ProfileVisualSurface } from "./profile-visual-surface";
import {
  useOverlayHistory,
  waitForOverlayHistory,
} from "@/lib/use-overlay-history";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ProfileCommunity } from "./profile-community";
import { api, post } from "@/lib/api";
import { FeaturedAchievementBadges, type Showcase } from "./profile-showcase";
import { ConfirmedLink, ForumLinks } from "./forum-links";
import { useLiveRefresh } from "@/lib/live-updates";
export type ProfileDetails = {
  pronouns?: string;
  statusText?: string;
  decoration?: string;
  nameFont?: string;
  nameColor?: string;
  nameEffect?: string;
  website?: string;
  interests?: string;
};
type FriendshipSummary = {
  id: string;
  userId: string;
  requester?: string;
  recipient?: string;
  status: "PENDING" | "ACCEPTED";
};

export type PublicProfile = {
  id: string;
  name: string;
  username?: string;
  bio?: string | null;
  accentColor?: string;
  hasAvatar?: boolean;
  hasBanner?: boolean;
  profileDetails?: ProfileDetails;
  mediaVersion?: number;
  showcaseAppearance?: ProfileVisualAppearance;
};

const profileCache = new Map<string, Promise<PublicProfile>>();

function loadPublicProfile(id: string) {
  let pending = profileCache.get(id);
  if (!pending) {
    pending = api<PublicProfile>(`/users/${id}/profile`).catch((error) => {
      profileCache.delete(id);
      throw error;
    });
    profileCache.set(id, pending);
  }
  return pending;
}

export function profileStyle(user: PublicProfile): React.CSSProperties {
  const primary = profileColor(user.accentColor);
  const appearance = user.showcaseAppearance;
  const secondary = profileColor(appearance?.secondaryColor, primary);
  const angle = Math.max(0, Math.min(360, appearance?.gradientAngle ?? 155));
  const gradient =
    appearance?.theme === "GRADIENT"
      ? `linear-gradient(${angle}deg,${primary},${secondary})`
      : primary;
  const muralPrimary =
    appearance?.muralMode === "CUSTOM"
      ? profileColor(appearance.muralColor, "#18243d")
      : primary;
  const muralSecondary =
    appearance?.muralMode === "CUSTOM"
      ? profileColor(appearance.muralSecondaryColor, "#661245")
      : appearance?.theme === "GRADIENT"
        ? secondary
        : primary;
  const contrast = profileContrast(
    primary,
    appearance?.theme === "GRADIENT" ? secondary : primary,
  );
  const muralContrast = profileContrast(muralPrimary, muralSecondary);
  return {
    "--profile-accent": primary,
    "--profile-secondary": secondary,
    "--profile-banner": gradient,
    "--profile-gradient": gradient,
    "--profile-copy": contrast.ink,
    "--profile-copy-panel": contrast.panel,
    "--mural-background":
      !appearance?.muralMode || appearance.muralMode === "DEFAULT"
        ? "var(--surface)"
        : appearance?.muralMode === "CUSTOM"
          ? `linear-gradient(${angle}deg,${muralPrimary},${muralSecondary})`
          : gradient,
    "--mural-copy":
      !appearance?.muralMode || appearance.muralMode === "DEFAULT"
        ? "var(--ink)"
        : appearance?.muralMode === "CUSTOM"
          ? muralContrast.ink
          : contrast.ink,
    "--mural-copy-panel":
      !appearance?.muralMode || appearance.muralMode === "DEFAULT"
        ? "transparent"
        : appearance?.muralMode === "CUSTOM"
          ? muralContrast.panel
          : contrast.panel,
  } as React.CSSProperties;
}
export function profileNameStyle(user: PublicProfile): React.CSSProperties {
  const color = user.profileDetails?.nameColor;
  return color && /^#[0-9a-f]{6}$/i.test(color)
    ? ({ "--profile-name-color": color } as React.CSSProperties)
    : {};
}
export function LiveIdentity({ id, name }: { id: string; name: string }) {
  const [user, setUser] = useState<PublicProfile>({ id, name });
  useEffect(() => {
    let active = true;
    loadPublicProfile(id)
      .then((p) => {
        if (active) setUser(p);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [id]);
  useLiveRefresh(
    "profile_changed",
    async () => {
      profileCache.delete(id);
      const fresh = await loadPublicProfile(id);
      setUser(fresh);
    },
    8000,
  );
  return <UserIdentity user={user} />;
}
export function Avatar({ user }: { user: PublicProfile }) {
  const d = user.profileDetails;
  return (
    <span
      className={`identity-avatar decoration-${d?.decoration ?? "NONE"}`}
      style={profileStyle(user)}
    >
      {user.hasAvatar ? (
        <img
          src={`/api/backend/users/${user.id}/avatar?v=${user.mediaVersion ?? 0}`}
          alt=""
        />
      ) : (
        user.name.slice(0, 2).toUpperCase()
      )}
    </span>
  );
}
export function ProfileCard({
  user,
  showcase,
  actions,
}: {
  user: PublicProfile;
  showcase?: Showcase;
  actions?: ReactNode;
}) {
  const d = user.profileDetails ?? {};
  return (
    <div
      className={`public-profile-card profile-theme-${user.showcaseAppearance?.theme ?? "SOLID"} profile-effect-${user.showcaseAppearance?.effect ?? "NONE"}`}
      style={profileStyle(user)}
    >
      <div className="public-profile-banner">
        {user.hasBanner ? (
          <img
            src={`/api/backend/users/${user.id}/banner?v=${user.mediaVersion ?? 0}`}
            alt="Banner do perfil"
            className="profile-banner-media"
            loading="eager"
            decoding="async"
          />
        ) : null}
      </div>
      <div className="public-profile-body">
        <ProfileBackdrop appearance={user.showcaseAppearance} />
        <Avatar user={user} />
        <div className="profile-copy-content">
          <h2
            style={profileNameStyle(user)}
            className={`name-${d.nameFont ?? "SYSTEM"} name-effect-${d.nameEffect ?? "SOLID"}`}
          >
            {user.name}
          </h2>
          <div className="profile-handle-row">
            <p>
              @{user.username} {d.pronouns ? `· ${d.pronouns}` : ""}
            </p>
            <FeaturedAchievementBadges showcase={showcase} />
          </div>
          {d.statusText ? (
            <p className="profile-status">{d.statusText}</p>
          ) : null}
          <p>
            <ForumLinks text={user.bio || "Estudando em companhia."} />
          </p>
          {d.interests ? (
            <p>
              <strong>Interesses</strong>
              <br />
              {d.interests}
            </p>
          ) : null}
          {d.website ? (
            <ConfirmedLink href={d.website} label="Site pessoal ↗" />
          ) : null}
        </div>
        {actions ? (
          <div className="profile-dialog-actions">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}
export function MemberIdentityCard({
  user,
  subtitle,
  className = "",
}: {
  user: PublicProfile;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div
      className={`member-profile-strip profile-theme-${user.showcaseAppearance?.theme ?? "SOLID"} ${className}`.trim()}
      style={profileStyle(user)}
    >
      <div className="member-profile-strip-media" aria-hidden="true">
        {user.hasBanner ? (
          <img
            className="member-profile-strip-banner"
            src={`/api/backend/users/${user.id}/banner?v=${user.mediaVersion ?? 0}`}
            alt=""
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className="member-profile-strip-gradient" />
        )}
        <span className="member-profile-strip-shade" />
      </div>
      <div className="member-profile-strip-content">
        <UserIdentity user={user} subtitle={subtitle} />
      </div>
    </div>
  );
}

export function LiveMemberIdentityCard({
  id,
  name,
  subtitle,
  className,
}: {
  id: string;
  name: string;
  subtitle?: string;
  className?: string;
}) {
  const [user, setUser] = useState<PublicProfile>({ id, name });
  useEffect(() => {
    let active = true;
    loadPublicProfile(id)
      .then((profile) => {
        if (active) setUser(profile);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [id]);
  useLiveRefresh(
    "profile_changed",
    async () => {
      profileCache.delete(id);
      const fresh = await loadPublicProfile(id);
      setUser(fresh);
    },
    8000,
  );
  return (
    <MemberIdentityCard user={user} subtitle={subtitle} className={className} />
  );
}

export function UserIdentity({
  user,
  compact = false,
  nameOnly = false,
  subtitle,
}: {
  user: PublicProfile;
  compact?: boolean;
  nameOnly?: boolean;
  subtitle?: string;
}) {
  const [profile, setProfile] = useState<PublicProfile>();
  const [showcase, setShowcase] = useState<Showcase>();
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [friendship, setFriendship] = useState<FriendshipSummary>();
  const [friendshipLoading, setFriendshipLoading] = useState(false);
  const loadingProfile = useRef(false);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const trigger = useRef<HTMLButtonElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const id = useId();
  const closing = useRef(false);
  const close = useCallback(async () => {
    if (closing.current) return;
    closing.current = true;
    const animation = card.current
      ? profileEntrance(card.current, true)
      : undefined;
    try {
      await animation?.finished;
    } catch {
      /* Unmount can cancel the transition. */
    }
    setOpen(false);
    closing.current = false;
    await waitForOverlayHistory();
    trigger.current?.focus({ preventScroll: true });
  }, []);
  useOverlayHistory(() => void close(), open);
  useEffect(() => {
    if (!open || !profile || !card.current) return;
    const animation = profileEntrance(card.current);
    return () => animation?.cancel();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const anchor = trigger.current;
    const panel = card.current;
    if (!anchor || !panel) return;
    function outside(e: PointerEvent) {
      if (
        !panel?.contains(e.target as Node) &&
        !anchor?.contains(e.target as Node)
      )
        void close();
    }
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") {
        void close();
      }
    }
    panel
      .querySelector<HTMLButtonElement>("button")
      ?.focus({ preventScroll: true });
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", key);
    };
  }, [open, close]);
  async function show() {
    if (loadingProfile.current) return;
    loadingProfile.current = true;
    setMessage("");
    try {
      const [loadedProfile, loadedShowcase, me] = await Promise.all([
        api<PublicProfile>(`/users/${user.id}/profile`, { cache: "no-store" }),
        api<Showcase>(`/users/${user.id}/showcase`, { cache: "no-store" }),
        api<{ id: string }>("/users/me"),
      ]);
      const own = me.id === user.id;
      const loadedFriendships = own
        ? []
        : await api<FriendshipSummary[]>("/friends", { cache: "no-store" });
      const complete = {
        ...loadedProfile,
        showcaseAppearance: loadedShowcase.appearance,
      };
      profileCache.set(user.id, Promise.resolve(complete));
      setProfile(complete);
      setShowcase(loadedShowcase);
      setIsOwnProfile(own);
      setFriendship(loadedFriendships.find((item) => item.userId === user.id));
      setFriendshipLoading(false);
      setOpen(true);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      loadingProfile.current = false;
    }
  }
  return (
    <>
      <button
        type="button"
        ref={trigger}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-haspopup="dialog"
        className="identity-trigger"
        aria-label={`Ver perfil de ${user.name}`}
        onClick={() => (open ? void close() : void show())}
      >
        {!nameOnly ? <Avatar user={user} /> : null}
        {!compact ? (
          <span>
            <strong
              style={profileNameStyle(user)}
              className={`name-${user.profileDetails?.nameFont ?? "SYSTEM"} name-effect-${user.profileDetails?.nameEffect ?? "SOLID"}`}
            >
              {user.name}
            </strong>
            {subtitle ? <small>{subtitle}</small> : null}
            {!subtitle && user.profileDetails?.statusText ? (
              <small>{user.profileDetails.statusText}</small>
            ) : null}
          </span>
        ) : null}
      </button>
      {open
        ? createPortal(
            <div
              id={id}
              role="dialog"
              className="user-profile-dialog user-profile-popover"
              ref={card}
              aria-label={`Perfil de ${user.name}`}
            >
              <button
                className="profile-close"
                aria-label="Fechar perfil"
                onClick={() => void close()}
              >
                ×
              </button>
              {profile && showcase ? (
                <ProfileVisualSurface
                  user={profile}
                  showcase={showcase}
                  mural={
                    <ProfileCommunity
                      userId={profile.id}
                      showcase={showcase}
                      own={isOwnProfile}
                      onNavigate={() => setOpen(false)}
                    />
                  }
                  actions={
                    !isOwnProfile ? (
                      <>
                        {friendshipLoading ? (
                          <button type="button" disabled>
                            Verificando amizade…
                          </button>
                        ) : friendship?.status === "ACCEPTED" ? (
                          <Link
                            className="button"
                            href={`/friends?chat=${friendship.id}`}
                            onClick={() => setOpen(false)}
                          >
                            Iniciar conversa
                          </Link>
                        ) : friendship?.status === "PENDING" ? (
                          <>
                            <button type="button" disabled>
                              Solicitação pendente
                            </button>
                            <Link
                              className="button secondary"
                              href="/friends"
                              onClick={() => setOpen(false)}
                            >
                              Gerenciar convite
                            </Link>
                          </>
                        ) : (
                          <button
                            onClick={async () => {
                              try {
                                const created = await post<{
                                  id: string;
                                  status: "PENDING" | "ACCEPTED";
                                }>("/friends", {
                                  username: profile.username,
                                });
                                setFriendship({
                                  id: created.id,
                                  userId: profile.id,
                                  status: created.status,
                                });
                                setMessage(
                                  created.status === "ACCEPTED"
                                    ? "Amizade confirmada."
                                    : "Solicitação enviada.",
                                );
                              } catch (e) {
                                setMessage((e as Error).message);
                              }
                            }}
                          >
                            Adicionar amizade
                          </button>
                        )}
                      </>
                    ) : (
                      <Link
                        className="button"
                        href="/profile"
                        onClick={() => setOpen(false)}
                      >
                        Editar perfil
                      </Link>
                    )
                  }
                />
              ) : null}
              {message ? <p role="status">{message}</p> : null}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
