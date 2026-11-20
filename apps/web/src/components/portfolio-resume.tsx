"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ClipboardCopy,
  Download,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";
import { api } from "@/lib/api";
import { journeyKindLabel, type JourneyEntry } from "@/lib/portfolio-journey";
import { showcase } from "@/lib/portfolio-projects";
import {
  buildResume,
  defaultResume,
  MAX_RESUME_EDUCATION,
  MAX_RESUME_PROJECTS,
  RESUME_TEMPLATES,
  resumeJourney,
  resumeText,
  type ResumeContact,
  type ResumeSettings,
} from "@/lib/portfolio-resume";
import { Feedback } from "./feedback";
import type { Portfolio } from "./portfolio-format";
import { linkedInShare, portfolioLink } from "./portfolio-share";
import { Shell } from "./shell";
import "./portfolio-resume.css";

const CONTACT: {
  key: keyof ResumeContact;
  label: string;
  type: string;
  placeholder: string;
}[] = [
  {
    key: "email",
    label: "E-mail",
    type: "email",
    placeholder: "voce@email.com",
  },
  {
    key: "phone",
    label: "Telefone",
    type: "tel",
    placeholder: "(11) 90000-0000",
  },
  { key: "city", label: "Cidade", type: "text", placeholder: "São Paulo, SP" },
  {
    key: "linkedin",
    label: "LinkedIn",
    type: "url",
    placeholder: "https://www.linkedin.com/in/voce",
  },
  {
    key: "github",
    label: "GitHub",
    type: "url",
    placeholder: "https://github.com/voce",
  },
  { key: "site", label: "Site", type: "url", placeholder: "https://" },
];

/**
 * The résumé builder. It writes nothing of its own: the student picks a model and ticks what
 * goes in, and the page arranges facts that are already in their portfolio and journey.
 */
