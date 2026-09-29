"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, post } from "@/lib/api";
import { Shell } from "./shell";
import { Feedback } from "./feedback";
type Row = Record<string, unknown>;
const text = (value: unknown) =>
  value === null || value === undefined
    ? "—"
    : typeof value === "object"
      ? JSON.stringify(value)
      : String(value);
export function CatalogAdmin({ section = "summary" }: { section?: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [summary, setSummary] = useState<Row>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(true);
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [detail, setDetail] = useState<Row>();
  const [document, setDocument] = useState("");
  const [format, setFormat] = useState("json");
  const [provider, setProvider] = useState("UNA");
  useEffect(() => {
    let active = true;
    api<Row | Row[]>(`/admin/catalog/${section}?page=${page}`)
      .then((r) => {
        if (active) {
          if (Array.isArray(r)) setRows(r);
          else setSummary(r);
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [section, page, revision]);
  async function action(path: string, body: unknown = {}) {
    setBusy(true);
    setError("");
    try {
      await post(`/admin/catalog/${path}`, body);
      setSuccess("Ação registrada. Consulte o processamento e a auditoria.");
      setRevision((n) => n + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const columns =
    section === "imports"
      ? ["provider", "status", "processedItems", "totalItems", "failedItems"]
      : section === "sources"
        ? ["provider", "sourceName", "verifiedAt", "status"]
        : section === "requests"
          ? ["name", "requests", "firstRequestedAt"]
          : section === "events"
            ? ["type", "provider", "createdAt"]
            : section === "audit"
              ? ["action", "entityType", "createdAt"]
              : ["provider", "status", "externalId", "errorMessage"];
  return (
    <Shell>
      <h1>Catálogo acadêmico</h1>
      <p className="lead">Fontes, cobertura e importações verificáveis.</p>
      <nav className="admin-tabs">
        {[
          ["summary", "Visão geral"],
          ["imports", "Importações"],
          ["review", "Revisão"],
          ["sources", "Fontes"],
          ["requests", "Solicitações"],
          ["events", "Eventos"],
          ["audit", "Auditoria"],
        ].map(([s, label]) => (
          <Link
            key={s}
            href={s === "summary" ? "/admin/catalog" : `/admin/catalog/${s}`}
          >
            {label}
          </Link>
        ))}
      </nav>
      <Feedback error={error} success={success} />
      <button
        className="secondary"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          setRevision((n) => n + 1);
        }}
      >
        Atualizar
      </button>
      {busy && <p role="status">Carregando catálogo…</p>}
      {section === "summary" ? (
        <>
          <div className="catalog-stats">
            {[
              ["institution", "Instituições"],
              ["campus", "Campi"],
              ["course_offering", "Ofertas"],
              ["curriculum", "Grades"],
              ["subject", "Disciplinas"],
              ["verified", "Registros verificados"],
              ["pending", "Itens em revisão"],
              ["activeJobs", "Jobs ativos"],
            ].map(([key, label]) => (
              <article key={key}>
                <strong>{text(summary[key])}</strong>
                {label}
              </article>
            ))}
          </div>
          <p className="catalog-note">
            A cobertura considera as ofertas conhecidas e documentadas no
            catálogo. Ela não representa todas as ofertas do Brasil.
          </p>
          <Coverage />
        </>
      ) : null}
      {section === "imports" ? (
        <>
          <details>
            <summary>Nova importação</summary>
            <label>
              Formato
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
              </select>
            </label>
            <label>
              Provider
              <input
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                maxLength={60}
              />
            </label>
            <label>
              Selecionar arquivo
              <input
                type="file"
                accept=".json,.csv"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    if (f.size > 3500000) {
                      setError("Arquivo excede 3,5 MB.");
                      return;
                    }
                    setDocument(await f.text());
                  }
                }}
              />
            </label>
            <label>
              Documento
              <textarea
                className="code-input"
                value={document}
                onChange={(e) => setDocument(e.target.value)}
                spellCheck={false}
              />
            </label>
            <button
              disabled={busy || !document.trim()}
              onClick={async () => {
                try {
                  setBusy(true);
                  if (format === "csv")
                    await api(
                      `/admin/catalog/imports/csv?provider=${encodeURIComponent(provider)}`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "text/csv" },
                        body: document,
                      },
                    );
                  else
                    await post("/admin/catalog/imports", JSON.parse(document));
                  setSuccess(
                    "Importação criada. Os lotes serão processados em segundo plano.",
                  );
                  setRevision((n) => n + 1);
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Validar e iniciar
            </button>
            <p>
              O JSON contém provider e entries; cada item exige identidade
              externa, hierarquia e procedência. Documentação:
              docs/ACADEMIC_IMPORTS.md.
            </p>
          </details>
          <div className="actions">
            {["UNA", "PUCMINAS", "UFMG"].map((p) => (
              <button
                key={p}
                disabled={busy}
                onClick={() => void action(`providers/${p}/imports`)}
              >
                Reimportar {p}
              </button>
            ))}
          </div>
        </>
      ) : null}
      {section !== "summary" ? (
        <div className="catalog-table">
          <table>
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c}>
                    {(
                      {
                        provider: "Provider",
                        status: "Situação",
                        processedItems: "Processados",
                        totalItems: "Total",
                        failedItems: "Pendências",
                        sourceName: "Fonte",
                        verifiedAt: "Verificado em",
                        name: "Oferta",
                        requests: "Solicitações",
                        firstRequestedAt: "Primeira solicitação",
                        externalId: "Identificador",
                        errorMessage: "Motivo",
                        type: "Evento",
                        createdAt: "Data",
                        action: "Ação",
                        entityType: "Tipo",
                      } as Record<string, string>
                    )[c] ?? c}
                  </th>
                ))}
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, index) => (
                <tr key={text(r.id ?? r.courseOfferingId ?? index)}>
                  {columns.map((c) => (
                    <td key={c}>{text(r[c])}</td>
                  ))}
                  <td>
                    {section === "imports" ? (
                      <>
                        <button
                          onClick={async () => {
                            try {
                              setDetail(
                                await api<Row>(
                                  `/admin/catalog/imports/${r.id}`,
                                ),
                              );
                            } catch (e) {
                              setError((e as Error).message);
                            }
                          }}
                        >
                          Detalhes
                        </button>
                        {["PENDING", "RUNNING"].includes(text(r.status)) ? (
                          <>
                            <button
                              disabled={busy}
                              onClick={() =>
                                void action(`imports/${r.id}/pause`)
                              }
                            >
                              Pausar
                            </button>
                            <button
                              disabled={busy}
                              onClick={() =>
                                void action(`imports/${r.id}/cancel`)
                              }
                            >
                              Cancelar
                            </button>
                          </>
                        ) : r.status === "PAUSED" ? (
                          <button
                            disabled={busy}
                            onClick={() =>
                              void action(`imports/${r.id}/resume`)
                            }
                          >
                            Retomar
                          </button>
                        ) : r.status === "COMPLETED_WITH_ERRORS" ? (
                          <button
                            disabled={busy}
                            onClick={() => void action(`imports/${r.id}/retry`)}
                          >
                            Repetir falhas
                          </button>
                        ) : null}
                      </>
                    ) : section === "review" ? (
                      <details>
                        <summary>Revisar registro</summary>
                        <pre className="review-json">
                          {JSON.stringify(r.payload, null, 2)}
                        </pre>
                        {r.current ? (
                          <pre className="review-json">
                            Atual: {JSON.stringify(r.current, null, 2)}
                          </pre>
                        ) : null}
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            try {
                              const correction = JSON.parse(
                                String(
                                  new FormData(e.currentTarget).get(
                                    "correction",
                                  ),
                                ),
                              );
                              void action(`review/${r.id}`, {
                                action: "approve",
                                correction,
                              });
                            } catch {
                              setError("JSON da correção inválido.");
                            }
                          }}
                        >
                          <label>
                            Correção verificada
                            <textarea
                              name="correction"
                              className="code-input"
                              defaultValue={JSON.stringify(r.payload, null, 2)}
                            />
                          </label>
                          <button disabled={busy}>Aprovar com correção</button>
                        </form>
                        <button
                          disabled={busy}
                          onClick={() =>
                            void action(`review/${r.id}`, { action: "reject" })
                          }
                        >
                          Rejeitar
                        </button>
                        <button
                          disabled={busy}
                          onClick={() =>
                            void action(`review/${r.id}`, { action: "archive" })
                          }
                        >
                          Arquivar item
                        </button>
                      </details>
                    ) : section === "sources" ? (
                      <>
                        <a
                          href={text(r.sourceUrl)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Abrir fonte
                        </a>
                        <button
                          disabled={busy}
                          onClick={() => void action(`sources/${r.id}/check`)}
                        >
                          Verificar mudança
                        </button>
                      </>
                    ) : (
                      <details>
                        <summary>Detalhes</summary>
                        <pre className="review-json">
                          {JSON.stringify(r, null, 2)}
                        </pre>
                      </details>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!busy && !rows.length ? (
            <p className="empty">Nenhum registro nesta página.</p>
          ) : null}
        </div>
      ) : null}
      {detail ? (
        <details open>
          <summary>Detalhes da importação</summary>
          <pre className="review-json">{JSON.stringify(detail, null, 2)}</pre>
          <button onClick={() => setDetail(undefined)}>Fechar</button>
        </details>
      ) : null}
      {section !== "summary" ? (
        <div className="actions">
          <button
            disabled={page === 0 || busy}
            onClick={() => {
              setBusy(true);
              setPage((n) => n - 1);
            }}
          >
            Anterior
          </button>
          <span>Página {page + 1}</span>
          <button
            disabled={rows.length < 30 || busy}
            onClick={() => {
              setBusy(true);
              setPage((n) => n + 1);
            }}
          >
            Próxima
          </button>
        </div>
      ) : null}
    </Shell>
  );
}
function Coverage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    api<Row[]>("/catalog/coverage/summary")
      .then(setRows)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <>
      <Feedback error={error} />
      {rows.map((r) => (
        <article className="room-row" key={text(r.id)}>
          <h3>{text(r.name)}</h3>
          <p>
            {text(r.offeringsWithCurriculum)} de {text(r.knownOfferings)}{" "}
            ofertas conhecidas com grade verificada
          </p>
        </article>
      ))}
    </>
  );
}
