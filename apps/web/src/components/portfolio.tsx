"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, FileText, FolderGit2, Plus } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  MAX_FEATURED,
  MAX_PROJECTS,
  projectPayload,
  splitLabels,
  type Project,
} from "@/lib/portfolio-projects";
import { competencies } from "@/lib/portfolio-skills";
import { TRACKS, trackOf } from "@/lib/portfolio-tracks";
import { TrackIcon } from "./portfolio-track-icon";
import { Feedback } from "./feedback";
import {
  formatDays,
  formatStudyTime,
  type Portfolio,
} from "./portfolio-format";
import { GithubImportDialog } from "./portfolio-github";
import {
  PortfolioGithubAccount,
  type GithubAccount,
} from "./portfolio-github-account";
import { useProviders } from "@/lib/external-access";
import { oauthMessage } from "@/lib/oauth-messages";
import { JourneyEditor } from "./portfolio-journey";
import { TeamInvitations } from "./portfolio-team";
import type { TeamState } from "@/lib/portfolio-team";
import { PublicPortfolioLink } from "./portfolio-navigation";
import { PortfolioProjectCard } from "./portfolio-project-card";
import { Shell } from "./shell";

export { PublicPortfolio } from "./portfolio-public";
export { formatDays, formatStudyTime } from "./portfolio-format";

