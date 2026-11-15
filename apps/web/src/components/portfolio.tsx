"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  BriefcaseBusiness,
  ExternalLink,
  FolderGit2,
  Plus,
  Printer,
  Trash2,
} from "lucide-react";
import { api } from "@/lib/api";
import { Feedback } from "./feedback";
import {
  PortfolioAttachments,
  type PortfolioAsset,
} from "./portfolio-attachments";
import { Shell } from "./shell";
import { PortfolioBack, PublicPortfolioLink } from "./portfolio-navigation";

const MAX_PROJECTS = 12;

type Project = {
  id?: string;
  name: string;
  description?: string;
  url?: string;
  assets?: string[];
};
type Portfolio = {
  id: string;
  name: string;
  username: string;
  bio?: string;
  accentColor?: string;
  hasAvatar?: boolean;
  hasBanner?: boolean;
  assets: PortfolioAsset[];
  publicProfile: boolean;
  headline: string;
  summary: string;
  skills: string[];
  projects: Project[];
  subjects: { name: string }[];
  achievements: { name: string; description: string; tier: string }[];
  stats: { totalXp: number; currentStreak: number };
  studyMinutes: number;
};

export function PortfolioEditor() {
  const [data, setData] = useState<Portfolio>();
  const [projects, setProjects] = useState<Project[]>([]);
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
  }, [projects]);
  function addProject() {
    const id = crypto.randomUUID();
    setProjects((v) =>
      v.length >= MAX_PROJECTS
        ? v
        : [...v, { id, name: "", description: "", url: "", assets: [] }],
    );
    focusProject.current = id;
  }
  useEffect(() => {
    void api<Portfolio>("/portfolio/me", { cache: "no-store" })
      .then((v) => {
        setData(v);
        setProjects(
          (v.projects ?? []).map((p) => ({
            ...p,
            id: p.id ?? crypto.randomUUID(),
          })),
        );
      })
      .catch((e) => setError(e.message));
  }, []);
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

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    const fd = new FormData(e.currentTarget);
    try {
      await api("/portfolio/me", {
        method: "PUT",
        body: JSON.stringify({
          publicProfile: fd.get("publicProfile") === "on",
          headline: String(fd.get("headline") || ""),
          summary: String(fd.get("summary") || ""),
          skills: String(fd.get("skills") || "")
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean),
          projects,
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
        <p role="status">Montando seu portfólio…</p>
      </Shell>
    );
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
            <strong>{data.studyMinutes} min</strong>
          </div>
          <div>
            <span>Sequência atual</span>
            <strong>{data.stats.currentStreak} dias</strong>
          </div>
        </section>
        <form onSubmit={save}>
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
                defaultValue={(data.skills ?? []).join(", ")}
                placeholder="Java, SQL, Git, UI/UX"
              />
            </label>
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
                  {projects.length
                    ? `${projects.length} de ${MAX_PROJECTS} projetos`
                    : "Mostre o que você já construiu."}
                </p>
              </div>
              {projects.length ? (
                <button
                  type="button"
                  className="secondary"
                  disabled={projects.length >= MAX_PROJECTS}
                  onClick={addProject}
                >
                  <Plus size={16} /> Adicionar projeto
                </button>
              ) : null}
            </div>
            {projects.map((p, i) => (
              <article
                key={p.id ?? i}
                className="portfolio-project-card"
                aria-label={`Projeto ${i + 1}`}
              >
                <header>
                  <span className="portfolio-project-number">
                    Projeto {i + 1}
                  </span>
                  <button
                    type="button"
                    className="portfolio-project-remove"
                    aria-label={`Remover projeto ${i + 1}`}
                    onClick={() =>
                      setProjects((v) => v.filter((_, n) => n !== i))
                    }
                  >
                    <Trash2 size={15} aria-hidden="true" />
                    <span>Remover</span>
                  </button>
                </header>
                <div className="portfolio-project-fields">
                  <label className="portfolio-field">
                    <span>Nome do projeto</span>
                    <input
                      aria-label={"Nome do projeto " + (i + 1)}
                      data-project-name={p.id}
                      value={p.name}
                      maxLength={120}
                      required
                      placeholder="Ex.: App de caronas universitárias"
                      onChange={(e) =>
                        setProjects((v) =>
                          v.map((x, n) =>
                            n === i ? { ...x, name: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </label>
                  <label className="portfolio-field">
                    <span>
                      Link <small>opcional</small>
                    </span>
                    <input
                      type="url"
                      aria-label={"Link do projeto " + (i + 1)}
                      value={p.url ?? ""}
                      maxLength={300}
                      placeholder="https://github.com/voce/projeto"
                      onChange={(e) =>
                        setProjects((v) =>
                          v.map((x, n) =>
                            n === i ? { ...x, url: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </label>
                  <label className="portfolio-field portfolio-field-wide">
                    <span>
                      Descrição
                      <small aria-hidden="true">
                        {(p.description ?? "").length}/500
                      </small>
                    </span>
                    <textarea
                      aria-label={"Descrição do projeto " + (i + 1)}
                      value={p.description ?? ""}
                      maxLength={500}
                      rows={3}
                      placeholder="O que você fez, com quem e qual foi o resultado."
                      onChange={(e) =>
                        setProjects((v) =>
                          v.map((x, n) =>
                            n === i ? { ...x, description: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </label>
                </div>
                <div className="portfolio-project-files">
                  <span className="portfolio-field-title">Imagens e PDFs</span>
                  <PortfolioAttachments
                    ids={p.assets}
                    assets={data.assets ?? []}
                    owner
                    onUpload={(asset) =>
                      setData((d) =>
                        d ? { ...d, assets: [...(d.assets ?? []), asset] } : d,
                      )
                    }
                    onChange={(ids) =>
                      setProjects((v) =>
                        v.map((x) =>
                          x.id === p.id ? { ...x, assets: ids } : x,
                        ),
                      )
                    }
                  />
                </div>
              </article>
            ))}
            {!projects.length ? (
              <div className="portfolio-projects-empty">
                <FolderGit2 size={28} aria-hidden="true" />
                <p>
                  Adicione projetos da faculdade, pessoais, open source ou
                  trabalhos em equipe. Cada projeto pode ter link, imagens e
                  PDFs.
                </p>
                <button
                  type="button"
                  className="secondary"
                  onClick={addProject}
                >
                  <Plus size={16} /> Adicionar projeto
                </button>
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
      </div>
    </Shell>
  );
}

export function PublicPortfolio({ username }: { username: string }) {
  const [data, setData] = useState<Portfolio>();
  const [error, setError] = useState("");
  useEffect(() => {
    void api<Portfolio>("/public/portfolio/" + encodeURIComponent(username), {
      cache: "no-store",
    })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [username]);
  if (error)
    return (
      <main className="public-portfolio">
        <PortfolioBack />
        <h1>Portfólio indisponível</h1>
        <p>{error}</p>
      </main>
    );
  if (!data)
    return (
      <main className="public-portfolio">
        <PortfolioBack />
        <p>Carregando portfólio…</p>
      </main>
    );
  return (
    <main
      className="public-portfolio"
      style={
        {
          "--portfolio-accent": data.accentColor ?? "#183f36",
        } as React.CSSProperties
      }
    >
      <PortfolioBack />
      <header>
        <div>
          {data.hasAvatar ? (
            <img src={"/api/backend/users/" + data.id + "/avatar"} alt="" />
          ) : (
            <span>{data.name.slice(0, 2).toUpperCase()}</span>
          )}
          <div>
            <h1>{data.name}</h1>
            <p>{data.headline || "Estudante no Enturma"}</p>
          </div>
        </div>
        <button onClick={() => window.print()}>
          <Printer size={16} /> Salvar em PDF
        </button>
      </header>
      <section className="portfolio-intro">
        <p>
          {data.summary ||
            data.bio ||
            "Construindo minha trajetória acadêmica."}
        </p>
        <div>
          <strong>{data.stats.totalXp} XP</strong>
          <strong>{data.studyMinutes} min de estudo</strong>
          <strong>{data.stats.currentStreak} dias de sequência</strong>
        </div>
      </section>
      {data.skills?.length ? (
        <section>
          <h2>Competências</h2>
          <div className="portfolio-tags">
            {data.skills.map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
        </section>
      ) : null}
      {data.projects?.length ? (
        <section>
          <h2>Projetos</h2>
          <div className="public-projects">
            {data.projects.map((p, i) => (
              <PublicProject
                key={p.id ?? i}
                project={p}
                assets={data.assets ?? []}
              />
            ))}
          </div>
        </section>
      ) : null}
      {data.subjects?.length ? (
        <section>
          <h2>Estudos atuais</h2>
          <div className="portfolio-tags">
            {data.subjects.map((s) => (
              <span key={s.name}>{s.name}</span>
            ))}
          </div>
        </section>
      ) : null}
      {data.achievements?.length ? (
        <section>
          <h2>Conquistas</h2>
          <div className="public-achievements">
            {data.achievements.map((a) => (
              <article key={a.name}>
                <strong>{a.name}</strong>
                <span>{a.tier}</span>
                <p>{a.description}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function PublicProject({
  project: p,
  assets,
}: {
  project: Project;
  assets: PortfolioAsset[];
}) {
  const files = (p.assets ?? []).filter((id) =>
    assets.some((a) => a.id === id),
  );
  // The first image becomes the cover; the rest stay one tap away.
  const cover = files.find((id) =>
    assets.find((a) => a.id === id)?.mime.startsWith("image/"),
  );
  const coverAsset = assets.find((a) => a.id === cover);
  const rest = files.filter((id) => id !== cover);
  const link = p.url && /^https?:\/\//i.test(p.url) ? p.url : undefined;
  let host = "";
  try {
    host = link ? new URL(link).host.replace(/^www\./, "") : "";
  } catch {
    host = "";
  }
  return (
    <article
      className="public-project"
      id={p.id ? `projeto-${p.id}` : undefined}
    >
      {coverAsset ? (
        <a
          className="public-project-cover"
          href={`/api/backend/public/portfolio/assets/${coverAsset.id}`}
          target="_blank"
          rel="noreferrer"
        >
          <img
            src={`/api/backend/public/portfolio/assets/${coverAsset.id}`}
            alt={coverAsset.name}
            loading="lazy"
          />
        </a>
      ) : (
        <div className="public-project-cover-placeholder" aria-hidden="true">
          <span>{initials(p.name)}</span>
        </div>
      )}
      <div className="public-project-body">
        <h3>{p.name}</h3>
        {p.description ? <p>{p.description}</p> : null}
        {rest.length ? (
          <PortfolioAttachments ids={rest} assets={assets} compact />
        ) : null}
        {link ? (
          <a
            className="public-project-link"
            href={link}
            target="_blank"
            rel="noreferrer"
          >
            Abrir projeto
            {host ? <small>{host}</small> : null}
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        ) : null}
      </div>
    </article>
  );
}

function initials(name: string) {
  const words = name
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 2);
  const picked = (words.length ? words : name.trim().split(/\s+/)).slice(0, 2);
  return picked.map((w) => w[0]?.toUpperCase() ?? "").join("") || "P";
}
