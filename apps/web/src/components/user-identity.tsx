"use client";
/* eslint-disable @next/next/no-img-element -- authenticated avatars use the same-origin API */
import { useEffect, useRef, useState, useId } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { api, post } from "@/lib/api";
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
};
export function LiveIdentity({ id, name }: { id: string; name: string }) {
  const [user, setUser] = useState<PublicProfile>({ id, name });
  useEffect(() => {
    let active = true;
    api<PublicProfile>(`/users/${id}/profile`)
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
      style={
        {
          "--profile-accent": user.accentColor ?? "#527d65",
        } as React.CSSProperties
      }
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
      className="public-profile-card"
      style={
        {
          "--profile-accent": user.accentColor ?? "#527d65",
        } as React.CSSProperties
      }
    >
      <div className="public-profile-banner">
        {user.hasBanner ? (
          <img
            src={`/api/backend/users/${user.id}/banner?v=${user.mediaVersion ?? 0}`}
            alt="Banner do perfil"
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
      setProfile(await api<PublicProfile>(`/users/${user.id}/profile`));
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
                <>
                  <ProfileCard user={profile} />
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
                </>
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
