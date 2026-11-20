"use client";

import { FormEvent, useEffect, useId, useState } from "react";
import { Eye, EyeOff, Pencil, Plus, Route, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import {
  bySemester,
  JOURNEY_KINDS,
  journeyKindLabel,
  monthLabel,
  type JourneyEntry,
  type JourneySuggestion,
} from "@/lib/portfolio-journey";
import "./portfolio-journey.css";

type Draft = {
  id?: string;
  source?: string;
  kind: string;
  title: string;
  detail: string;
  date: string;
  visible: boolean;
};

const body = (draft: Draft) => ({
  kind: draft.kind,
  title: draft.title.trim(),
  detail: draft.detail.trim(),
  date: draft.date,
  visible: draft.visible,
  ...(draft.source && !draft.id ? { source: draft.source } : {}),
});

/** How many suggestions open at first, so they never bury the timeline. */
const OFFERS = 4;

/**
 * The owner's side of Minha Jornada. Every change is saved as it is made, apart from the
 * portfolio's own "Salvar", and a record only reaches visitors when the student shows it.
 */
export function JourneyEditor() {
  const [entries, setEntries] = useState<JourneyEntry[]>();
  const [suggestions, setSuggestions] = useState<JourneySuggestion[]>([]);
  const [draft, setDraft] = useState<Draft>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [removing, setRemoving] = useState<string>();
  const [allOffers, setAllOffers] = useState(false);
  const heading = useId();

  useEffect(() => {
    void api<{ entries: JourneyEntry[]; suggestions: JourneySuggestion[] }>(
      "/portfolio/me/journey",
      { cache: "no-store" },
    )
      .then((v) => {
        setEntries(v?.entries ?? []);
        setSuggestions(v?.suggestions ?? []);
      })
      .catch((cause) => {
        setEntries([]);
        setError((cause as Error).message);
      });
  }, []);

  function open(next: Draft) {
    setFormError("");
    setError("");
    setDraft(next);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    // The journey sits on the portfolio page but is not part of its form.
    event.preventDefault();
    event.stopPropagation();
    if (!draft || busy) return;
    if (!draft.title.trim()) return setFormError("Dê um título ao registro.");
    if (!draft.date) return setFormError("Informe a data do registro.");
    setBusy(true);
    setFormError("");
    try {
      const saved = await api<JourneyEntry>(
        draft.id
          ? `/portfolio/me/journey/${draft.id}`
          : "/portfolio/me/journey",
        {
          method: draft.id ? "PUT" : "POST",
          body: JSON.stringify(body(draft)),
        },
      );
      setEntries((list) => [
        ...(list ?? []).filter((entry) => entry.id !== saved.id),
        saved,
      ]);
      if (draft.source && !draft.id)
        setSuggestions((list) =>
          list.filter((offer) => offer.source !== draft.source),
        );
      setDraft(undefined);
    } catch (cause) {
      setFormError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function show(entry: JourneyEntry, visible: boolean) {
    setError("");
    try {
      const saved = await api<JourneyEntry>(
        `/portfolio/me/journey/${entry.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            kind: entry.kind,
            title: entry.title,
            detail: entry.detail,
            date: entry.date,
            visible,
          }),
        },
      );
      setEntries((list) =>
        (list ?? []).map((item) => (item.id === entry.id ? saved : item)),
      );
    } catch (cause) {
      setError((cause as Error).message);
    }
  }

  async function remove(entry: JourneyEntry) {
    setError("");
    try {
      await api(`/portfolio/me/journey/${entry.id}`, { method: "DELETE" });
      setEntries((list) => (list ?? []).filter((item) => item.id !== entry.id));
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setRemoving(undefined);
    }
  }

  async function dismiss(offer: JourneySuggestion) {
    setError("");
    try {
      await api("/portfolio/me/journey/dismissals", {
        method: "POST",
        body: JSON.stringify({ source: offer.source }),
      });
      setSuggestions((list) =>
        list.filter((item) => item.source !== offer.source),
      );
    } catch (cause) {
      setError((cause as Error).message);
    }
  }

  const groups = bySemester(entries ?? []);
  const shownCount = (entries ?? []).filter((entry) => entry.visible).length;
  return (
    <section
      className="portfolio-project-editor portfolio-journey"
      aria-labelledby={heading}
    >
      <div className="section-heading portfolio-journey-heading">
        <div>
          <h2 id={heading}>Minha jornada</h2>
          <p className="muted">
            {entries?.length
              ? `${entries.length} ${entries.length === 1 ? "registro" : "registros"} · ${shownCount} no portfólio público`
              : "A linha do tempo da sua faculdade: marcos, disciplinas, projetos, certificados e objetivos."}
          </p>
        </div>
        <button
          type="button"
          className="secondary"
          onClick={() =>
            open({
              kind: "MILESTONE",
              title: "",
              detail: "",
              date: "",
              visible: true,
            })
          }
        >
          <Plus size={16} aria-hidden="true" /> Novo registro
        </button>
      </div>
      <p className="portfolio-journey-note">
        Cada registro é salvo na hora, separado do botão “Salvar portfólio”. Ele
        só aparece para visitantes quando você escolhe mostrar.
      </p>
      {error ? (
        <p className="portfolio-journey-error" role="alert">
          {error}
        </p>
      ) : null}
      {draft ? (
        <form
          className="portfolio-journey-form"
          aria-label={
            draft.id ? "Editar registro da jornada" : "Novo registro da jornada"
          }
          noValidate
          onSubmit={save}
        >
          <label>
            <span>Tipo</span>
            <select
              value={draft.kind}
              onChange={(e) => setDraft({ ...draft, kind: e.target.value })}
            >
              {JOURNEY_KINDS.map((kind) => (
                <option key={kind.id} value={kind.id}>
                  {kind.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Data</span>
            <input
              type="date"
              value={draft.date}
              onChange={(e) => setDraft({ ...draft, date: e.target.value })}
            />
          </label>
          <label className="portfolio-journey-wide">
            <span>Título</span>
            <input
              value={draft.title}
              maxLength={140}
              placeholder="Ex.: Apresentei o seminário de Redes"
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </label>
          <label className="portfolio-journey-wide">
            <span>
              Detalhe <small>opcional</small>
            </span>
            <textarea
              value={draft.detail}
              maxLength={600}
              rows={3}
              placeholder="O que foi, com quem, o que você aprendeu."
              onChange={(e) => setDraft({ ...draft, detail: e.target.value })}
            />
          </label>
          <label className="portfolio-journey-visible portfolio-journey-wide">
            <input
              type="checkbox"
              aria-label="Mostrar no portfólio público"
              aria-describedby={heading + "-visible"}
              checked={draft.visible}
              onChange={(e) =>
                setDraft({ ...draft, visible: e.target.checked })
              }
            />
            <span>
              <strong>Mostrar no portfólio público</strong>
              <small id={heading + "-visible"}>
                {draft.source
                  ? "Veio de um registro seu no Enturma e começa só para você. Marque se quiser mostrar."
                  : "Desmarcado, o registro fica só para você."}
              </small>
            </span>
          </label>
          {formError ? (
            <p className="portfolio-journey-error" role="alert">
              {formError}
            </p>
          ) : null}
          <div className="portfolio-journey-form-actions">
            <button type="submit" disabled={busy}>
              {busy ? "Salvando…" : "Salvar registro"}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => setDraft(undefined)}
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : null}
      {suggestions.length ? (
        <div className="portfolio-journey-offers">
          <h3>Sugestões do Enturma</h3>
          <p>
            Coisas suas que já estão no Enturma e podem entrar na jornada. Nada
            entra sem você revisar.
          </p>
          <ul aria-label="Sugestões para a jornada">
            {(allOffers ? suggestions : suggestions.slice(0, OFFERS)).map(
              (offer) => (
                <li key={offer.source}>
                  <div>
                    <strong>{offer.title}</strong>
                    <span>
                      {offer.origin}
                      {offer.date
                        ? `, ${monthLabel(offer.date)}`
                        : ", sem data"}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="secondary"
                    aria-label={`Revisar e adicionar ${offer.title}`}
                    onClick={() =>
                      open({
                        source: offer.source,
                        kind: offer.kind,
                        title: offer.title,
                        detail: offer.detail,
                        date: offer.date ?? "",
                        visible: false,
                      })
                    }
                  >
                    Revisar e adicionar
                  </button>
                  <button
                    type="button"
                    className="text-button"
                    aria-label={`Dispensar ${offer.title}`}
                    onClick={() => void dismiss(offer)}
                  >
                    Dispensar
                  </button>
                </li>
              ),
            )}
          </ul>
          {!allOffers && suggestions.length > OFFERS ? (
            <button
              type="button"
              className="text-button"
              onClick={() => setAllOffers(true)}
            >
              Mostrar mais {suggestions.length - OFFERS}{" "}
              {suggestions.length - OFFERS === 1 ? "sugestão" : "sugestões"}
            </button>
          ) : null}
        </div>
      ) : null}
      {entries === undefined ? (
        <p role="status" className="muted">
          Carregando sua jornada…
        </p>
      ) : groups.length ? (
        <ol
          className="portfolio-journey-list"
          aria-label="Registros da jornada"
        >
          {groups.map((group) => (
            <li key={group.semester}>
              <h3>{group.semester}</h3>
              <ul>
                {group.entries.map((entry) => (
                  <li key={entry.id} data-visible={Boolean(entry.visible)}>
                    <div className="portfolio-journey-entry">
                      <span className="portfolio-journey-when">
                        <span>{monthLabel(entry.date)}</span>
                        <span>{journeyKindLabel(entry.kind)}</span>
                      </span>
                      <strong>{entry.title}</strong>
                      {entry.detail ? <p>{entry.detail}</p> : null}
                      <span className="portfolio-journey-state">
                        {entry.visible ? (
                          <Eye size={14} aria-hidden="true" />
                        ) : (
                          <EyeOff size={14} aria-hidden="true" />
                        )}
                        {entry.visible ? "No portfólio público" : "Só você vê"}
                      </span>
                    </div>
                    <div className="portfolio-journey-tools">
                      <button
                        type="button"
                        className="secondary"
                        aria-label={
                          entry.visible
                            ? `Ocultar ${entry.title} do portfólio público`
                            : `Mostrar ${entry.title} no portfólio público`
                        }
                        onClick={() => void show(entry, !entry.visible)}
                      >
                        {entry.visible ? "Ocultar" : "Mostrar"}
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        aria-label={`Editar ${entry.title}`}
                        onClick={() =>
                          open({
                            id: entry.id,
                            kind: entry.kind,
                            title: entry.title,
                            detail: entry.detail,
                            date: entry.date,
                            visible: Boolean(entry.visible),
                          })
                        }
                      >
                        <Pencil size={14} aria-hidden="true" /> Editar
                      </button>
                      {removing === entry.id ? (
                        <>
                          <button
                            type="button"
                            className="secondary portfolio-journey-danger"
                            aria-label={`Remover ${entry.title} de vez`}
                            onClick={() => void remove(entry)}
                          >
                            Remover de vez
                          </button>
                          <button
                            type="button"
                            className="text-button"
                            onClick={() => setRemoving(undefined)}
                          >
                            Manter
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="text-button"
                          aria-label={`Remover ${entry.title}`}
                          onClick={() => setRemoving(entry.id)}
                        >
                          <Trash2 size={14} aria-hidden="true" /> Remover
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      ) : (
        <div className="portfolio-journey-empty">
          <Route size={26} aria-hidden="true" />
          <p>
            Sua jornada ainda está em branco. Comece pelo dia em que entrou na
            faculdade, ou revise uma sugestão acima.
          </p>
        </div>
      )}
    </section>
  );
}

/** How many records open at first on the public page. */
const PAGE = 8;

/** What visitors see: the shown records on a rail, newest first, by semester. */
export function PublicJourney({
  entries,
  onProject,
}: {
  entries: JourneyEntry[];
  onProject: (id: string, event: React.MouseEvent) => void;
}) {
  const [semester, setSemester] = useState<string>();
  const [all, setAll] = useState(false);
  if (!entries.length) return null;
  const groups = bySemester(entries);
  const picked = semester
    ? groups.filter((group) => group.semester === semester)
    : groups;
  const total = picked.reduce((sum, group) => sum + group.entries.length, 0);
  // A chosen semester opens whole; the full timeline opens a page at a time.
  const limit = semester || all ? total : PAGE;
  // Where each semester starts in the whole list, to know what is past the first page.
  const starts = picked.map((_, index) =>
    picked
      .slice(0, index)
      .reduce((sum, group) => sum + group.entries.length, 0),
  );
  return (
    <section className="public-journey">
      <div className="public-projects-heading">
        <h2>Minha jornada</h2>
        {groups.length > 1 ? (
          <div
            className="public-project-kinds"
            role="group"
            aria-label="Filtrar jornada por semestre"
          >
            <button
              type="button"
              aria-pressed={!semester}
              onClick={() => setSemester(undefined)}
            >
              Tudo
            </button>
            {groups.map((group) => (
              <button
                key={group.semester}
                type="button"
                aria-pressed={semester === group.semester}
                onClick={() => setSemester(group.semester)}
              >
                {group.semester}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <ol className="public-journey-rail" key={semester ?? "all"}>
        {picked.map((group, groupIndex) => {
          const from = starts[groupIndex];
          return (
            <li
              key={group.semester}
              className="public-journey-semester"
              data-later={from >= limit || undefined}
              hidden={from >= limit}
            >
              <h3>{group.semester}</h3>
              <ol>
                {group.entries.map((entry, index) => (
                  <li
                    key={entry.id}
                    data-kind={entry.kind}
                    data-later={from + index >= limit || undefined}
                    hidden={from + index >= limit}
                  >
                    <p className="public-journey-when">
                      <time dateTime={entry.date}>
                        {monthLabel(entry.date)}
                      </time>
                      <span>{journeyKindLabel(entry.kind)}</span>
                    </p>
                    <h4>{entry.title}</h4>
                    {entry.detail ? <p>{entry.detail}</p> : null}
                    {entry.projectId ? (
                      <a
                        href={`#projeto-${entry.projectId}`}
                        aria-label={`Ver o projeto ${entry.title}`}
                        onClick={(event) => onProject(entry.projectId!, event)}
                      >
                        Ver o projeto
                      </a>
                    ) : null}
                  </li>
                ))}
              </ol>
            </li>
          );
        })}
      </ol>
      {total > limit ? (
        <button
          type="button"
          className="public-projects-more"
          onClick={() => setAll(true)}
        >
          Mostrar a jornada inteira
          <small>
            {total - limit === 1 ? "falta 1" : `faltam ${total - limit}`}
          </small>
        </button>
      ) : null}
    </section>
  );
}
