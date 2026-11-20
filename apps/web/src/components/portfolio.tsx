"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  BriefcaseBusiness,
  ExternalLink,
  FolderGit2,
  Plus,
  Printer,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  MAX_FEATURED,
  MAX_PROJECTS,
  projectPayload,
  splitLabels,
  type Project,
} from "@/lib/portfolio-projects";
import { competencies } from "@/lib/portfolio-skills";
import { Feedback } from "./feedback";
import {
  formatDays,
  formatStudyTime,
  type Portfolio,
} from "./portfolio-format";
import { GithubImportDialog } from "./portfolio-github";
import { JourneyEditor } from "./portfolio-journey";
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
  const [mentor, setMentor] = useState(false);
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
        setSkillsText((v.skills ?? []).join(", "));
        setProjects(list);
        // A short portfolio opens ready to edit; a long one opens as a list.
        if (list.length <= 3) setOpen(new Set(list.map((p) => p.id)));
      })
      .catch((e) => setError(e.message));
  }, []);
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
      setData(await api<Portfolio>("/portfolio/me", { cache: "no-store" }));
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
  const repositories = projects
    .map((p) => p.github?.fullName)
    .filter((name): name is string => Boolean(name));
  const room = MAX_PROJECTS - projects.length;
  return (
    <Shell>
      <div className="portfolio-editor-page" ref={root}>
        <header className="suite-heading suite-hero portfolio-hero">
          <div>
            <BriefcaseBusiness size={32} />
            <h1>Portfólio acadêmico</h1>
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
        <form onSubmit={save} noValidate ref={form}>
          <section className="portfolio-settings" data-portfolio-reveal>
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
            <label>
              Título profissional
              <input
                name="headline"
                defaultValue={data.headline}
                maxLength={140}
                placeholder="Estudante de ADS · Java · UX"
              />
            </label>
            <label>
              Objetivo profissional
              <input
                name="goal"
                defaultValue={data.goal ?? ""}
                maxLength={200}
                placeholder="Ex.: estágio em desenvolvimento back-end"
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
            <label>
              Competências
              <input
                name="skills"
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                placeholder="Java, SQL, Git, UI/UX"
              />
            </label>
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
                  Uma competência fica demonstrada quando um projeto ativo a usa
                  como tecnologia ou quando você a liga ao projeto, no cartão
                  dele. As outras aparecem como declaradas.
                </p>
              </div>
            ) : null}
          </section>

          <section
            className="portfolio-project-editor"
            data-portfolio-reveal
            aria-labelledby="portfolio-projects-title"
          >
            <div className="section-heading portfolio-projects-heading">
              <div>
                <h2 id="portfolio-projects-title">Projetos</h2>
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
                  <button
                    type="button"
                    className="secondary"
                    disabled={room < 1}
                    onClick={() => setImporting(true)}
                  >
                    <FolderGit2 size={16} /> Importar do GitHub
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    disabled={room < 1}
                    onClick={addProject}
                  >
                    <Plus size={16} /> Adicionar projeto
                  </button>
                </div>
              ) : null}
            </div>
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
                number={i + 1}
                open={open.has(p.id!)}
                first={i === 0}
                last={i === visible.length - 1}
                assets={data.assets ?? []}
                skills={skills}
                mentor={mentor ? goalNow : undefined}
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
                <FolderGit2 size={28} aria-hidden="true" />
                <p>
                  Adicione projetos da faculdade, pessoais, open source ou
                  trabalhos em equipe. Cada projeto pode ter tecnologias, sua
                  participação, links, imagens e PDFs.
                </p>
                <div className="portfolio-projects-actions">
                  <button
                    type="button"
                    className="secondary"
                    onClick={addProject}
                  >
                    <Plus size={16} /> Adicionar projeto
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setImporting(true)}
                  >
                    <FolderGit2 size={16} /> Importar do GitHub
                  </button>
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
            <button
              type="button"
              className="secondary"
              onClick={() => window.print()}
            >
              <Printer size={16} /> Gerar PDF pelo navegador
            </button>
          </div>
        </form>
        <JourneyEditor />
        {importing ? (
          <GithubImportDialog
            taken={repositories}
            room={room}
            initialLogin={repositories[0]?.split("/")[0] ?? ""}
            onImport={imported}
            onClose={() => setImporting(false)}
          />
        ) : null}
      </div>
    </Shell>
  );
}