export function PortfolioEditor() {
  const [data, setData] = useState<Portfolio>();
  const [projects, setProjects] = useState<Project[]>([]);
  // Competencies are typed freely; which ones a project shows is worked out as they change.
  const [skillsText, setSkillsText] = useState("");
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [shelf, setShelf] = useState<"active" | "archived">("active");
  const [importing, setImporting] = useState(false);
  const providers = useProviders();
  const [github, setGithub] = useState<GithubAccount | null>();
  const [githubBusy, setGithubBusy] = useState(false);
  // "AUTO" follows the course; undefined when the server knows nothing about areas.
  const [area, setArea] = useState<string>();
  const [mentor, setMentor] = useState(false);
  const [team, setTeam] = useState<TeamState>({
    projects: {},
    invitations: [],
  });
  // Teams live on the server, apart from the form: they are read again after each change.
  const loadTeam = useCallback(() => {
    void api<TeamState>("/portfolio/me/team", { cache: "no-store" })
      .then((v) =>
        setTeam({
          projects: v?.projects ?? {},
          invitations: v?.invitations ?? [],
        }),
      )
      .catch(() => {});
  }, []);
  useEffect(loadTeam, [loadTeam]);
  // What the server has: a project must be saved before anyone can be tagged in it.
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const form = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const initialRevealDone = useRef(false);
  // A new project's name field takes focus once it is on screen.
  const focusProject = useRef<string | undefined>(undefined);
  useEffect(() => {
    const id = focusProject.current;
    if (!id) return;
    focusProject.current = undefined;
    root.current
      ?.querySelector<HTMLInputElement>(`[data-project-name="${id}"]`)
      ?.focus();
  }, [projects, open]);
  function addProject() {
    if (projects.length >= MAX_PROJECTS) return;
    const id = crypto.randomUUID();
    setProjects((v) => [
      ...v,
      { id, name: "", description: "", url: "", assets: [] },
    ]);
    setOpen((v) => new Set(v).add(id));
    setShelf("active");
    focusProject.current = id;
  }
  useEffect(() => {
    void api<Portfolio>("/portfolio/me", { cache: "no-store" })
      .then((v) => {
        const list = (v.projects ?? []).map((p) => ({
          ...p,
          id: p.id ?? crypto.randomUUID(),
        }));
        setData(v);
        setGithub(v.github);
        setArea(v.track ? (v.trackChoice ?? "AUTO") : undefined);
        setSavedIds(new Set(list.map((p) => p.id!)));
        setSkillsText((v.skills ?? []).join(", "));
        // The page opens as a list: the student opens the project they came to see.
        setProjects(list);
      })
      .catch((e) => setError(e.message));
  }, []);
  // Back from GitHub: say what happened, then leave a clean address behind.
  useEffect(() => {
    const url = new URL(window.location.href);
    const result = url.searchParams.get("github");
    if (!result) return;
    queueMicrotask(() => {
      if (result === "ok")
        setSuccess(
          "GitHub conectado. Escolha repositórios ou ligue a importação automática.",
        );
      else setError(oauthMessage(result));
    });
    url.searchParams.delete("github");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  }, []);
  /** Turning it on, the server brings what is public now; those projects join what is on screen. */
  async function automatic(auto: boolean) {
    setGithubBusy(true);
    setError("");
    setSuccess("");
    try {
      const answer = await api<
        GithubAccount & { added: number; reached?: boolean }
      >(
        "/portfolio/me/github",
        { method: "PUT", body: JSON.stringify({ auto }) },
      );
      setGithub({ login: answer.login, auto: answer.auto });
      if (answer.added > 0) {
        const fresh = await api<Portfolio>("/portfolio/me", {
          cache: "no-store",
        });
        const arrived = (fresh.projects ?? []).filter(
          (p): p is Project & { id: string } => Boolean(p.id),
        );
        // What is being edited stays as it is; only what is new comes in.
        setProjects((current) => {
          const have = new Set(current.map((p) => p.id));
          return [...current, ...arrived.filter((p) => !have.has(p.id))];
        });
        setSavedIds((ids) => new Set([...ids, ...arrived.map((p) => p.id)]));
        setShelf("active");
      }
      setSuccess(
        !auto
          ? "Importação automática desligada. O que já entrou continua no portfólio."
          : answer.reached === false
            ? "Importação automática ligada. O GitHub não respondeu agora; a busca acontece na próxima vez que você abrir o portfólio."
            : answer.added === 1
            ? "1 repositório entrou no portfólio."
            : answer.added > 1
              ? `${answer.added} repositórios entraram no portfólio.`
              : "Importação automática ligada. Repositórios públicos novos vão entrar sozinhos.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGithubBusy(false);
    }
  }
  async function disconnectGithub() {
    setGithubBusy(true);
    setError("");
    setSuccess("");
    try {
      await api("/auth/identities/github", { method: "DELETE" });
      setGithub(null);
      setSuccess("GitHub desconectado. Os projetos que já estavam no portfólio continuam.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGithubBusy(false);
    }
  }
  useEffect(() => {
    // Without the service the mentor is simply not offered.
    void api<{ available?: boolean }>("/portfolio/mentor", {
      cache: "no-store",
    })
      .then((v) => setMentor(Boolean(v?.available)))
      .catch(() => setMentor(false));
  }, []);
  const goalNow = () =>
    (form.current?.elements.namedItem("goal") as HTMLInputElement | null)
      ?.value ?? "";
  useEffect(() => {
    if (!data || initialRevealDone.current) return;
    initialRevealDone.current = true;
    root.current
      ?.querySelectorAll<HTMLElement>("[data-portfolio-reveal]")
      .forEach((el, i) =>
        el.animate(
          [
            { opacity: 0.72, transform: "translateY(8px)" },
            { opacity: 1, transform: "none" },
          ],
          { duration: 220 + i * 28, easing: "cubic-bezier(.16,1,.3,1)" },
        ),
      );
  }, [data]);

  const patch = (id: string | undefined, change: Partial<Project>) =>
    setProjects((v) => v.map((x) => (x.id === id ? { ...x, ...change } : x)));
  const archivedCount = projects.filter((p) => p.archived).length;
  const featuredCount = projects.filter(
    (p) => p.featured && !p.archived,
  ).length;
  const view = archivedCount ? shelf : "active";
  const visible = projects.filter(
    (p) => Boolean(p.archived) === (view === "archived"),
  );

  function feature(project: Project) {
    setError("");
    if (!project.featured && featuredCount >= MAX_FEATURED) {
      setError(`Você pode destacar até ${MAX_FEATURED} projetos.`);
      return;
    }
    patch(project.id, { featured: !project.featured });
  }
  function archive(project: Project) {
    patch(project.id, { archived: !project.archived, featured: false });
    setOpen((v) => {
      const next = new Set(v);
      next.delete(project.id!);
      return next;
    });
  }
  /** Swaps a project with its neighbour in the list being shown. */
  function move(project: Project, by: -1 | 1) {
    const other = visible[visible.indexOf(project) + by];
    if (!other) return;
    setProjects((v) => {
      const next = [...v];
      const a = next.indexOf(project);
      const b = next.indexOf(other);
      [next[a], next[b]] = [next[b], next[a]];
      return next;
    });
  }
  function imported(drafts: Project[]) {
    const room = MAX_PROJECTS - projects.length;
    const added = drafts.slice(0, Math.max(0, room));
    if (!added.length) return;
    setProjects((v) => [...v, ...added]);
    setShelf("active");
    setError("");
    setSuccess(
      added.length === 1
        ? "1 projeto do GitHub entrou como rascunho. Revise e salve o portfólio."
        : `${added.length} projetos do GitHub entraram como rascunho. Revise e salve o portfólio.`,
    );
  }

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    const unnamed = projects.find((p) => !p.name.trim());
    if (unnamed) {
      const archived = Boolean(unnamed.archived);
      const position =
        projects
          .filter((p) => Boolean(p.archived) === archived)
          .indexOf(unnamed) + 1;
      setShelf(archived ? "archived" : "active");
      setOpen((v) => new Set(v).add(unnamed.id!));
      focusProject.current = unnamed.id;
      setError(
        archived
          ? `Dê um nome ao projeto arquivado ${position}.`
          : `Dê um nome ao projeto ${position}.`,
      );
      return;
    }
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    try {
      await api("/portfolio/me", {
        method: "PUT",
        body: JSON.stringify({
          publicProfile: fd.get("publicProfile") === "on",
          headline: String(fd.get("headline") || ""),
          summary: String(fd.get("summary") || ""),
          goal: String(fd.get("goal") || ""),
          ...(area ? { track: area } : {}),
          skills,
          // a link to a competency that left the list goes with it
          projects: projects.map((p) =>
            projectPayload({
              ...p,
              skills: (p.skills ?? []).filter((name) => skills.includes(name)),
            }),
          ),
        }),
      });
      setSuccess("Portfólio atualizado.");
      // Saved work folds back into the list.
      setOpen(new Set());
      const fresh = await api<Portfolio>("/portfolio/me", {
        cache: "no-store",
      });
      setData(fresh);
      setSavedIds(new Set((fresh.projects ?? []).map((p) => p.id!)));
      loadTeam();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!data)
    return (
      <Shell>
        {error ? (
          <Feedback error={error} />
        ) : (
          <p role="status">Montando seu portfólio…</p>
        )}
      </Shell>
    );
  const skills = splitLabels(skillsText, 30);
  const levels = competencies(skills, projects);
  // What the student picked shows at once; saving is what makes it stay.
  const byCourse = trackOf(data.courseTrack ?? data.track);
  const track = area && area !== "AUTO" ? trackOf(area) : area ? byCourse : trackOf(data.track);
  const has = (name: string) =>
    skills.some(
      (skill) => skill.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR"),
    );
  const suggestions = track.suggested.filter((name) => !has(name));
  const repositories = projects
    .map((p) => p.github?.fullName)
    .filter((name): name is string => Boolean(name));
  const room = MAX_PROJECTS - projects.length;
  return (
    <Shell>
      <div
        className="portfolio-editor-page"
        ref={root}
        data-track={area ? track.id : undefined}
        style={{ "--track": track.accent } as React.CSSProperties}
      >
        <header className="suite-heading suite-hero portfolio-hero">
          <div>
            <TrackIcon track={track.id} size={32} />
            <h1>Portfólio acadêmico</h1>
            {area ? <span className="portfolio-track-chip">{track.label}</span> : null}
          </div>
          <p>
            Transforme sua trajetória no Enturma em uma apresentação
            profissional que você controla e pode deixar pública quando quiser.
          </p>
        </header>
        <Feedback error={error} success={success} />
        <section className="portfolio-metrics" aria-label="Resumo do portfólio">
          <div>
            <span>Experiência</span>
            <strong>{data.stats.totalXp} XP</strong>
          </div>
          <div>
            <span>Tempo de estudo</span>
            <strong>{formatStudyTime(data.studyMinutes)}</strong>
          </div>
          <div>
            <span>Sequência atual</span>
            <strong>{formatDays(data.stats.currentStreak)}</strong>
          </div>
        </section>
        <nav className="portfolio-sections" aria-label="Seções do portfólio">
          <a href="#apresentacao">Apresentação</a>
          <a href="#competencias">Competências</a>
          <a href="#projetos">Projetos</a>
          <a href="#jornada">Jornada</a>
          <Link href="/portfolio/curriculo">Currículo</Link>
        </nav>
        <form onSubmit={save} noValidate ref={form}>
          <section
            id="apresentacao"
            className="portfolio-settings"
            data-portfolio-reveal
          >
            <label className="portfolio-public-toggle">
              <input
                type="checkbox"
                name="publicProfile"
                defaultChecked={data.publicProfile}
              />
              <span>
                <strong>Portfólio público</strong>
                <small>Disponível em /p/{data.username}</small>
              </span>
            </label>
            {area ? (
              <div className="portfolio-area">
                <label htmlFor="portfolio-area">Área do portfólio</label>
                <select
                  id="portfolio-area"
                  aria-label="Área do portfólio"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                >
                  <option value="AUTO">Automática pelo curso: {byCourse.label}</option>
                  {TRACKS.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.label}
                    </option>
                  ))}
                </select>
                <p>
                  {data.course
                    ? `Seu curso no Enturma é ${data.course}. `
                    : "Você ainda não escolheu um curso no Enturma. "}
                  A área define os tipos de trabalho, os campos e as sugestões desta página.
                </p>
              </div>
            ) : null}
            <label>
              Título profissional
              <input
                name="headline"
                defaultValue={data.headline}
                maxLength={140}
                placeholder={track.profile.headline}
              />
            </label>
            <label>
              Objetivo profissional
              <input
                name="goal"
                defaultValue={data.goal ?? ""}
                maxLength={200}
                placeholder={track.profile.goal}
              />
            </label>
            <label>
              Apresentação
              <textarea
                name="summary"
                defaultValue={data.summary}
                maxLength={1200}
                placeholder="Conte sua trajetória, objetivos e o tipo de problema que gosta de resolver."
              />
            </label>
            <label id="competencias">
              Competências
              <input
                name="skills"
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                placeholder={track.profile.skills}
              />
            </label>
            {suggestions.length ? (
              <div
                className="portfolio-suggestions"
                role="group"
                aria-label="Sugestões de competências"
              >
                <span aria-hidden="true">Sugestões</span>
                {suggestions.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() =>
                      setSkillsText((text) => [...splitLabels(text, 30), name].join(", "))
                    }
                  >
                    <Plus size={13} aria-hidden="true" />
                    {name}
                  </button>
                ))}
              </div>
            ) : null}
            {levels.length ? (
              <div className="portfolio-skill-levels">
                <ul aria-label="Competências e evidências">
                  {levels.map((entry) => (
                    <li key={entry.name} data-level={entry.level}>
                      <strong>{entry.name}</strong>{" "}
                      <span>
                        {entry.level === "DEMONSTRATED"
                          ? `Demonstrada em ${entry.evidence.length} ${entry.evidence.length === 1 ? "projeto" : "projetos"}`
                          : "Declarada"}
                      </span>
                    </li>
                  ))}
                </ul>
                <p>
                  {track.id === "TECH"
                    ? "Uma competência fica demonstrada quando um projeto ativo a usa como tecnologia ou quando você a liga ao projeto, no cartão dele."
                    : `Uma competência fica demonstrada quando um projeto ativo a lista em "${track.fields.tools.label}" ou quando você a liga ao projeto, no cartão dele.`}{" "}
                  As outras aparecem como declaradas.
                </p>
              </div>
            ) : null}
          </section>

          <TeamInvitations
            invitations={team.invitations}
            onChanged={loadTeam}
            onIncluded={(project) => {
              // The server already saved the copy; the list only catches up.
              setProjects((v) => [...v, project]);
              setSavedIds((v) => new Set(v).add(project.id!));
              setShelf("active");
              setError("");
              setSuccess(`${project.name} entrou no seu portfólio.`);
            }}
          />

          <section
            id="projetos"
            className="portfolio-project-editor"
            data-portfolio-reveal
            aria-labelledby="portfolio-projects-title"
          >
            <div className="section-heading portfolio-projects-heading">
              <div>
                <h2 id="portfolio-projects-title">{track.heading}</h2>
                <p className="muted">
                  {projects.length ? (
                    <>
                      <span>
                        {projects.length} de {MAX_PROJECTS} projetos
                      </span>
                      {featuredCount ? ` · ${featuredCount} em destaque` : null}
                    </>
                  ) : (
                    "Mostre o que você já construiu."
                  )}
                </p>
              </div>
              {projects.length ? (
                <div className="portfolio-projects-actions">
                  {/* with an account connected, its own panel offers the choice */}
                  {track.github && !github ? (
                    <button
                      type="button"
                      className="secondary"
                      disabled={room < 1}
                      onClick={() => setImporting(true)}
                    >
                      <FolderGit2 size={16} /> Importar do GitHub
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="secondary"
                    disabled={room < 1}
                    onClick={addProject}
                  >
                    <Plus size={16} /> {track.add}
                  </button>
                </div>
              ) : null}
            </div>
            {track.github ? (
              <PortfolioGithubAccount
                account={github}
                available={providers.github}
                busy={githubBusy}
                full={room < 1}
                onAuto={(auto) => void automatic(auto)}
                onChoose={() => setImporting(true)}
                onDisconnect={() => void disconnectGithub()}
              />
            ) : null}
            {archivedCount ? (
              <div
                className="portfolio-shelves"
                role="tablist"
                aria-label="Projetos ativos ou arquivados"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={view === "active"}
                  onClick={() => setShelf("active")}
                >
                  Ativos ({projects.length - archivedCount})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={view === "archived"}
                  onClick={() => setShelf("archived")}
                >
                  Arquivados ({archivedCount})
                </button>
              </div>
            ) : null}
            {view === "archived" ? (
              <p className="portfolio-shelf-note">
                Projetos arquivados ficam guardados só para você: não aparecem
                no portfólio público, nem os arquivos deles.
              </p>
            ) : null}
            {visible.map((p, i) => (
              <PortfolioProjectCard
                key={p.id}
                project={p}
                track={track}
                number={i + 1}
                open={open.has(p.id!)}
                first={i === 0}
                last={i === visible.length - 1}
                assets={data.assets ?? []}
                skills={skills}
                mentor={mentor ? goalNow : undefined}
                team={{
                  members: team.projects[p.id!] ?? [],
                  saved: savedIds.has(p.id!),
                  author: team.invitations.find(
                    (item) =>
                      item.ownerId === p.sharedFrom?.userId &&
                      item.projectId === p.sharedFrom?.projectId,
                  )?.ownerName,
                  onChanged: loadTeam,
                }}
                onToggle={() =>
                  setOpen((v) => {
                    const next = new Set(v);
                    if (!next.delete(p.id!)) next.add(p.id!);
                    return next;
                  })
                }
                onChange={(change) => patch(p.id, change)}
                onFeature={() => feature(p)}
                onArchive={() => archive(p)}
                onMove={(by) => move(p, by)}
                onRemove={() =>
                  setProjects((v) => v.filter((x) => x.id !== p.id))
                }
                onUpload={(asset) =>
                  setData((d) =>
                    d ? { ...d, assets: [...(d.assets ?? []), asset] } : d,
                  )
                }
              />
            ))}
            {projects.length && !visible.length ? (
              <p className="portfolio-shelf-note">
                Todos os projetos estão arquivados. Desarquive um ou adicione um
                novo para ele aparecer no portfólio.
              </p>
            ) : null}
            {!projects.length ? (
              <div className="portfolio-projects-empty">
                <TrackIcon track={track.id} size={28} />
                <p>{track.empty}</p>
                <ul className="portfolio-ideas" aria-label="Ideias do que mostrar">
                  {track.ideas.map((idea) => (
                    <li key={idea}>{idea}</li>
                  ))}
                </ul>
                <div className="portfolio-projects-actions">
                  <button
                    type="button"
                    className="secondary"
                    onClick={addProject}
                  >
                    <Plus size={16} /> {track.add}
                  </button>
                  {track.github && !github ? (
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => setImporting(true)}
                    >
                      <FolderGit2 size={16} /> Importar do GitHub
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </section>
          <div className="portfolio-actions">
            <button disabled={busy}>
              {busy ? "Salvando…" : "Salvar portfólio"}
            </button>
            {data.publicProfile ? (
              <PublicPortfolioLink
                className="button secondary"
                username={data.username}
              >
                <ExternalLink size={16} /> Ver público
              </PublicPortfolioLink>
            ) : null}
            <Link className="button secondary" href="/portfolio/curriculo">
              <FileText size={16} /> Montar currículo
            </Link>
          </div>
        </form>
        <JourneyEditor />
        {importing ? (
          <GithubImportDialog
            taken={repositories}
            room={room}
            initialLogin={github?.login ?? repositories[0]?.split("/")[0] ?? ""}
            autoSearch={Boolean(github)}
            onImport={imported}
            onClose={() => setImporting(false)}
          />
        ) : null}
      </div>
    </Shell>
  );
}
