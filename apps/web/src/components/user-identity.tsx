"use client";
/* eslint-disable @next/next/no-img-element -- authenticated avatars use the same-origin API */
import { useEffect, useRef, useState, useId } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { api, post } from "@/lib/api";
import {
  FeaturedAchievementBadges,
  ShowcaseView,
  type Showcase,
} from "./profile-showcase";
import { ConfirmedLink, ForumLinks } from "./forum-links";
import { useLiveRefresh } from "@/lib/live-updates";
export type ProfileDetails = {
  pronouns?: string;
  statusText?: string;
  decoration?: string;
  nameFont?: string;
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
  useLiveRefresh("profile_changed", async () => {
    profileCache.delete(id);
    const fresh = await loadPublicProfile(id);
    setUser(fresh);
  }, 8000);
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
}: {
  user: PublicProfile;
  showcase?: Showcase;
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
        <Avatar user={user} />
        <h2 className={`name-${d.nameFont ?? "SYSTEM"}`}>{user.name}</h2>
        <div className="profile-handle-row">
          <p>
            @{user.username} {d.pronouns ? `· ${d.pronouns}` : ""}
          </p>
          <FeaturedAchievementBadges showcase={showcase} />
        </div>
        {d.statusText ? <p className="profile-status">{d.statusText}</p> : null}
        <p><ForumLinks text={user.bio || "Estudando em companhia."} /></p>
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
  useLiveRefresh("profile_changed", async () => {
    profileCache.delete(id);
    const fresh = await loadPublicProfile(id);
    setUser(fresh);
  }, 8000);
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
  const [showcase, setShowcase] = useState<Showcase>();
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [friendship, setFriendship] = useState<FriendshipSummary>();
  const [friendshipLoading, setFriendshipLoading] = useState(false);
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
    const reduced =
      document.documentElement.dataset.reducedMotion === "true" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const entrance = reduced
      ? undefined
      : panel.animate(
          [
            { opacity: 0, transform: "translateY(12px) scale(.975)" },
            { opacity: 1, transform: "translateY(0) scale(1)" },
          ],
          {
            duration: 240,
            easing: "cubic-bezier(.16,1,.3,1)",
          },
        );
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
    panel
      .querySelector<HTMLButtonElement>("button")
      ?.focus({ preventScroll: true });
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", key);
    return () => {
      entrance?.cancel();
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", key);
    };
  }, [open]);
  async function show() {
    setMessage("");
    setFriendship(undefined);
    setFriendshipLoading(true);
    setOpen(true);
    try {
      const [loadedProfile, loadedShowcase, me] = await Promise.all([
        api<PublicProfile>(`/users/${user.id}/profile`, { cache: "no-store" }),
        api<Showcase>(`/users/${user.id}/showcase`, { cache: "no-store" }),
        api<{ id: string }>("/users/me"),
      ]);
      const own = me.id === user.id;
      profileCache.set(user.id, Promise.resolve(loadedProfile));
      setProfile({
        ...loadedProfile,
        showcaseAppearance: loadedShowcase.appearance,
      });
      setShowcase(loadedShowcase);
      setIsOwnProfile(own);
      if (!own) {
        const friendships = await api<FriendshipSummary[]>("/friends", {
          cache: "no-store",
        });
        setFriendship(friendships.find((item) => item.userId === user.id));
      }
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setFriendshipLoading(false);
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
                <div className="profile-public-content profile-discord-public-layout">
                  <section
                    className={`profile-public-primary profile-theme-${profile.showcaseAppearance?.theme ?? "SOLID"} profile-effect-${profile.showcaseAppearance?.effect ?? "NONE"}`}
                    style={profileStyle(profile)}
                  >
                    <ProfileCard user={profile} showcase={showcase} />
                    {!isOwnProfile ? (
                      <div className="profile-dialog-actions">
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
                      </div>
                    ) : null}
                    {showcase?.joinedAt ? (
                      <div className="profile-main-meta">
                        <CalendarDays size={15} />
                        <span>
                          No Enturma desde{" "}
                          <strong>
                            {new Date(showcase.joinedAt).toLocaleDateString(
                              "pt-BR",
                            )}
                          </strong>
                        </span>
                      </div>
                    ) : null}
                  </section>

                  <section
                    className="profile-public-advanced"
                    style={profileStyle(profile)}
                  >
                    <div className="profile-public-advanced-heading">
                      <span>Personalização avançada</span>
                      <h2>
                        {isOwnProfile
                          ? "Seu perfil, como as outras pessoas veem"
                          : "Mais sobre este perfil"}
                      </h2>
                      <p>
                        {isOwnProfile
                          ? "Tudo que você configurou no Enturma aparece aqui."
                          : "Conquistas, estatísticas e widgets compartilhados por este usuário."}
                      </p>
                    </div>

                    {isOwnProfile ? (
                      <div className="profile-owner-actions">
                        <p>
                          Este é o seu perfil, do jeito que as outras pessoas
                          veem.
                        </p>
                        <Link
                          className="button"
                          href="/profile"
                          onClick={() => setOpen(false)}
                        >
                          Editar perfil
                        </Link>
                      </div>
                    ) : null}

                    {showcase ? (
                      <ShowcaseView
                        value={showcase}
                        showBadges={false}
                        compact
                        detailed
                      />
                    ) : (
                      <p className="muted">Carregando personalização…</p>
                    )}
                  </section>
                </div>
              ) : (
                <p>Carregando perfil…</p>
              )}
              {message ? <p role="status">{message}</p> : null}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
