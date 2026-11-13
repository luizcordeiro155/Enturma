"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Aperture,
  ArrowLeft,
  Check,
  CircleAlert,
  LoaderCircle,
  Plus,
  Search,
  Send,
  Settings2,
  X,
} from "lucide-react";
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
import { SocialEditor, type SocialEditorProgress } from "./social-editor";
import { SocialStories, StoryViewer } from "./social-stories";
import { SocialProfile } from "./social-profile";
import { SocialSettings } from "./social-settings";
import { SocialAuthor, SocialPost } from "./social-post";
import { SocialDialog } from "./social-dialog";
import { SocialNavigation } from "./social-navigation";
import { SocialPager } from "./social-pager";
import { SocialOpening } from "./social-opening";
import { useSocialViewport } from "./use-social-viewport";
import { SocialLiveProvider } from "./social-live-context";
import { SocialExplore } from "./social-explore";
type Ready = {
  me: SocialPerson & { role: string };
  preferences: SocialPreferences;
  media: boolean;
  live: boolean;
};
export function Social() {
  return (
    <SocialOpening>
      <SocialContent />
    </SocialOpening>
  );
}
function SocialContent() {
  const [ready, setReady] = useState<Ready>(),
    [error, setError] = useState(""),
    [disabled, setDisabled] = useState(false),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let alive = true;
    void api<{ enabled: boolean; media: boolean; live?: boolean }>(
      "/social/capabilities",
      {
        cache: "no-store",
      },
    )
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
        if (alive)
          setReady({
            me,
            preferences,
            media: flags.media,
            live: flags.live === true,
          });
      })
      .catch((cause) => {
        if (alive) setError(cause.message);
      });
    return () => {
      alive = false;
    };
  }, [retry]);
  if (ready)
    return (
      <SocialLiveProvider key={ready.me.id} enabled={ready.live} me={ready.me}>
        <SocialWorkspace ready={ready} />
      </SocialLiveProvider>
    );
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
          {error && (
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setError("");
                setRetry((value) => value + 1);
              }}
            >
              Tentar novamente
            </button>
          )}
          <NavigationLink href="/forum">Ir para o Fórum</NavigationLink>
        </div>
      </div>
    </Shell>
  );
}
function SocialWorkspace({ ready }: { ready: Ready }) {
  useSocialViewport();
  const params = useSearchParams(),
    incomingPost = params.get("post"),
    incomingPerson = params.get("person"),
    incomingQuery = params.get("q"),
    incomingSettings = params.get("settings");
  const [view, setView] = useState<SocialView>("feed"),
    [opened, setOpened] = useState<SocialView[]>(["feed"]),
    [tab, setTab] = useState("for-you");
  const [kind, setKind] = useState<"POST" | "STORY" | "CLIP">("POST"),
    [prefs, setPrefs] = useState(ready.preferences),
    [person, setPerson] = useState<string | null>(null),
    [settings, setSettings] = useState(false),
    [detail, setDetail] = useState<Post>();
  const [error, setError] = useState(""),
    [query, setQuery] = useState(""),
    [searched, setSearched] = useState(""),
    [people, setPeople] = useState<SocialPerson[]>([]),
    [refresh, setRefresh] = useState(0),
    [highlight, setHighlight] = useState<SocialView | null>(null);
  const [explore, setExplore] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false),
    [upload, setUpload] = useState<SocialEditorProgress>({
      state: "idle",
      message: "",
      percent: 0,
    }),
    [dismissedUpload, setDismissedUpload] = useState(false);
  const usage = useRef({ feed: 0, clips: 0, create: 0 }),
    feedScroll = useRef<HTMLDivElement>(null),
    feedPositions = useRef<Record<string, number>>({});
  /** The Feed tabs share one scroll area; each keeps its own reading position. */
  function openTab(next: string) {
    if (next === tab) return;
    const area = feedScroll.current;
    if (area) feedPositions.current[tab] = area.scrollTop;
    setTab(next);
  }
  useLayoutEffect(() => {
    const area = feedScroll.current;
    if (area) area.scrollTop = feedPositions.current[tab] ?? 0;
  }, [tab]);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (incomingQuery) {
        setQuery(incomingQuery.slice(0, 80));
        setSearched(incomingQuery.slice(0, 80));
        setSearchOpen(true);
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
    void api<Post>(`/social/posts/${incomingPost}`, { cache: "no-store" })
      .then((post) => {
        if (alive) setDetail(post);
      })
      .catch((cause) => {
        if (alive) setError(cause.message);
      });
    return () => {
      alive = false;
    };
  }, [incomingPost]);
  function select(next: SocialView, contentKind?: typeof kind) {
    setView(next);
    setOpened((previous) =>
      previous.includes(next) ? previous : [...previous, next],
    );
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
      .forEach((video) => video.pause());
  }
  useEffect(() => {
    let alive = true;
    if (!searched) return;
    void api<SocialPerson[]>(
      `/social/people?q=${encodeURIComponent(searched.replace(/^[@#]/, ""))}`,
      { cache: "no-store" },
    )
      .then((result) => {
        if (alive) setPeople(result);
      })
      .catch((cause) => {
        if (alive) setError(cause.message);
      });
    return () => {
      alive = false;
    };
  }, [searched]);
  return (
    <Shell
      onKeyDown={(event) => {
        if (
          !event.altKey ||
          (event.target instanceof HTMLElement &&
            event.target.closest(
              "input,textarea,select,dialog,[contenteditable]",
            ))
        )
          return;
        const next = ({ "1": "feed", "2": "clips", "3": "create" } as const)[
          event.key as "1"
        ];
        if (next) {
          event.preventDefault();
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
          explore={() => setExplore(true)}
        />
      }
    >
      <div className="social-page">
        <div className="social-workspace">
          <header className="social-header">
            <div className="social-header-brand">
              <button
                type="button"
                className="icon-control"
                aria-label="Criar publicação"
                onClick={() => select("create")}
              >
                <Plus size={24} />
              </button>
              <h1>
                Enturma <span>Social.</span>
              </h1>
            </div>
            <div className="social-header-actions">
              <button
                type="button"
                className="icon-control social-search-toggle"
                aria-label="Abrir busca do Social"
                aria-expanded={searchOpen}
                onClick={() => {
                  select("feed");
                  setSearchOpen((value) => !value);
                }}
              >
                <Search size={21} />
              </button>
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
              setOpened((previous) =>
                previous.includes(next) ? previous : [...previous, next],
              )
            }
          >
            {(page) =>
              page === "feed" ? (
                <div
                  className="social-feed-scroll"
                  data-social-scroller
                  ref={feedScroll}
                >
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
                      ].map(([key, label]) => (
                        <button
                          role="tab"
                          aria-selected={key === tab}
                          key={key}
                          onClick={() => openTab(key)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <form
                      noValidate
                      className={`social-search ${searchOpen || searched ? "is-open" : ""}`}
                      onSubmit={(event) => {
                        event.preventDefault();
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
                        onChange={(event) => setQuery(event.target.value)}
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
                        <ArrowLeft size={16} />
                        Voltar à leitura
                      </button>
                      <h2>{`Resultados para “${searched}”`}</h2>
                      <div>
                        {people.map((user) => (
                          <SocialAuthor
                            key={user.id}
                            user={user}
                            open={setPerson}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {["for-you", "following", "campus"].map((key) => (
                    <div
                      className="social-feed-tab"
                      key={key}
                      hidden={tab !== key || !!searched}
                    >
                      <SocialStream
                        query={`tab=${key}&kind=ALL`}
                        active={view === "feed" && tab === key && !searched}
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
                        query={`tab=${tab}&kind=ALL&q=${encodeURIComponent(searched)}`}
                        active={view === "feed"}
                        me={ready.me.id}
                        person={setPerson}
                        autoplay={prefs.autoplay}
                      />
                    </div>
                  )}
                </div>
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
                    onProgress={(value) => {
                      setUpload(value);
                      if (value.state === "working") setDismissedUpload(false);
                    }}
                    published={(publishedKind) => {
                      setRefresh((value) => value + 1);
                      if (view === "create")
                        select(publishedKind === "CLIP" ? "clips" : "feed");
                    }}
                  />
                )
              )
            }
          </SocialPager>
          {view !== "create" && upload.state !== "idle" && !dismissedUpload && (
            <div
              className={`social-upload-banner social-upload-${upload.state}`}
            >
              <button
                type="button"
                className="social-upload-banner-main"
                onClick={() => select("create")}
                aria-label="Abrir progresso da publicação"
              >
                {upload.state === "working" ? (
                  <LoaderCircle className="social-upload-spinning" />
                ) : upload.state === "done" ? (
                  <Check />
                ) : (
                  <CircleAlert />
                )}
                <span role="status">{upload.message}</span>
                {upload.state === "working" && (
                  <progress
                    value={upload.percent}
                    max={100}
                    aria-label="Progresso do envio"
                  />
                )}
              </button>
              {upload.state !== "working" && (
                <button
                  className="icon-control"
                  aria-label="Dispensar aviso"
                  onClick={() => setDismissedUpload(true)}
                >
                  <X size={18} />
                </button>
              )}
            </div>
          )}
          {explore && (
            <SocialExplore
              me={ready.me.id}
              person={setPerson}
              close={() => setExplore(false)}
            />
          )}
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
                  setRefresh((value) => value + 1);
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