export function ResumeBuilder() {
  const [portfolio, setPortfolio] = useState<Portfolio>();
  const [journey, setJourney] = useState<JourneyEntry[]>([]);
  const [settings, setSettings] = useState<ResumeSettings>();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Only the load that is still current may fill the page: a late answer from an earlier
    // one would undo what the student has already ticked.
    let current = true;
    void Promise.all([
      api<Portfolio>("/portfolio/me", { cache: "no-store" }),
      api<{ entries?: JourneyEntry[] }>("/portfolio/me/journey", {
        cache: "no-store",
      }),
      api<Partial<ResumeSettings>>("/portfolio/me/resume", {
        cache: "no-store",
      }),
    ])
      .then(([mine, timeline, saved]) => {
        if (!current) return;
        const entries = timeline?.entries ?? [];
        setPortfolio(mine);
        setJourney(entries);
        setSettings(defaultResume(mine, entries, saved ?? {}));
      })
      .catch((cause) => {
        if (current) setError((cause as Error).message);
      });
    return () => {
      current = false;
    };
  }, []);

  const doc = useMemo(
    () =>
      portfolio && settings
        ? buildResume(portfolio, journey, settings)
        : undefined,
    [portfolio, journey, settings],
  );

  if (!portfolio || !settings || !doc)
    return (
      <Shell>
        <div className="content">
          {error ? (
            <Feedback error={error} />
          ) : (
            <p role="status">Montando seu currículo…</p>
          )}
        </div>
      </Shell>
    );

  const change = (patch: Partial<ResumeSettings>) => {
    setSuccess("");
    setSettings({ ...settings, ...patch });
  };
  const toggle = (key: "projects" | "journey" | "skills", id: string) =>
    change({
      [key]: settings[key].includes(id)
        ? settings[key].filter((item) => item !== id)
        : [...settings[key], id],
    });
  const projects = showcase(portfolio.projects ?? []);
  const records = resumeJourney(journey);

  async function save() {
    if (busy || !settings) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await api("/portfolio/me/resume", {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      setSuccess("Currículo salvo.");
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function copy() {
    if (!doc) return;
    try {
      await navigator.clipboard.writeText(resumeText(doc));
      setError("");
      setSuccess("Texto do currículo copiado.");
    } catch {
      setError("Não foi possível copiar. Use Baixar em PDF.");
    }
  }

  return (
    <Shell>
      <div className="content portfolio-editor-page resume-page">
        <header className="page-header resume-header">
          <Link className="resume-back" href="/portfolio">
            <ArrowLeft size={16} aria-hidden="true" /> Portfólio
          </Link>
          <div>
            <FileText size={30} aria-hidden="true" />
            <h1>Currículo</h1>
          </div>
          <p>
            Feito com o que já está no seu portfólio e na sua jornada. Você
            escolhe o modelo e o que entra; o Enturma não inventa nada.
          </p>
        </header>
        <Feedback error={error} success={success} />
        <div className="resume-layout">
          <div className="resume-controls">
            <fieldset className="resume-group">
              <legend>Modelo</legend>
              <div className="resume-templates">
                {RESUME_TEMPLATES.map((template) => (
                  <label
                    key={template.id}
                    data-on={settings.template === template.id || undefined}
                  >
                    <input
                      type="radio"
                      name="resume-template"
                      checked={settings.template === template.id}
                      onChange={() => change({ template: template.id })}
                    />
                    <span>
                      <strong>{template.label}</strong>
                      <small>{template.hint}</small>
                    </span>
                  </label>
                ))}
              </div>
              <label className="resume-look">
                <input
                  type="checkbox"
                  checked={settings.look === "ACCENT"}
                  onChange={(e) =>
                    change({ look: e.target.checked ? "ACCENT" : "PLAIN" })
                  }
                />
                <span>
                  <strong>Usar a cor do meu perfil nos títulos</strong>
                  <small>
                    Desmarcado, o currículo sai em preto no branco, o formato
                    mais seguro para sistemas de recrutamento.
                  </small>
                </span>
              </label>
            </fieldset>

            <fieldset className="resume-group">
              <legend>Contato</legend>
              <p className="resume-hint">
                Estes dados só aparecem neste currículo e no PDF. Não vão para a
                página pública do portfólio.
              </p>
              <div className="resume-fields">
                {CONTACT.map((field) => (
                  <label key={field.key}>
                    <span>{field.label}</span>
                    <input
                      type={field.type}
                      aria-label={field.label}
                      value={settings.contact[field.key]}
                      placeholder={field.placeholder}
                      maxLength={field.key === "phone" ? 40 : 160}
                      onChange={(e) =>
                        change({
                          contact: {
                            ...settings.contact,
                            [field.key]: e.target.value,
                          },
                        })
                      }
                    />
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="resume-group">
              <legend>Apresentação</legend>
              <label className="resume-wide">
                <span>Objetivo</span>
                <input
                  aria-label="Objetivo do currículo"
                  value={settings.objective}
                  maxLength={200}
                  placeholder="Ex.: Estágio em desenvolvimento back-end"
                  onChange={(e) => change({ objective: e.target.value })}
                />
              </label>
              <label className="resume-wide">
                <span>Resumo</span>
                <textarea
                  aria-label="Resumo do currículo"
                  value={settings.summary}
                  maxLength={1200}
                  rows={3}
                  onChange={(e) => change({ summary: e.target.value })}
                />
              </label>
            </fieldset>

            <fieldset className="resume-group">
              <legend>Formação</legend>
              {settings.education.map((item, index) => {
                const edit = (patch: Partial<typeof item>) =>
                  change({
                    education: settings.education.map((other, at) =>
                      at === index ? { ...other, ...patch } : other,
                    ),
                  });
                const n = index + 1;
                return (
                  <div className="resume-education" key={index}>
                    <input
                      aria-label={`Curso da formação ${n}`}
                      value={item.course}
                      maxLength={120}
                      placeholder="Curso"
                      onChange={(e) => edit({ course: e.target.value })}
                    />
                    <input
                      aria-label={`Instituição da formação ${n}`}
                      value={item.institution}
                      maxLength={160}
                      placeholder="Instituição"
                      onChange={(e) => edit({ institution: e.target.value })}
                    />
                    <input
                      aria-label={`Período da formação ${n}`}
                      value={item.period}
                      maxLength={60}
                      placeholder="2024 a 2026"
                      onChange={(e) => edit({ period: e.target.value })}
                    />
                    <button
                      type="button"
                      className="text-button"
                      aria-label={`Remover formação ${n}`}
                      onClick={() =>
                        change({
                          education: settings.education.filter(
                            (_, at) => at !== index,
                          ),
                        })
                      }
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </div>
                );
              })}
              {settings.education.length < MAX_RESUME_EDUCATION ? (
                <button
                  type="button"
                  className="secondary resume-add"
                  onClick={() =>
                    change({
                      education: [
                        ...settings.education,
                        { course: "", institution: "", period: "" },
                      ],
                    })
                  }
                >
                  <Plus size={15} aria-hidden="true" /> Adicionar formação
                </button>
              ) : null}
            </fieldset>

            <fieldset className="resume-group">
              <legend>
                Projetos
                <small>
                  {settings.projects.length} de {projects.length}
                </small>
              </legend>
              {projects.length ? (
                <ul className="resume-picks">
                  {projects.map((project) => {
                    const on = settings.projects.includes(project.id!);
                    return (
                      <li key={project.id}>
                        <label>
                          <input
                            type="checkbox"
                            aria-label={`Incluir o projeto ${project.name}`}
                            checked={on}
                            disabled={
                              !on &&
                              settings.projects.length >= MAX_RESUME_PROJECTS
                            }
                            onChange={() => toggle("projects", project.id!)}
                          />
                          <span>
                            <strong>{project.name}</strong>
                            {project.technologies?.length ? (
                              <small>{project.technologies.join(", ")}</small>
                            ) : null}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="resume-hint">
                  Seu portfólio ainda não tem projetos ativos.
                </p>
              )}
            </fieldset>

            {portfolio.skills?.length ? (
              <fieldset className="resume-group">
                <legend>Competências</legend>
                <div className="resume-chips">
                  {portfolio.skills.map((name) => (
                    <label
                      key={name}
                      data-on={settings.skills.includes(name) || undefined}
                    >
                      <input
                        type="checkbox"
                        aria-label={`Incluir a competência ${name}`}
                        checked={settings.skills.includes(name)}
                        onChange={() => toggle("skills", name)}
                      />
                      {name}
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}

            {records.length ? (
              <fieldset className="resume-group">
                <legend>Da sua jornada</legend>
                <ul className="resume-picks">
                  {records.map((entry) => (
                    <li key={entry.id}>
                      <label>
                        <input
                          type="checkbox"
                          aria-label={`Incluir ${entry.title}`}
                          checked={settings.journey.includes(entry.id)}
                          onChange={() => toggle("journey", entry.id)}
                        />
                        <span>
                          <strong>{entry.title}</strong>
                          <small>{journeyKindLabel(entry.kind)}</small>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </fieldset>
            ) : null}
          </div>

          <div className="resume-side">
            <div className="resume-actions">
              <button type="button" disabled={busy} onClick={() => void save()}>
                {busy ? "Salvando…" : "Salvar currículo"}
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => window.print()}
              >
                <Download size={16} aria-hidden="true" /> Baixar em PDF
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => void copy()}
              >
                <ClipboardCopy size={16} aria-hidden="true" /> Copiar como texto
              </button>
              {portfolio.publicProfile ? (
                <a
                  className="button secondary"
                  href={linkedInShare(portfolioLink(portfolio.username))}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Compartilhar portfólio no LinkedIn
                </a>
              ) : (
                <p className="resume-hint">
                  Deixe o portfólio público para compartilhar o link dele no
                  LinkedIn.
                </p>
              )}
            </div>
            <section
              className="resume-sheet"
              aria-label="Prévia do currículo"
              data-look={settings.look}
              style={
                {
                  "--resume-accent": portfolio.accentColor,
                } as React.CSSProperties
              }
            >
              <header>
                <h1>{doc.name}</h1>
                {doc.headline ? <p>{doc.headline}</p> : null}
                {doc.contact.length ? (
                  <p className="resume-contact">
                    {doc.contact.map((part) => (
                      <span key={part}>{part}</span>
                    ))}
                  </p>
                ) : null}
                {doc.links.length ? (
                  <p className="resume-contact">
                    {doc.links.map((link) => (
                      <span key={link.label}>
                        {link.label}: <a href={link.href}>{link.href}</a>
                      </span>
                    ))}
                  </p>
                ) : null}
              </header>
              {doc.sections.map((section) => (
                <section key={section.id}>
                  <h2>{section.title}</h2>
                  {section.text ? <p>{section.text}</p> : null}
                  {section.items?.length ? (
                    <p>{section.items.join(", ")}</p>
                  ) : null}
                  {section.entries?.map((entry, index) => (
                    <div className="resume-entry" key={index}>
                      <h3>{entry.title}</h3>
                      {entry.meta ? (
                        <p className="resume-meta">{entry.meta}</p>
                      ) : null}
                      {entry.lines.map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                      {entry.link ? (
                        <p>
                          <a href={entry.link}>{entry.link}</a>
                        </p>
                      ) : null}
                    </div>
                  ))}
                </section>
              ))}
              {!doc.sections.length ? (
                <p className="resume-empty">
                  Marque o que deve entrar para o currículo aparecer aqui.
                </p>
              ) : null}
            </section>
          </div>
        </div>
      </div>
    </Shell>
  );
}
