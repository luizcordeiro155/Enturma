"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Aperture, Search, Send, Settings2, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import {
  type SocialPerson,
  type SocialPost as Post,
  type SocialPreferences,
  type SocialView,
} from "@/lib/social";
import { NavigationLink } from "../navigation-link";
import { Shell } from "../shell";
import { SocialStream } from "./social-stream";
import { SocialClips } from "./social-clips";
import { SocialEditor } from "./social-editor";
import { SocialStories, StoryViewer } from "./social-stories";
import { SocialProfile } from "./social-profile";
import { SocialSettings } from "./social-settings";
import { SocialAuthor, SocialPost } from "./social-post";
import { SocialDialog } from "./social-dialog";
import { SocialNavigation } from "./social-navigation";
import { SocialPager } from "./social-pager";
import { SocialOpening } from "./social-opening";

type Ready = {
  me: SocialPerson & { role: string };
  preferences: SocialPreferences;
  media: boolean;
};
export function Social() {
  const [ready, setReady] = useState<Ready>(),
    [error, setError] = useState(""),
    [disabled, setDisabled] = useState(false);
  useEffect(() => {
    let alive = true;
    void api<{ enabled: boolean; media: boolean }>("/social/capabilities", {
      cache: "no-store",
    })
      .then(async (flags) => {
        if (!alive) return;
        if (!flags.enabled) {
          setDisabled(true);
          return;
        }
        const [me, preferences] = await Promise.all([
          api<Ready["me"]>("/users/me"),
          api<SocialPreferences>("/social/preferences", { cache: "no-store" }),
        ]);
        if (alive) setReady({ me, preferences, media: flags.media });
      })
      .catch((e) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
    };
  }, []);
  if (ready) return <SocialWorkspace key={ready.me.id} ready={ready} />;
  return (
    <Shell>
      <div className="social-page">
        <div className="social-empty">
          <Aperture size={40} />
          <h1>Enturma Social</h1>
          <p role={error ? "alert" : "status"}>
            {error ||
              (disabled
                ? "O Social ainda não está disponível neste ambiente. Seu Fórum e suas turmas continuam no mesmo lugar."
                : "Preparando seu espaço de descobertas…")}
          </p>
          <NavigationLink href="/forum">Ir para o Fórum</NavigationLink>
        </div>
      </div>
    </Shell>
  );
}
function SocialWorkspace({ ready }: { ready: Ready }) {
  const params = useSearchParams(),
    incomingPost = params.get("post"),
    incomingPerson = params.get("person"),
    incomingQuery = params.get("q"),
    incomingSettings = params.get("settings");
  const [view, setView] = useState<SocialView>("feed"),
    [opened, setOpened] = useState<SocialView[]>(["feed"]),
    [tab, setTab] = useState("for-you"),
    [kind, setKind] = useState<"POST" | "STORY" | "CLIP">("POST"),
    [prefs, setPrefs] = useState(ready.preferences),
    [person, setPerson] = useState<string | null>(null),
    [settings, setSettings] = useState(false),
    [detail, setDetail] = useState<Post>(),
    [error, setError] = useState(""),
    [query, setQuery] = useState(""),
    [searched, setSearched] = useState(""),
    [people, setPeople] = useState<SocialPerson[]>([]),
    [refresh, setRefresh] = useState(0),
    [highlight, setHighlight] = useState<SocialView | null>(null);
  const usage = useRef({ feed: 0, clips: 0, create: 0 });
  useEffect(() => {
    const timer = setTimeout(() => {
      if (incomingQuery) {
        setQuery(incomingQuery.slice(0, 80));
        setSearched(incomingQuery.slice(0, 80));
        setPerson(null);
        setDetail(undefined);
        setSettings(false);
        setView("feed");
      }
      if (incomingPerson && /^[a-f0-9-]{36}$/i.test(incomingPerson))
        setPerson(incomingPerson);
      if (incomingSettings) setSettings(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [incomingPerson, incomingSettings, incomingQuery]);
  useEffect(() => {
    if (!incomingPost || !/^[a-f0-9-]{36}$/i.test(incomingPost)) return;
    let alive = true;
    api<Post>(`/social/posts/${incomingPost}`, { cache: "no-store" })
      .then((r) => {
        if (alive) setDetail(r);
      })
      .catch((e) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
    };
  }, [incomingPost]);
  function select(next: SocialView, contentKind?: typeof kind) {
    setView(next);
    setOpened((o) => (o.includes(next) ? o : [...o, next]));
    if (contentKind) setKind(contentKind);
    usage.current[next]++;
    if (prefs.navigation.automatic)
      setHighlight(
        (Object.keys(usage.current) as SocialView[]).reduce((a, b) =>
          usage.current[a] >= usage.current[b] ? a : b,
        ),
      );
    document
      .querySelectorAll<HTMLVideoElement>(".social-page video")
      .forEach((v) => v.pause());
  }
  useEffect(() => {
    let alive = true;
    if (!searched) return;
    api<SocialPerson[]>(
      `/social/people?q=${encodeURIComponent(searched.replace(/^[@#]/, ""))}`,
      {
        cache: "no-store",
      },
    )
      .then((r) => {
        if (alive) setPeople(r);
      })
      .catch((e) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
    };
  }, [searched]);
  return (
    <Shell
      onKeyDown={(e) => {
        if (
          !e.altKey ||
          (e.target instanceof HTMLElement &&
            e.target.closest("input,textarea,select,dialog,[contenteditable]"))
        )
          return;
        const next = ({ "1": "feed", "2": "clips", "3": "create" } as const)[
          e.key as "1"
        ];
        if (next) {
          e.preventDefault();
          select(next);
        }
      }}
      navigation={
        <SocialNavigation
          view={view}
          order={prefs.navigation.order}
          highlight={highlight}
          select={select}
          me={ready.me}
          profile={() => setPerson(ready.me.id)}
          settings={() => setSettings(true)}
        />
      }
    >
      <div className="social-page">
        <SocialOpening />
        <div className="social-workspace">
          <header className="social-header">
            <div>
              <span className="social-eyebrow">SUA VIDA UNIVERSITÁRIA</span>
              <h1>
                Enturma <span>Social.</span>
              </h1>
            </div>
            <div className="social-header-actions">
              <NavigationLink href="/friends" aria-label="Mensagens">
                <Send size={21} aria-hidden="true" />
              </NavigationLink>
              <button
                className="icon-control"
                aria-label="Preferências do Social"
                onClick={() => setSettings(true)}
              >
                <Settings2 size={21} />
              </button>
            </div>
          </header>
          {error && (
            <p className="social-error" role="alert">
              {error}
            </p>
          )}
          <SocialPager
            view={view}
            select={select}
            peek={(next) =>
              setOpened((o) => (o.includes(next) ? o : [...o, next]))
            }
          >
            {(page) =>
              page === "feed" ? (
                <>
            <SocialStories
              me={ready.me}
              create={() => select("create", "STORY")}
              person={setPerson}
              refreshKey={refresh}
            />
            <div className="social-feed-toolbar">
              <div
                className="social-tabs"
                role="tablist"
                aria-label="Filtrar publicações"
              >
                {[
                  ["for-you", "Para Você"],
                  ["following", "Seguindo"],
                  ["campus", "Minha Faculdade"],
                ].map(([t, label]) => (
                  <button
                    role="tab"
                    aria-selected={t === tab}
                    key={t}
                    onClick={() => setTab(t)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <form
                noValidate
                className="social-search"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSearched(query.trim());
                }}
              >
                <label className="sr-only" htmlFor="social-search">
                  Pesquisar pessoas, hashtags e publicações
                </label>
                <Search size={18} />
                <input
                  id="social-search"
                  type="search"
                  maxLength={80}
                  placeholder="Pessoas, assuntos, #ideias"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button className="icon-control" aria-label="Pesquisar">
                  <Search size={18} />
                </button>
              </form>
            </div>
            {searched && (
              <div className="social-search-results">
                <button
                  className="text-button"
                  onClick={() => {
                    setSearched("");
                    setQuery("");
                  }}
                >
                  <ArrowLeft size={16} /> Voltar à leitura
                </button>
                <h2>Resultados para “{searched}”</h2>
                <div>
                  {people.map((u) => (
                    <SocialAuthor key={u.id} user={u} open={setPerson} />
                  ))}
                </div>
              </div>
            )}
            {["for-you", "following", "campus"].map((t) => (
              <div
                className="social-feed-tab"
                key={t}
                hidden={tab !== t || !!searched}
              >
                <SocialStream
                  query={`tab=${t}&kind=POST`}
                  active={view === "feed" && tab === t && !searched}
                  me={ready.me.id}
                  person={setPerson}
                  refreshKey={refresh}
                  autoplay={prefs.autoplay}
                />
              </div>
            ))}
            {searched && (
              <div className="social-feed-tab">
                <SocialStream
                  key={`${tab}:${searched}`}
                  query={`tab=${tab}&kind=POST&q=${encodeURIComponent(searched)}`}
                  active={view === "feed"}
                  me={ready.me.id}
                  person={setPerson}
                />
              </div>
            )}
                </>
              ) : page === "clips" ? (
                opened.includes("clips") && (
                  <SocialClips
                    active={view === "clips" && !person && !settings && !detail}
                    me={ready.me.id}
                    autoplay={prefs.autoplay}
                    person={setPerson}
                  />
                )
              ) : (
                opened.includes("create") && (
                  <SocialEditor
                    user={ready.me.id}
                    mediaEnabled={ready.media}
                    initialKind={kind}
                    published={() => {
                      setRefresh((n) => n + 1);
                      select("feed");
                    }}
                  />
                )
              )
            }
          </SocialPager>
          {person && (
            <SocialProfile
              key={person}
              id={person}
              me={ready.me.id}
              close={() => setPerson(null)}
              person={setPerson}
            />
          )}
          {settings && (
            <SocialSettings
              value={prefs}
              save={setPrefs}
              close={() => setSettings(false)}
              admin={["ADMIN", "SUPER_ADMIN"].includes(ready.me.role)}
            />
          )}
          {detail &&
            (detail.kind === "STORY" ? (
              <StoryViewer
                stories={[detail]}
                me={ready.me.id}
                person={setPerson}
                onDeleted={() => {
                  setDetail(undefined);
                  setRefresh((current) => current + 1);
                }}
                close={() => setDetail(undefined)}
              />
            ) : (
              <SocialDialog
                title="Publicação"
                close={() => setDetail(undefined)}
              >
                <div className="social-dialog-body">
                  <SocialPost
                    item={detail}
                    me={ready.me.id}
                    person={setPerson}
                    changed={setDetail}
                  />
                </div>
              </SocialDialog>
            ))}
        </div>
      </div>
    </Shell>
  );
}
