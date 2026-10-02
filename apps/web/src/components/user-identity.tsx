"use client";
/* eslint-disable @next/next/no-img-element -- authenticated avatars use the same-origin API */
import { useEffect, useRef, useState, useId } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { api, post } from "@/lib/api";
import { PublicShowcase } from "./profile-showcase";
export type ProfileDetails = {
  pronouns?: string;
  statusText?: string;
  decoration?: string;
  nameFont?: string;
  website?: string;
  interests?: string;
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
  showcaseAppearance?: {
    secondaryColor: string;
    theme: string;
    effect: string;
    layout: string;
  };
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

function profileStyle(user: PublicProfile): React.CSSProperties {
  const primary = user.accentColor ?? "#527d65";
  const secondary = user.showcaseAppearance?.secondaryColor ?? primary;
  const gradient =
    user.showcaseAppearance?.theme === "GRADIENT"
      ? `linear-gradient(135deg,${primary},${secondary})`
      : primary;
  return {
    "--profile-accent": primary,
    "--profile-secondary": secondary,
    "--profile-banner": gradient,
  } as React.CSSProperties;
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
export function ProfileCard({ user }: { user: PublicProfile }) {
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
        <Avatar user={user} />
        <h2 className={`name-${d.nameFont ?? "SYSTEM"}`}>{user.name}</h2>
        <p>
          @{user.username} {d.pronouns ? `· ${d.pronouns}` : ""}
        </p>
        {d.statusText ? <p className="profile-status">{d.statusText}</p> : null}
        <p>{user.bio || "Estudando em companhia."}</p>
        {d.interests ? (
          <p>
            <strong>Interesses</strong>
            <br />
            {d.interests}
          </p>
        ) : null}
        {d.website ? (
          <a href={d.website} target="_blank" rel="noreferrer">
            Site pessoal ↗
          </a>
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
  return (
    <MemberIdentityCard
      user={user}
      subtitle={subtitle}
      className={className}
    />
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
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const trigger = useRef<HTMLButtonElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const anchor = trigger.current;
    const panel = card.current;
    if (!anchor || !panel) return;
    function position() {
      if (!anchor || !panel) return;
      const rect = anchor.getBoundingClientRect();
      const width = panel.offsetWidth;
      const height = panel.offsetHeight;
      const right = rect.right + 10;
      const left =
        right + width <= innerWidth - 12 ? right : rect.left - width - 10;
      panel.style.left = `${Math.max(12, Math.min(left, innerWidth - width - 12))}px`;
      panel.style.top = `${Math.max(12, Math.min(rect.top, innerHeight - height - 12))}px`;
    }
    function outside(e: PointerEvent) {
      if (
        !panel?.contains(e.target as Node) &&
        !anchor?.contains(e.target as Node)
      )
        setOpen(false);
    }
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        anchor?.focus();
      }
    }
    position();
    panel
      .querySelector<HTMLButtonElement>("button")
      ?.focus({ preventScroll: true });
    const observer = new ResizeObserver(position);
    observer.observe(panel);
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", key);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", key);
    };
  }, [open]);
  async function show() {
    setMessage("");
    setOpen(true);
    try {
      setProfile(await loadPublicProfile(user.id));
    } catch (e) {
      setMessage((e as Error).message);
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
        onClick={() => (open ? setOpen(false) : void show())}
      >
        {!nameOnly ? <Avatar user={user} /> : null}
        {!compact ? (
          <span>
            <strong
              className={`name-${user.profileDetails?.nameFont ?? "SYSTEM"}`}
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
                onClick={() => {
                  setOpen(false);
                  trigger.current?.focus();
                }}
              >
                ×
              </button>
              {profile ? (
                <div
                  className={`profile-public-content ${profile.showcaseAppearance?.layout === "WIDGETS_FIRST" ? "widgets-first" : ""}`}
                >
                  <ProfileCard user={profile} />
                  <PublicShowcase userId={profile.id} />
                  <div className="profile-dialog-actions">
                    <button
                      onClick={async () => {
                        try {
                          await post("/friends", {
                            username: profile.username,
                          });
                          setMessage(
                            "Solicitação enviada. Gerencie o convite em Amigos.",
                          );
                        } catch (e) {
                          setMessage((e as Error).message);
                        }
                      }}
                    >
                      Adicionar amizade
                    </button>
                    <Link className="button secondary" href="/friends">
                      Conversas privadas
                    </Link>
                  </div>
                </div>
              ) : (
                <p>Carregando perfil…</p>
              )}
              <p role="status">{message}</p>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
