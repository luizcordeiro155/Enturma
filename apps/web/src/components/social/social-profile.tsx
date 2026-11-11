"use client";
import { useEffect, useState } from "react";
import { Bell, LockKeyhole, Share2 } from "lucide-react";
import { api } from "@/lib/api";
import {
  socialWrite,
  socialLink,
  type SocialPerson,
  type SocialPost,
} from "@/lib/social";
import { SocialDialog } from "./social-dialog";
import { FollowButton, SocialAuthor } from "./social-post";
import { SocialStream } from "./social-stream";
import { StoryViewer } from "./social-stories";

type Profile = SocialPerson & {
  privateAccount: boolean;
  followers: number;
  following: number;
  posts: number;
  likesReceived: number;
  relationship: { status: string; notify: boolean; muted: boolean };
};
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
  const [profile, setProfile] = useState<Profile>(),
    [tab, setTab] = useState("posts"),
    [connections, setConnections] = useState(""),
    [page, setPage] = useState(0),
    [people, setPeople] = useState<SocialPerson[]>([]),
    [hasMore, setHasMore] = useState(false),
    [error, setError] = useState(""),
    [highlights, setHighlights] = useState<SocialPost[]>([]),
    [story, setStory] = useState<number | null>(null),
    [notice, setNotice] = useState(""),
    [mentions, setMentions] = useState<SocialPost[]>([]),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    let alive = true;
    api<Profile>(`/social/people/${id}`, { cache: "no-store" })
      .then((r) => {
        if (alive) setProfile(r);
      })
      .catch((e) => {
        if (alive) setError(e.message);
      });
    api<SocialPost[]>(`/social/people/${id}/highlights`, { cache: "no-store" })
      .then((r) => {
        if (alive) setHighlights(r);
      })
      .catch(() => {});
    if (id === me)
      api<SocialPost[]>("/social/mentions", { cache: "no-store" })
        .then((rows) => {
          if (alive) setMentions(rows);
        })
        .catch((e) => {
          if (alive) setError(e.message);
        });
    return () => {
      alive = false;
    };
  }, [id, me, revision]);
  useEffect(() => {
    if (!connections) return;
    let alive = true;
    api<SocialPerson[]>(
      `/social/people/${id}/connections?kind=${connections}&page=${page}`,
      { cache: "no-store" },
    )
      .then((r) => {
        if (alive) {
          setPeople((old) =>
            page
              ? [...old, ...r.filter((p) => !old.some((u) => u.id === p.id))]
              : r,
          );
          setHasMore(r.length === 30);
        }
      })
      .catch((e) => {
        if (alive) setError(e.message);
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
  }
  return (
    <SocialDialog title="Perfil social" close={close} wide>
      <div className="social-dialog-body">
        {profile && (
          <>
            <div className="social-profile-heading">
              <SocialAuthor user={profile} open={person} />
              <FollowButton
                id={id}
                me={me}
                changed={() => setRevision((r) => r + 1)}
              />
              <button
                className="icon-control"
                aria-label="Copiar link do perfil social"
                onClick={() => {
                  void navigator.clipboard
                    .writeText(socialLink("person", id))
                    .then(() => setNotice("Link copiado."))
                    .catch(() => setError("Não foi possível copiar."));
                }}
              >
                <Share2 />
              </button>
            </div>
            {profile.privateAccount && (
              <p>
                <LockKeyhole size={16} /> Conta privada · apenas seguidores
                aprovados veem as publicações.
              </p>
            )}
            <div className="social-profile-counts">
              <span>
                <strong>{profile.posts}</strong> Publicações
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
            {id !== me && profile.relationship.status === "ACCEPTED" && (
              <button
                className="secondary"
                aria-pressed={profile.relationship.notify}
                onClick={() => {
                  void socialWrite(`/people/${id}/notifications`, {
                    active: !profile.relationship.notify,
                  })
                    .then(() =>
                      setProfile((p) =>
                        p
                          ? {
                              ...p,
                              relationship: {
                                ...p.relationship,
                                notify: !p.relationship.notify,
                              },
                            }
                          : p,
                      ),
                    )
                    .catch((e) => setError(e.message));
                }}
              >
                <Bell size={16} />{" "}
                {profile.relationship.notify
                  ? "Avisos de novas publicações ativados"
                  : "Avisar sobre novas publicações"}
              </button>
            )}
            {profile.relationship.muted && (
              <button
                className="text-button"
                onClick={() => {
                  void socialWrite(`/people/${id}/mute`, { active: false })
                    .then(() =>
                      setProfile((p) =>
                        p
                          ? {
                              ...p,
                              relationship: { ...p.relationship, muted: false },
                            }
                          : p,
                      ),
                    )
                    .catch((e) => setError(e.message));
                }}
              >
                Voltar a recomendar este criador
              </button>
            )}
            {me === id && (
              <button className="secondary" onClick={() => list("requests")}>
                Solicitações para seguir
              </button>
            )}
            {highlights.length > 0 && (
              <div className="social-highlights" aria-label="Destaques">
                {highlights.map((h, i) => (
                  <button
                    className="secondary"
                    key={h.id}
                    onClick={() => setStory(i)}
                  >
                    {h.highlightTitle || h.body.slice(0, 35) || "Destaque"}
                  </button>
                ))}
              </div>
            )}
            <div
              className="social-tabs"
              role="tablist"
              aria-label="Conteúdo do perfil"
            >
              {[
                ...["posts", "clips", "reposts", "tagged"],
                ...(id === me ? ["saved"] : []),
              ].map((t, i) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                >
                  {["Posts", "Clips", "Republicações", "Marcados", "Salvos"][i]}
                </button>
              ))}
            </div>
            {[
              ...["posts", "clips", "reposts", "tagged"],
              ...(id === me ? ["saved"] : []),
            ].map((t) => (
              <div hidden={tab !== t} key={t} className="social-profile-stream">
                {t === "tagged" && id === me && mentions.length > 0 && (
                  <section
                    className="social-mention-review"
                    aria-label="Marcações aguardando aprovação"
                  >
                    <h3>Escolha o que aparece no seu perfil</h3>
                    {mentions.map((p) => (
                      <article key={p.id}>
                        <strong>{p.name} mencionou você</strong>
                        <p>{p.body}</p>
                        <div className="social-row">
                          {[true, false].map((approve) => (
                            <button
                              className="secondary"
                              key={String(approve)}
                              onClick={() => {
                                void socialWrite(`/posts/${p.id}/mention`, {
                                  active: approve,
                                })
                                  .then(() => setRevision((r) => r + 1))
                                  .catch((e) => setError(e.message));
                              }}
                            >
                              {approve
                                ? "Exibir no perfil"
                                : "Recusar marcação"}
                            </button>
                          ))}
                        </div>
                      </article>
                    ))}
                  </section>
                )}
                {t === "posts" && (
                  <details>
                    <summary>Publicações fixadas</summary>
                    <SocialStream
                      query={`author=${id}&kind=ALL&collection=pinned`}
                      active={tab === t}
                      me={me}
                      person={person}
                    />
                  </details>
                )}
                <SocialStream
                  query={`author=${id}&kind=${t === "clips" ? "CLIP" : t === "posts" ? "POST" : "ALL"}&collection=${t === "clips" ? "posts" : t}`}
                  active={tab === t}
                  refreshKey={revision}
                  me={me}
                  person={person}
                />
              </div>
            ))}
          </>
        )}
        {notice && <p role="status">{notice}</p>}
        {error && <p role="alert">{error}</p>}
      </div>
      {connections && (
        <SocialDialog
          title={
            connections === "requests"
              ? "Solicitações recebidas"
              : connections === "followers"
                ? "Seguidores"
                : "Seguindo"
          }
          close={() => setConnections("")}
        >
          <div className="social-dialog-body">
            {people.map((u) => (
              <div className="social-person-row" key={u.id}>
                <SocialAuthor user={u} open={person} />
                {connections === "requests" ? (
                  <>
                    <button
                      onClick={() => {
                        void socialWrite(`/people/${u.id}/request`, {
                          active: true,
                        })
                          .then(() =>
                            setPeople((p) => p.filter((v) => v.id !== u.id)),
                          )
                          .catch((e) => setError(e.message));
                      }}
                    >
                      Aceitar
                    </button>
                    <button
                      className="secondary"
                      onClick={() => {
                        void socialWrite(`/people/${u.id}/request`, {
                          active: false,
                        })
                          .then(() =>
                            setPeople((p) => p.filter((v) => v.id !== u.id)),
                          )
                          .catch((e) => setError(e.message));
                      }}
                    >
                      Recusar
                    </button>
                  </>
                ) : (
                  <>
                    <FollowButton id={u.id} me={me} />
                    {me === id && connections === "followers" && (
                      <button
                        className="text-button"
                        onClick={() => {
                          void socialWrite(`/people/${u.id}/request`, {
                            active: false,
                          })
                            .then(() =>
                              setPeople((p) => p.filter((v) => v.id !== u.id)),
                            )
                            .catch((e) => setError(e.message));
                        }}
                      >
                        Remover seguidor
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
            {!people.length && <p>Ainda não há estudantes nesta lista.</p>}
            {hasMore && (
              <button
                className="secondary"
                onClick={() => setPage((p) => p + 1)}
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
          onDeleted={(removedId) => {
            setHighlights((current) => current.filter((entry) => entry.id !== removedId));
            setStory(null);
            setRevision((current) => current + 1);
          }}
          close={() => setStory(null)}
        />
      )}
    </SocialDialog>
  );
}
