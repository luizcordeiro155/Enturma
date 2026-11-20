"use client";

import { useEffect, useState } from "react";
import { ExternalLink, FolderGit2, Printer, Star, Users } from "lucide-react";
import { api } from "@/lib/api";
import {
  kindLabel,
  kindsIn,
  matchesGithub,
  showcase,
  type Project,
  type ProjectKind,
} from "@/lib/portfolio-projects";
import {
  PortfolioAttachments,
  type PortfolioAsset,
} from "./portfolio-attachments";
import {
  formatDays,
  formatStudyTime,
  type Portfolio,
} from "./portfolio-format";
import { PortfolioBack } from "./portfolio-navigation";

/** How many projects open at first; the rest are one press away. */
const PAGE = 8;

export function PublicPortfolio({ username }: { username: string }) {
  const [data, setData] = useState<Portfolio>();
  const [error, setError] = useState("");
  const [kind, setKind] = useState<ProjectKind>();
  const [shown, setShown] = useState(PAGE);
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
  const projects = showcase(data.projects ?? []);
  const kinds = kindsIn(projects);
  const listed = kind ? projects.filter((p) => p.kind === kind) : projects;
  const later = Math.max(0, listed.length - shown);
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
            {data.goal ? (
              <p className="portfolio-goal">
                <strong>Objetivo</strong> {data.goal}
              </p>
            ) : null}
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
          <strong>{formatStudyTime(data.studyMinutes)} de estudo</strong>
          <strong>{formatDays(data.stats.currentStreak)} de sequência</strong>
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
      {projects.length ? (
        <section>
          <div className="public-projects-heading">
            <h2>Projetos</h2>
            {kinds.length > 1 ? (
              <div
                className="public-project-kinds"
                role="group"
                aria-label="Filtrar projetos por tipo"
              >
                <button
                  type="button"
                  aria-pressed={!kind}
                  onClick={() => {
                    setKind(undefined);
                    setShown(PAGE);
                  }}
                >
                  Todos
                </button>
                {kinds.map((id) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={kind === id}
                    onClick={() => {
                      setKind(id);
                      setShown(PAGE);
                    }}
                  >
                    {kindLabel(id)}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="public-projects">
            {listed.map((p, i) => (
              <PublicProject
                key={p.id ?? i}
                project={p}
                assets={data.assets ?? []}
                later={i >= shown}
              />
            ))}
          </div>
          {later ? (
            <button
              type="button"
              className="public-projects-more"
              onClick={() => setShown((n) => n + PAGE)}
            >
              Mostrar mais projetos
              <small>{later === 1 ? "falta 1" : `faltam ${later}`}</small>
            </button>
          ) : null}
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

const web = (value?: string) =>
  value && /^https?:\/\//i.test(value) ? value : undefined;
function hostOf(link?: string) {
  try {
    return link ? new URL(link).host.replace(/^www\./, "") : "";
  } catch {
    return "";
  }
}

function PublicProject({
  project: p,
  assets,
  later,
}: {
  project: Project;
  assets: PortfolioAsset[];
  /** Past the first page: kept in the page for printing, shown on request. */
  later: boolean;
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
  const link = web(p.url);
  const repo = web(p.repoUrl);
  const github =
    p.github && matchesGithub(p.repoUrl, p.github.fullName)
      ? p.github
      : undefined;
  const context = [kindLabel(p.kind), p.subject, p.period].filter(Boolean);
  return (
    <article
      className="public-project"
      id={p.id ? `projeto-${p.id}` : undefined}
      data-featured={p.featured || undefined}
      data-later={later || undefined}
      hidden={later}
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
        {p.featured || context.length ? (
          <p className="public-project-context">
            {p.featured ? (
              <b>
                <Star size={12} aria-hidden="true" /> Destaque
              </b>
            ) : null}
            {context.length ? <span>{context.join(" · ")}</span> : null}
          </p>
        ) : null}
        <h3>{p.name}</h3>
        {p.description ? <p>{p.description}</p> : null}
        {p.team ? (
          <p className="public-project-role">
            <Users size={15} aria-hidden="true" />
            <span>
              <strong>Projeto em equipe.</strong>
              {p.role ? ` Minha participação: ${p.role}` : null}
            </span>
          </p>
        ) : null}
        {p.outcome ? (
          <p className="public-project-outcome">
            <strong>Resultado</strong> {p.outcome}
          </p>
        ) : null}
        {p.technologies?.length ? (
          <ul className="public-project-tech" aria-label="Tecnologias">
            {p.technologies.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        ) : null}
        {rest.length ? (
          <PortfolioAttachments ids={rest} assets={assets} compact />
        ) : null}
        {repo || link ? (
          <div className="public-project-links">
            {repo ? (
              <a
                className="public-project-link"
                href={repo}
                target="_blank"
                rel="noreferrer"
              >
                <FolderGit2 size={14} aria-hidden="true" />
                Repositório
                <small>
                  {github
                    ? github.fullName + (github.fork ? " (fork)" : "")
                    : hostOf(repo)}
                </small>
                {github?.stars ? (
                  <b aria-label={`${github.stars} estrelas no GitHub`}>
                    ★ {github.stars}
                  </b>
                ) : null}
              </a>
            ) : null}
            {link ? (
              <a
                className="public-project-link"
                href={link}
                target="_blank"
                rel="noreferrer"
              >
                Abrir projeto
                {hostOf(link) ? <small>{hostOf(link)}</small> : null}
                <ExternalLink size={14} aria-hidden="true" />
              </a>
            ) : null}
          </div>
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
