"use client";

import { useId, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  FolderGit2,
  RefreshCw,
  Star,
  Trash2,
} from "lucide-react";
import { readRepo, repoLanguages, repoTechnologies } from "@/lib/github-repos";
import { byTechnology } from "@/lib/portfolio-skills";
import {
  kindLabel,
  matchesGithub,
  MAX_TECHNOLOGIES,
  PROJECT_KINDS,
  splitLabels,
  type Project,
  type ProjectKind,
} from "@/lib/portfolio-projects";
import {
  PortfolioAttachments,
  type PortfolioAsset,
} from "./portfolio-attachments";

const month = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
  year: "numeric",
});
export function githubUpdated(iso?: string) {
  const date = iso ? new Date(iso) : undefined;
  return date && !Number.isNaN(date.getTime()) ? month.format(date) : "";
}

/** One project in the editor: a summary row that opens into its fields. */
export function PortfolioProjectCard({
  project: p,
  number,
  open,
  first,
  last,
  assets,
  skills,
  onToggle,
  onChange,
  onFeature,
  onArchive,
  onMove,
  onRemove,
  onUpload,
}: {
  project: Project;
  /** Position in the list being shown, from 1. */
  number: number;
  open: boolean;
  first: boolean;
  last: boolean;
  assets: PortfolioAsset[];
  /** The portfolio's competencies, to say which ones this project shows. */
  skills: string[];
  onToggle: () => void;
  onChange: (patch: Partial<Project>) => void;
  onFeature: () => void;
  onArchive: () => void;
  onMove: (by: -1 | 1) => void;
  onRemove: () => void;
  onUpload: (asset: PortfolioAsset) => void;
}) {
  const panel = useId();
  // The technologies field is typed freely; the list follows what was typed.
  const joined = (p.technologies ?? []).join(", ");
  const [typed, setTyped] = useState(joined);
  const [seen, setSeen] = useState(joined);
  if (seen !== joined) {
    setSeen(joined);
    if (splitLabels(typed, MAX_TECHNOLOGIES).join(", ") !== joined)
      setTyped(joined);
  }
  const [refresh, setRefresh] = useState<"busy" | "done" | string>();
  const linked = p.github && matchesGithub(p.repoUrl, p.github.fullName);

  async function update() {
    if (!p.github || refresh === "busy") return;
    setRefresh("busy");
    try {
      const fresh = await readRepo(p.github.fullName);
      const languages = await repoLanguages(p.github.fullName);
      const labels = [
        ...repoTechnologies(fresh, languages),
        ...(p.technologies ?? []),
      ];
      onChange({
        github: {
          fullName: fresh.fullName || p.github.fullName,
          stars: fresh.stars,
          fork: fresh.fork,
          updatedAt: fresh.pushedAt,
        },
        technologies: splitLabels(labels.join(","), MAX_TECHNOLOGIES),
        // the student's own words stay; GitHub only fills what is still empty
        description: p.description?.trim() ? p.description : fresh.description,
        url: p.url?.trim() ? p.url : fresh.homepage,
      });
      setRefresh("done");
    } catch (cause) {
      setRefresh((cause as Error).message);
    }
  }

  const label = `projeto ${number}`;
  return (
    <article
      className="portfolio-project-card"
      aria-label={`Projeto ${number}`}
      data-open={open || undefined}
      data-archived={p.archived || undefined}
    >
      <header>
        <button
          type="button"
          className="portfolio-project-toggle"
          aria-expanded={open}
          aria-controls={panel}
          onClick={onToggle}
        >
          <span className="portfolio-project-number">Projeto {number}</span>
          <span className="portfolio-project-summary">
            <strong>{p.name.trim() || "Sem nome ainda"}</strong>
            <span>
              {[
                kindLabel(p.kind),
                p.featured ? "Em destaque" : "",
                linked ? p.github!.fullName : "",
                ...(p.technologies ?? []).slice(0, 3),
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </span>
          <ChevronDown size={18} aria-hidden="true" />
        </button>
        <div className="portfolio-project-tools">
          {!p.archived ? (
            <button
              type="button"
              className="portfolio-project-tool"
              aria-pressed={Boolean(p.featured)}
              aria-label={
                p.featured ? `Tirar destaque do ${label}` : `Destacar ${label}`
              }
              title={p.featured ? "Tirar destaque" : "Destacar"}
              onClick={onFeature}
            >
              <Star size={16} aria-hidden="true" />
            </button>
          ) : null}
          <button
            type="button"
            className="portfolio-project-tool"
            aria-label={`Subir ${label}`}
            title="Subir"
            disabled={first}
            onClick={() => onMove(-1)}
          >
            <ArrowUp size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="portfolio-project-tool"
            aria-label={`Descer ${label}`}
            title="Descer"
            disabled={last}
            onClick={() => onMove(1)}
          >
            <ArrowDown size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="portfolio-project-tool"
            aria-label={`${p.archived ? "Desarquivar" : "Arquivar"} ${label}`}
            title={p.archived ? "Desarquivar" : "Arquivar"}
            onClick={onArchive}
          >
            {p.archived ? (
              <ArchiveRestore size={16} aria-hidden="true" />
            ) : (
              <Archive size={16} aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            className="portfolio-project-remove"
            aria-label={`Remover ${label}`}
            onClick={onRemove}
          >
            <Trash2 size={15} aria-hidden="true" />
            <span>Remover</span>
          </button>
        </div>
      </header>
      {open ? (
        <div className="portfolio-project-body" id={panel}>
          <div className="portfolio-project-fields">
            <label className="portfolio-field">
              <span>Nome do projeto</span>
              <input
                aria-label={"Nome do projeto " + number}
                data-project-name={p.id}
                value={p.name}
                maxLength={120}
                placeholder="Ex.: App de caronas universitárias"
                onChange={(e) => onChange({ name: e.target.value })}
              />
            </label>
            <label className="portfolio-field">
              <span>
                Tipo <small>opcional</small>
              </span>
              <select
                aria-label={"Tipo do projeto " + number}
                value={p.kind ?? ""}
                onChange={(e) =>
                  onChange({
                    kind: (e.target.value || undefined) as
                      ProjectKind | undefined,
                  })
                }
              >
                <option value="">Sem tipo</option>
                {PROJECT_KINDS.map((kind) => (
                  <option key={kind.id} value={kind.id}>
                    {kind.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="portfolio-field portfolio-field-wide">
              <span>
                Descrição
                <small aria-hidden="true">
                  {(p.description ?? "").length}/500
                </small>
              </span>
              <textarea
                aria-label={"Descrição do projeto " + number}
                value={p.description ?? ""}
                maxLength={500}
                rows={3}
                placeholder="Que problema o projeto resolve e como ele funciona."
                onChange={(e) => onChange({ description: e.target.value })}
              />
            </label>
            <label className="portfolio-field portfolio-field-wide">
              <span>
                Tecnologias <small>separadas por vírgula</small>
              </span>
              <input
                aria-label={"Tecnologias do projeto " + number}
                value={typed}
                maxLength={400}
                placeholder="Java, PostgreSQL, React"
                onChange={(e) => {
                  setTyped(e.target.value);
                  const labels = splitLabels(e.target.value, MAX_TECHNOLOGIES);
                  setSeen(labels.join(", "));
                  onChange({ technologies: labels });
                }}
              />
            </label>
            <label className="portfolio-field">
              <span>
                Disciplina <small>opcional</small>
              </span>
              <input
                aria-label={"Disciplina do projeto " + number}
                value={p.subject ?? ""}
                maxLength={120}
                placeholder="Ex.: Engenharia de Software"
                onChange={(e) => onChange({ subject: e.target.value })}
              />
            </label>
            <label className="portfolio-field">
              <span>
                Período <small>opcional</small>
              </span>
              <input
                aria-label={"Período do projeto " + number}
                value={p.period ?? ""}
                maxLength={40}
                placeholder="Ex.: 2026.1 · 3º período"
                onChange={(e) => onChange({ period: e.target.value })}
              />
            </label>
            <label className="portfolio-field">
              <span>
                Repositório <small>opcional</small>
              </span>
              <input
                type="url"
                aria-label={"Repositório do projeto " + number}
                value={p.repoUrl ?? ""}
                maxLength={300}
                placeholder="https://github.com/voce/projeto"
                onChange={(e) => onChange({ repoUrl: e.target.value })}
              />
            </label>
            <label className="portfolio-field">
              <span>
                Demonstração ou site <small>opcional</small>
              </span>
              <input
                type="url"
                aria-label={"Link do projeto " + number}
                value={p.url ?? ""}
                maxLength={300}
                placeholder="https://meu-projeto.com"
                onChange={(e) => onChange({ url: e.target.value })}
              />
            </label>
            <div className="portfolio-field portfolio-field-wide portfolio-team">
              <label className="portfolio-team-toggle">
                <input
                  type="checkbox"
                  aria-label={`Projeto ${number} feito em equipe`}
                  checked={Boolean(p.team)}
                  onChange={(e) => onChange({ team: e.target.checked })}
                />
                <span>
                  <strong>Feito em equipe</strong>
                  <small>
                    Diga qual foi a sua parte, para o trabalho do grupo não
                    parecer só seu.
                  </small>
                </span>
              </label>
              {p.team ? (
                <label className="portfolio-field">
                  <span>
                    Minha participação
                    <small aria-hidden="true">
                      {(p.role ?? "").length}/300
                    </small>
                  </span>
                  <textarea
                    aria-label={"Minha participação no projeto " + number}
                    value={p.role ?? ""}
                    maxLength={300}
                    rows={2}
                    placeholder="Ex.: modelei o banco e escrevi a API de reservas."
                    onChange={(e) => onChange({ role: e.target.value })}
                  />
                </label>
              ) : null}
            </div>
            <label className="portfolio-field portfolio-field-wide">
              <span>
                Resultado <small>opcional</small>
              </span>
              <textarea
                aria-label={"Resultado do projeto " + number}
                value={p.outcome ?? ""}
                maxLength={300}
                rows={2}
                placeholder="O que ficou pronto, quem usou, que nota ou retorno teve."
                onChange={(e) => onChange({ outcome: e.target.value })}
              />
            </label>
          </div>
          <div className="portfolio-project-skills">
            <span className="portfolio-field-title">
              Competências que este projeto demonstra
            </span>
            {skills.length ? (
              <div
                role="group"
                aria-label={`Competências do projeto ${number}`}
              >
                {skills.map((name) => {
                  const used = byTechnology(name, p);
                  const on = used || (p.skills ?? []).includes(name);
                  return (
                    <button
                      type="button"
                      key={name}
                      aria-pressed={on}
                      aria-label={`${name} no projeto ${number}`}
                      title={
                        used
                          ? "Já aparece nas tecnologias do projeto"
                          : undefined
                      }
                      disabled={used}
                      onClick={() =>
                        onChange({
                          skills: on
                            ? (p.skills ?? []).filter((label) => label !== name)
                            : [...(p.skills ?? []), name],
                        })
                      }
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p>
                Escreva suas competências no topo do portfólio para ligá-las aos
                projetos.
              </p>
            )}
          </div>
          {p.github ? (
            <div className="portfolio-github-source" data-linked={linked}>
              <FolderGit2 size={18} aria-hidden="true" />
              <p>
                {linked ? (
                  <>
                    Importado de <strong>{p.github.fullName}</strong>
                    {p.github.fork ? " (fork)" : ""}
                    {githubUpdated(p.github.updatedAt)
                      ? `, atualizado em ${githubUpdated(p.github.updatedAt)}`
                      : ""}
                    .
                  </>
                ) : (
                  <>
                    O link do repositório mudou: o selo do GitHub sai deste
                    projeto ao salvar.
                  </>
                )}
                {refresh && refresh !== "busy" ? (
                  <span role="status">
                    {refresh === "done"
                      ? " Dados atualizados. Salve o portfólio para guardar."
                      : ` ${refresh}`}
                  </span>
                ) : null}
              </p>
              {linked ? (
                <button
                  type="button"
                  className="secondary"
                  disabled={refresh === "busy"}
                  onClick={() => void update()}
                >
                  <RefreshCw size={15} aria-hidden="true" />
                  {refresh === "busy" ? "Atualizando…" : "Atualizar do GitHub"}
                </button>
              ) : null}
            </div>
          ) : null}
          <div className="portfolio-project-files">
            <span className="portfolio-field-title">Imagens e PDFs</span>
            <PortfolioAttachments
              ids={p.assets}
              assets={assets}
              owner
              onUpload={onUpload}
              onChange={(ids) => onChange({ assets: ids })}
            />
          </div>
        </div>
      ) : null}
    </article>
  );
}
