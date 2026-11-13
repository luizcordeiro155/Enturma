"use client";
import { useSocialLives } from "./social-live-context";
/* eslint-disable @next/next/no-img-element -- authenticated highlight thumbnails */
import { useEffect, useRef, useState } from "react";
import { Bell, LockKeyhole, MessageCircle, Share2 } from "lucide-react";
import { api } from "@/lib/api";
import {
  mediaUrl,
  socialWrite,
  socialLink,
  type SocialPerson,
  type SocialPost as Post,
} from "@/lib/social";
import { NavigationLink } from "../navigation-link";
import { SocialDialog } from "./social-dialog";
import { FollowButton, SocialAuthor } from "./social-post";
import { SocialProfileGrid } from "./social-profile-grid";
import { SocialPostViewer } from "./social-post-viewer";
import { StoryViewer } from "./social-stories";
import { SocialCollections } from "./social-collections";

type Profile = SocialPerson & {
  privateAccount: boolean;
  followers: number;
  following: number;
  posts: number;
  likesReceived: number;
  bio?: string;
  relationship: { status: string; notify: boolean; muted: boolean };
};
const TABS = [
  ["posts", "Posts"],
  ["clips", "Clips"],
  ["reposts", "Republica\u00e7\u00f5es"],
  ["tagged", "Marcados"],
  ["saved", "Salvos"],
] as const;
export function SocialProfile({
  id,
  me,
  close,
  person,
}: {
  id: string;
  me: string;
  close: () => void;
  person: (id: string) => void;
}) {
  const lives = useSocialLives();
  const currentLive = lives.items.find(
    (item) => item.authorId === id && item.state === "LIVE",
  );
  const [profile, setProfile] = useState<Profile>(),
    [tab, setTab] = useState<string>("posts");
  const [connections, setConnections] = useState(""),
    [page, setPage] = useState(0);
  const [people, setPeople] = useState<SocialPerson[]>([]),
    [hasMore, setHasMore] = useState(false);
  const [loadingPeople, setLoadingPeople] = useState(false),
    [error, setError] = useState("");
  const [highlights, setHighlights] = useState<Post[]>([]),
    [story, setStory] = useState<number | null>(null);
  const [notice, setNotice] = useState(""),
    [mentions, setMentions] = useState<Post[]>([]);
  const [revision, setRevision] = useState(0),
    [busy, setBusy] = useState(false);
  const [viewer, setViewer] = useState<{ items: Post[]; start: number } | null>(
    null,
  );
  const writing = useRef(false);
  const [collections, setCollections] = useState(false);
  useEffect(() => {
    let alive = true;
    void api<Profile>(`/social/people/${id}`, { cache: "no-store" })
      .then((value) => {
        if (alive) {
          setProfile(value);
          setError("");
        }
      })
      .catch((cause) => {
        if (alive) setError(cause.message);
      });
    void api<Post[]>(`/social/people/${id}/highlights`, { cache: "no-store" })
      .then((value) => {
        if (alive) setHighlights(value);
      })
      .catch(() => {});
    if (id === me)
      void api<Post[]>("/social/mentions", { cache: "no-store" })
        .then((value) => {
          if (alive) setMentions(value);
        })
        .catch((cause) => {
          if (alive) setError(cause.message);
        });
    return () => {
      alive = false;
    };
  }, [id, me, revision]);
  useEffect(() => {
    if (!connections) return;
    let alive = true;
    void api<SocialPerson[]>(
      `/social/people/${id}/connections?kind=${connections}&page=${page}`,
      { cache: "no-store" },
    )
      .then((value) => {
        if (!alive) return;
        setPeople((previous) =>
          page
            ? [
                ...previous,
                ...value.filter(
                  (row) => !previous.some((item) => item.id === row.id),
                ),
              ]
            : value,
        );
        setHasMore(value.length === 30);
      })
      .catch((cause) => {
        if (alive) setError(cause.message);
      })
      .finally(() => {
        if (alive) setLoadingPeople(false);
      });
    return () => {
      alive = false;
    };
  }, [id, connections, page]);
  function list(kind: string) {
    setConnections(kind);
    setPage(0);
    setPeople([]);
    setError("");
    setLoadingPeople(true);
  }
  async function perform(work: () => Promise<unknown>, done?: () => void) {
    if (writing.current) return;
    writing.current = true;
    setBusy(true);
    setError("");
    try {
      await work();
      done?.();
      setRevision((value) => value + 1);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }
  const tabs = TABS.filter(([key]) => key !== "saved" || id === me);
  return (
    <SocialDialog title="Perfil social" close={close} wide variant="profile">
      <div className="social-dialog-body social-profile-body">
        {!profile && !error && <p role="status">{"Carregando perfil\u2026"}</p>}
        {profile && (
          <>
            <div className="social-profile-intro">
              <div className="social-profile-heading">
                <SocialAuthor user={profile} open={person} />
                <div className="social-profile-buttons">
                  {currentLive && (
                    <button
                      className="secondary"
                      onClick={() => lives.open(currentLive.id)}
                    >
                      Assistir ao vivo
                    </button>
                  )}
                  <FollowButton
                    id={id}
                    me={me}
                    changed={() => setRevision((value) => value + 1)}
                  />
                  {id !== me ? (
                    <NavigationLink
                      href="/friends"
                      className="secondary social-profile-message"
                    >
                      <MessageCircle size={18} />
                      Mensagem
                    </NavigationLink>
                  ) : (
                    <NavigationLink
                      href="/profile"
                      className="secondary social-profile-message"
                    >
                      Editar perfil
                    </NavigationLink>
                  )}
                  <button
                    type="button"
                    className="icon-control"
                    aria-label="Copiar link do perfil social"
                    onClick={() => {
                      void navigator.clipboard
                        .writeText(socialLink("person", id))
                        .then(() => setNotice("Link copiado."))
                        .catch(() =>
                          setError("N\u00e3o foi poss\u00edvel copiar."),
                        );
                    }}
                  >
                    <Share2 />
                  </button>
                </div>
              </div>
              <div className="social-profile-counts">
                <span>
                  <strong>{profile.posts}</strong> {"Publica\u00e7\u00f5es"}
                </span>
                <button onClick={() => list("followers")}>
                  <strong>{profile.followers}</strong> Seguidores
                </button>
                <button onClick={() => list("following")}>
                  <strong>{profile.following}</strong> Seguindo
                </button>
                <span>
                  <strong>{profile.likesReceived}</strong> Curtidas recebidas
                </span>
              </div>
              {profile.bio && (
                <p className="social-profile-bio">{profile.bio}</p>
              )}
              {profile.privateAccount && (
                <p className="social-private-notice">
                  <LockKeyhole size={16} />
                  {
                    "Conta privada \u00b7 apenas seguidores aprovados veem as publica\u00e7\u00f5es."
                  }
                </p>
              )}
              <div className="social-profile-tools">
                {id !== me && profile.relationship.status === "ACCEPTED" && (
                  <button
                    className="secondary"
                    disabled={busy}
                    aria-pressed={profile.relationship.notify}
                    onClick={() =>
                      void perform(() =>
                        socialWrite(`/people/${id}/notifications`, {
                          active: !profile.relationship.notify,
                        }),
                      )
                    }
                  >
                    <Bell size={16} />
                    {profile.relationship.notify
                      ? "Avisos de novas publica\u00e7\u00f5es ativados"
                      : "Avisar sobre novas publica\u00e7\u00f5es"}
                  </button>
                )}
                {profile.relationship.muted && (
                  <button
                    className="text-button"
                    disabled={busy}
                    onClick={() =>
                      void perform(() =>
                        socialWrite(`/people/${id}/mute`, { active: false }),
                      )
                    }
                  >
                    Voltar a recomendar este criador
                  </button>
                )}
                {id === me && (
                  <button
                    className="secondary"
                    onClick={() => list("requests")}
                  >
                    {"Solicita\u00e7\u00f5es para seguir"}
                  </button>
                )}
              </div>
              {highlights.length > 0 && (
                <div
                  className="social-highlights"
                  aria-label="Destaques"
                  data-social-gesture="ignore"
                >
                  {highlights.map((highlight, position) => (
                    <button
                      className="social-highlight"
                      key={highlight.id}
                      onClick={() => setStory(position)}
                    >
                      <span className="social-profile-highlight-art">
                        {highlight.media[0] ? (
                          <img
                            src={mediaUrl(highlight.media[0].id, true)}
                            alt=""
                            loading="lazy"
                          />
                        ) : (
                          <span aria-hidden="true">Aa</span>
                        )}
                      </span>
                      <small>
                        {highlight.highlightTitle ||
                          highlight.body.slice(0, 35) ||
                          "Destaque"}
                      </small>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div
              className="social-tabs social-profile-tabs"
              role="tablist"
              aria-label={"Conte\u00fado do perfil"}
            >
              {tabs.map(([key, label]) => (
                <button
                  key={key}
                  role="tab"
                  id={`profile-tab-${key}`}
                  aria-controls={`profile-panel-${key}`}
                  aria-selected={tab === key}
                  onClick={() => setTab(key)}
                >
                  {label}
                </button>
              ))}
            </div>
            {tabs.map(([key]) => (
              <div
                key={key}
                id={`profile-panel-${key}`}
                role="tabpanel"
                aria-labelledby={`profile-tab-${key}`}
                hidden={tab !== key}
                className="social-profile-stream social-profile-grid-panel"
              >
                {key === "tagged" && id === me && mentions.length > 0 && (
                  <section
                    className="social-mention-review"
                    aria-label={
                      "Marca\u00e7\u00f5es aguardando aprova\u00e7\u00e3o"
                    }
                  >
                    <h3>Escolha o que aparece no seu perfil</h3>
                    {mentions.map((post) => (
                      <article key={post.id}>
                        <strong>
                          {post.name}
                          {" mencionou voc\u00ea"}
                        </strong>
                        <p>{post.body}</p>
                        <div className="social-row">
                          {[true, false].map((approve) => (
                            <button
                              className="secondary"
                              disabled={busy}
                              key={String(approve)}
                              onClick={() =>
                                void perform(
                                  () =>
                                    socialWrite(`/posts/${post.id}/mention`, {
                                      active: approve,
                                    }),
                                  () =>
                                    setMentions((previous) =>
                                      previous.filter(
                                        (value) => value.id !== post.id,
                                      ),
                                    ),
                                )
                              }
                            >
                              {approve
                                ? "Exibir no perfil"
                                : "Recusar marca\u00e7\u00e3o"}
                            </button>
                          ))}
                        </div>
                      </article>
                    ))}
                  </section>
                )}
                {key === "saved" && id === me && (
                  <button
                    className="secondary social-collections-open"
                    onClick={() => setCollections(true)}
                  >
                    Minhas coleções
                  </button>
                )}
                <SocialProfileGrid
                  query={`author=${id}&kind=${key === "clips" ? "CLIP" : key === "posts" ? "POST" : "ALL"}&collection=${key === "clips" ? "posts" : key}`}
                  pinnedQuery={
                    key === "posts"
                      ? `author=${id}&kind=ALL&collection=pinned`
                      : undefined
                  }
                  active={tab === key && !viewer && story === null}
                  shape={key === "clips" ? "portrait" : "square"}
                  refreshKey={revision}
                  open={(items, start) => setViewer({ items, start })}
                />
              </div>
            ))}
          </>
        )}
        {notice && <p role="status">{notice}</p>}
        {error && (
          <div role="alert">
            <p>{error}</p>
            {!profile && (
              <button
                className="secondary"
                onClick={() => {
                  setError("");
                  setRevision((value) => value + 1);
                }}
              >
                Tentar novamente
              </button>
            )}
          </div>
        )}
      </div>
      {collections && (
        <SocialCollections
          me={me}
          person={person}
          close={() => {
            setCollections(false);
            setRevision((value) => value + 1);
          }}
        />
      )}
      {connections && (
        <SocialDialog
          title={
            connections === "requests"
              ? "Solicita\u00e7\u00f5es recebidas"
              : connections === "followers"
                ? "Seguidores"
                : "Seguindo"
          }
          close={() => setConnections("")}
          variant="panel"
        >
          <div className="social-dialog-body">
            {people.map((user) => (
              <div className="social-person-row" key={user.id}>
                <SocialAuthor user={user} open={person} />
                <div className="social-person-actions">
                  {connections === "requests" ? (
                    <>
                      {[true, false].map((accept) => (
                        <button
                          key={String(accept)}
                          className={accept ? undefined : "secondary"}
                          disabled={busy}
                          onClick={() =>
                            void perform(
                              () =>
                                socialWrite(`/people/${user.id}/request`, {
                                  active: accept,
                                }),
                              () =>
                                setPeople((previous) =>
                                  previous.filter(
                                    (value) => value.id !== user.id,
                                  ),
                                ),
                            )
                          }
                        >
                          {accept ? "Aceitar" : "Recusar"}
                        </button>
                      ))}
                    </>
                  ) : (
                    <>
                      <FollowButton id={user.id} me={me} />
                      {me === id && connections === "followers" && (
                        <button
                          className="text-button"
                          disabled={busy}
                          onClick={() =>
                            void perform(
                              () =>
                                socialWrite(`/people/${user.id}/request`, {
                                  active: false,
                                }),
                              () =>
                                setPeople((previous) =>
                                  previous.filter(
                                    (value) => value.id !== user.id,
                                  ),
                                ),
                            )
                          }
                        >
                          Remover seguidor
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
            {loadingPeople ? (
              <p role="status">{"Carregando estudantes\u2026"}</p>
            ) : (
              !people.length &&
              !error && (
                <p>{"Ainda n\u00e3o h\u00e1 estudantes nesta lista."}</p>
              )
            )}
            {hasMore && (
              <button
                className="secondary"
                disabled={loadingPeople}
                onClick={() => {
                  setLoadingPeople(true);
                  setPage((value) => value + 1);
                }}
              >
                Carregar mais
              </button>
            )}
            {error && <p role="alert">{error}</p>}
          </div>
        </SocialDialog>
      )}
      {story !== null && (
        <StoryViewer
          stories={highlights}
          start={story}
          me={me}
          person={person}
          onDeleted={(removed) => {
            setHighlights((previous) =>
              previous.filter((post) => post.id !== removed),
            );
            setStory(null);
            setRevision((value) => value + 1);
          }}
          close={() => setStory(null)}
        />
      )}
      {viewer && (
        <SocialPostViewer
          items={viewer.items}
          start={viewer.start}
          me={me}
          person={person}
          changed={(post) => {
            if (post.mine.includes("HIDE")) setRevision((value) => value + 1);
          }}
          close={() => setViewer(null)}
        />
      )}
    </SocialDialog>
  );
}
