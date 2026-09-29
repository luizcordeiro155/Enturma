"use client";
/* eslint-disable @next/next/no-img-element -- authenticated avatars use the same-origin API */
import { useEffect, useRef, useState } from "react";
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
        <img src={`/api/backend/users/${user.id}/avatar`} alt="" />
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
            src={`/api/backend/users/${user.id}/banner`}
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
}: {
  user: PublicProfile;
  compact?: boolean;
}) {
  const [profile, setProfile] = useState<PublicProfile>();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
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
        className="identity-trigger"
        aria-label={`Ver perfil de ${user.name}`}
        onClick={() => void show()}
      >
        <Avatar user={user} />
        {!compact ? (
          <span>
            <strong
              className={`name-${user.profileDetails?.nameFont ?? "SYSTEM"}`}
            >
              {user.name}
            </strong>
            {user.profileDetails?.statusText ? (
              <small>{user.profileDetails.statusText}</small>
            ) : null}
          </span>
        ) : null}
      </button>
      <dialog
        className="user-profile-dialog"
        ref={dialog}
        aria-label={`Perfil de ${user.name}`}
        onCancel={() => setOpen(false)}
        onClose={() => setOpen(false)}
      >
        <button
          className="profile-close"
          aria-label="Fechar perfil"
          onClick={() => setOpen(false)}
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
                    await post("/friends", { username: profile.username });
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
      </dialog>
    </>
  );
}
