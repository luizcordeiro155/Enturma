"use client";

import { useState } from "react";
import { Lightbulb } from "lucide-react";
import { api } from "@/lib/api";
import type { Project } from "@/lib/portfolio-projects";
import "./portfolio-mentor.css";

type Field = "description" | "role" | "outcome" | "caseStudy";
type Suggestions = Partial<Record<Field, string>> & { questions?: string[] };

const FIELDS: { field: Field; title: string; label: string }[] = [
  { field: "description", title: "Descrição", label: "descrição" },
  { field: "role", title: "Minha participação", label: "minha participação" },
  { field: "outcome", title: "Resultado", label: "resultado" },
  { field: "caseStudy", title: "Estudo de caso", label: "estudo de caso" },
];

const text = (value?: string) => (value ?? "").trim();

/** What the mentor is given: this project's own words and the goal, nothing else. */
export function mentorDraft(project: Project, goal: string) {
  const draft: Record<string, unknown> = {
    name: text(project.name),
    description: text(project.description),
    technologies: project.technologies ?? [],
    team: Boolean(project.team),
  };
  if (text(project.subject)) draft.subject = text(project.subject);
  if (project.team && text(project.role)) draft.role = text(project.role);
  if (text(project.outcome)) draft.outcome = text(project.outcome);
  if (text(goal)) draft.goal = text(goal);
  return draft;
}

/**
 * The mentor rewords one project. It suggests; the student accepts each text or not, edits it
 * in the field, and nothing reaches the portfolio until they save.
 */
export function PortfolioMentor({
  project,
  number,
  goal,
  onUse,
}: {
  project: Project;
  number: number;
  /** The goal as it is typed right now, read when the student asks. */
  goal: () => string;
  onUse: (patch: Partial<Project>) => void;
}) {
  const [state, setState] = useState<"idle" | "busy">("idle");
  const [error, setError] = useState("");
  const [found, setFound] = useState<Suggestions>();
  // What each field held before a suggestion went in, so it can be put back.
  const [before, setBefore] = useState<Partial<Record<Field, string>>>({});
  const ready =
    text(project.name).length > 0 && text(project.description).length >= 12;

  async function ask() {
    if (!ready || state === "busy") return;
    setState("busy");
    setError("");
    try {
      const reply = await api<Suggestions>("/portfolio/me/mentor", {
        method: "POST",
        body: JSON.stringify(mentorDraft(project, goal())),
      });
      setFound(reply ?? {});
      setBefore({});
    } catch (cause) {
      setFound(undefined);
      setError((cause as Error).message);
    } finally {
      setState("idle");
    }
  }

  const offered = FIELDS.filter(
    ({ field }) =>
      text(found?.[field]) && (field !== "role" || Boolean(project.team)),
  );
  const questions = (found?.questions ?? []).filter((q) => text(q));
  return (
    <div className="portfolio-mentor">
      <div className="portfolio-mentor-ask">
        <Lightbulb size={18} aria-hidden="true" />
        <p>
          <strong>Mentor do portfólio</strong>
          <span>
            {ready
              ? "Lê só o que você escreveu neste projeto e sugere um texto mais claro. Você escolhe o que usar."
              : "Escreva o nome e pelo menos uma frase de descrição para o mentor ter de onde partir."}
          </span>
        </p>
        <button
          type="button"
          className="secondary"
          disabled={!ready || state === "busy"}
          aria-busy={state === "busy"}
          onClick={() => void ask()}
        >
          {state === "busy"
            ? "Lendo o projeto…"
            : found
              ? "Pedir de novo"
              : "Pedir sugestões ao mentor"}
        </button>
      </div>
      {error ? (
        <p className="portfolio-mentor-error" role="alert">
          {error}
        </p>
      ) : null}
      {found ? (
        <section
          className="portfolio-mentor-panel"
          aria-label={`Sugestões do mentor para o projeto ${number}`}
        >
          <p className="portfolio-mentor-note">
            Sugestões geradas por IA a partir do seu rascunho. Confira se cada
            frase é verdadeira antes de usar: o mentor não conhece o projeto, só
            o que você escreveu.
          </p>
          {offered.map(({ field, title: heading, label }) => {
            const applied = field in before;
            return (
              <article key={field} data-applied={applied || undefined}>
                <h4>{heading}</h4>
                <p>{found[field]}</p>
                <button
                  type="button"
                  className="secondary"
                  aria-label={`${applied ? "Desfazer" : "Usar"} sugestão de ${label} no projeto ${number}`}
                  onClick={() => {
                    if (applied) {
                      onUse({ [field]: before[field] });
                      setBefore((v) => {
                        const next = { ...v };
                        delete next[field];
                        return next;
                      });
                    } else {
                      setBefore((v) => ({
                        ...v,
                        [field]: project[field] ?? "",
                      }));
                      onUse({ [field]: found[field] });
                    }
                  }}
                >
                  {applied ? "Desfazer" : "Usar este texto"}
                </button>
                {applied ? (
                  <small role="status">
                    Está no campo acima. Edite à vontade e salve o portfólio
                    para guardar.
                  </small>
                ) : null}
              </article>
            );
          })}
          {questions.length ? (
            <div className="portfolio-mentor-questions">
              <h4>O que ainda falta contar</h4>
              <ul>
                {questions.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
              <small>
                Responda nos campos do projeto e peça de novo: o mentor só
                escreve sobre o que estiver lá.
              </small>
            </div>
          ) : null}
          <button
            type="button"
            className="portfolio-mentor-close"
            onClick={() => {
              setFound(undefined);
              setBefore({});
            }}
          >
            Fechar sugestões
          </button>
        </section>
      ) : null}
    </div>
  );
}
