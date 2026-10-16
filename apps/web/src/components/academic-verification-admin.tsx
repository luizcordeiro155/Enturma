"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Download, ShieldCheck } from "lucide-react";
import { api, post } from "@/lib/api";
import type { AcademicInstitution } from "@/lib/academic-identity";
import { Shell } from "./shell";
type Domain = {
  id: string;
  institutionId: string;
  institutionName: string;
  domain: string;
  status: string;
  shared: boolean;
  allowSubdomains: boolean;
  sourceUrl: string;
  verifiedAt: string | null;
};
type Review = {
  userId: string;
  name: string;
  institutionName: string;
  requestId: string;
  expiresAt: string;
  updatedAt: string;
};
type Audit = {
  id: string;
  action: string;
  reason: string | null;
  userId: string | null;
  actorId: string | null;
  createdAt: string;
};
type Support = { id: string; name: string; message: string; createdAt: string };
type Data = {
  domains: Domain[];
  reviews: Review[];
  audit: Audit[];
  support: Support[];
};
export function AcademicVerificationAdmin() {
  const domainForm = useRef<HTMLFormElement>(null);
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [institutions, setInstitutions] = useState<AcademicInstitution[]>([]);
  const [institution, setInstitution] = useState("");
  const refresh = useCallback(
    async () =>
      setData(
        await api<Data>(`/admin/academic-verification?page=${page}`, {
          cache: "no-store",
        }),
      ),
    [page],
  );
  useEffect(() => {
    const controller = new AbortController();
    api<Data>(`/admin/academic-verification?page=${page}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(setData)
      .catch((e: Error) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, [page]);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      api<{ items: AcademicInstitution[] }>(
        `/auth/academic/institutions?search=${encodeURIComponent(search)}`,
        { cache: "no-store", signal: controller.signal },
      )
        .then((r) => setInstitutions(r.items))
        .catch((e: Error) => {
          if (!controller.signal.aborted) setError(e.message);
        });
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search]);
  function editDomain(row: Domain) {
    setSearch(row.institutionName);
    setInstitutions((items) =>
      items.some((i) => i.id === row.institutionId)
        ? items
        : [
            { id: row.institutionId, name: row.institutionName, domains: [] },
            ...items,
          ],
    );
    setInstitution(row.institutionId);
    const form = domainForm.current;
    if (!form) return;
    for (const [name, value] of Object.entries({
      domain: row.domain,
      source: row.sourceUrl,
      status: row.status,
    })) {
      (
        form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement
      ).value = value;
    }
    (form.elements.namedItem("shared") as HTMLInputElement).checked =
      row.shared;
    (form.elements.namedItem("subdomains") as HTMLInputElement).checked =
      row.allowSubdomains;
    form.scrollIntoView({
      block: "center",
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
    (form.elements.namedItem("domain") as HTMLInputElement).focus({
      preventScroll: true,
    });
    setSuccess(
      "Associação carregada no formulário. Revise os dados e salve as alterações.",
    );
  }
  async function act(action: () => Promise<unknown>, message: string) {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await action();
      await refresh();
      setSuccess(message);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function download(row: Review) {
    await act(async () => {
      await api("/auth/academic/status", { cache: "no-store" });
      const response = await fetch(
        `/api/backend/admin/academic-verification/${row.userId}/documents/${row.requestId}`,
        { cache: "no-store" },
      );
      if (!response.ok)
        throw Error(
          "Não foi possível abrir o comprovante. Atualize a fila e tente novamente.",
        );
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `comprovante-${row.requestId}.${blob.type.includes("pdf") ? "pdf" : blob.type.includes("png") ? "png" : "jpg"}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "Acesso ao comprovante registrado na auditoria. Apague sua cópia local após a análise.");
  }
  return (
    <Shell>
      <div className="academic-admin">
        <header>
          <Link href="/admin">← Administração</Link>
          <h1>Identidade acadêmica</h1>
          <p className="lead">
            Domínios oficiais, comprovantes privados e decisões registradas.
          </p>
        </header>
        {error && (
          <p className="academic-error" role="alert">
            {error}
          </p>
        )}
        {success && <p role="status">{success}</p>}
        {!data ? (
          <p role="status">Consultando permissões e solicitações…</p>
        ) : (
          <>
            <div className="academic-admin-columns">
              <section>
                <h2>Autorizar um domínio</h2>
                <p>
                  Confirme o domínio de e-mail estudantil em uma fonte oficial.
                  O endereço do site da instituição, sozinho, não comprova esse
                  uso.
                </p>
                <form
                  ref={domainForm}
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const values = new FormData(form);
                    void act(async () => {
                      await api("/admin/academic-verification/domains", {
                        method: "PUT",
                        body: JSON.stringify({
                          institutionId: institution,
                          domain: values.get("domain"),
                          status: values.get("status"),
                          shared: values.has("shared"),
                          allowSubdomains: values.has("subdomains"),
                          sourceUrl: values.get("source"),
                        }),
                      });
                      form.reset();
                    }, "Domínio salvo. Contas já aprovadas mantêm seu acesso.");
                  }}
                >
                  <label>
                    Pesquisar instituição
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Nome oficial"
                    />
                  </label>
                  <label>
                    Instituição
                    <select
                      required
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                    >
                      <option value="">Selecione no catálogo</option>
                      {institutions.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Domínio completo
                    <input
                      required
                      name="domain"
                      maxLength={253}
                      placeholder="alunos.instituição.edu.br"
                    />
                  </label>
                  <label>
                    Fonte oficial
                    <input
                      required
                      type="url"
                      name="source"
                      maxLength={1800}
                      placeholder="https://…"
                    />
                  </label>
                  <label>
                    Status
                    <select name="status" defaultValue="PENDING">
                      <option value="PENDING">Pendente de confirmação</option>
                      <option value="APPROVED">Confirmado e aprovado</option>
                      <option value="DISABLED">Desativado</option>
                    </select>
                  </label>
                  <label>
                    <span>
                      <input name="shared" type="checkbox" /> Compartilhado
                      oficialmente com outras instituições
                    </span>
                  </label>
                  <label>
                    <span>
                      <input name="subdomains" type="checkbox" /> A fonte
                      autoriza também subdomínios
                    </span>
                  </label>
                  <button className="button" disabled={busy || !institution}>
                    <ShieldCheck size={18} /> Salvar domínio
                  </button>
                </form>
              </section>
              <section>
                <h2>Domínios cadastrados</h2>
                <div className="academic-admin-list">
                  {data.domains.map((row) => (
                    <article key={row.id}>
                      <strong>{row.institutionName}</strong>
                      <p>
                        @{row.domain} ·{" "}
                        {row.status === "APPROVED"
                          ? "Aprovado"
                          : row.status === "DISABLED"
                            ? "Desativado"
                            : "Pendente"}
                      </p>
                      <small>
                        {row.shared ? "Compartilhado" : "Exclusivo"} ·{" "}
                        {row.allowSubdomains
                          ? "Subdomínios autorizados"
                          : "Somente domínio exato"}
                      </small>
                      <a href={row.sourceUrl} target="_blank" rel="noreferrer">
                        Consultar fonte oficial
                      </a>
                      {row.verifiedAt && (
                        <small>
                          Conferido em{" "}
                          {new Date(row.verifiedAt).toLocaleDateString("pt-BR")}
                        </small>
                      )}
                      <div className="academic-admin-actions">
                        <button
                          disabled={busy || row.status === "DISABLED"}
                          onClick={() =>
                            void act(
                              () =>
                                api("/admin/academic-verification/domains", {
                                  method: "PUT",
                                  body: JSON.stringify({
                                    institutionId: row.institutionId,
                                    domain: row.domain,
                                    status: "DISABLED",
                                    shared: row.shared,
                                    allowSubdomains: row.allowSubdomains,
                                    sourceUrl: row.sourceUrl,
                                  }),
                                }),
                              "Domínio desativado para novas confirmações. Contas existentes preservadas.",
                            )
                          }
                        >
                          Desativar
                        </button>
                        <button disabled={busy} onClick={() => editDomain(row)}>
                          Editar associação
                        </button>
                      </div>
                    </article>
                  ))}
                  {!data.domains.length && <p>Nenhum domínio nesta página.</p>}
                </div>
              </section>
            </div>
            <section>
              <h2>Comprovantes em análise</h2>
              <p>
                Confira identificação e vínculo com a instituição. Não aprove
                com base apenas em palavras no documento. O arquivo é apagado ao
                concluir a decisão.
              </p>
              <div className="academic-admin-list">
                {data.reviews.map((row) => (
                  <article key={row.requestId}>
                    <h3>{row.name}</h3>
                    <p>{row.institutionName}</p>
                    <small>
                      Recebido em{" "}
                      {new Date(row.updatedAt).toLocaleString("pt-BR")} ·
                      Retenção até{" "}
                      {new Date(row.expiresAt).toLocaleDateString("pt-BR")}
                    </small>
                    <button onClick={() => void download(row)} disabled={busy}>
                      <Download size={16} /> Baixar comprovante privado
                    </button>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const values = new FormData(e.currentTarget);
                        const approve =
                          (
                            e.nativeEvent as SubmitEvent
                          ).submitter?.getAttribute("value") === "approve";
                        void act(
                          () =>
                            post(
                              `/admin/academic-verification/${row.userId}/review`,
                              {
                                requestId: row.requestId,
                                approve,
                                reason: values.get("reason"),
                              },
                            ),
                          approve
                            ? "Verificação aprovada. O usuário receberá a atualização."
                            : "Solicitação devolvida com a justificativa.",
                        );
                      }}
                    >
                      <label>
                        Justificativa
                        <textarea
                          name="reason"
                          required
                          minLength={5}
                          maxLength={1000}
                          rows={3}
                        />
                      </label>
                      <div className="academic-admin-actions">
                        <button
                          className="button"
                          disabled={busy}
                          value="approve"
                        >
                          Aprovar vínculo
                        </button>
                        <button disabled={busy} value="reject">
                          Solicitar correção
                        </button>
                      </div>
                    </form>
                  </article>
                ))}
                {!data.reviews.length && (
                  <p>Nenhum comprovante pendente nesta página.</p>
                )}
              </div>
            </section>
            <section>
              <h2>Ajuda com o cadastro</h2>
              <div className="academic-admin-list">
                {data.support.map((row) => (
                  <article key={row.id}>
                    <h3>{row.name}</h3>
                    <small>
                      {new Date(row.createdAt).toLocaleString("pt-BR")}
                    </small>
                    <p>{row.message}</p>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        void act(
                          () =>
                            post(
                              `/admin/academic-verification/support/${row.id}`,
                              {
                                response: new FormData(e.currentTarget).get(
                                  "response",
                                ),
                              },
                            ),
                          "Resposta enviada à página de acompanhamento do usuário.",
                        );
                      }}
                    >
                      <label>
                        Resposta
                        <textarea
                          name="response"
                          required
                          minLength={5}
                          maxLength={2000}
                          rows={3}
                        />
                      </label>
                      <button className="button" disabled={busy}>
                        Responder
                      </button>
                    </form>
                  </article>
                ))}
                {!data.support.length && (
                  <p>Nenhuma dúvida pendente nesta página.</p>
                )}
              </div>
            </section>
            <section>
              <h2>Auditoria</h2>
              <div className="academic-admin-audit academic-admin-list">
                {data.audit.map((row) => (
                  <article key={row.id}>
                    <strong>{row.action}</strong>
                    <small>
                      {new Date(row.createdAt).toLocaleString("pt-BR")}
                    </small>
                    {row.reason && <p>{row.reason}</p>}
                    <small>
                      Conta: {row.userId ?? "Configuração"} · Responsável:{" "}
                      {row.actorId ?? "Sistema"}
                    </small>
                  </article>
                ))}
              </div>
            </section>
            <nav
              className="academic-pagination"
              aria-label="Paginação da administração"
            >
              <button
                disabled={page === 0 || busy}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </button>
              <span>Página {page + 1}</span>
              <button
                disabled={
                  busy ||
                  [data.domains, data.reviews, data.audit, data.support].every(
                    (rows) => rows.length < 30,
                  )
                }
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima
              </button>
            </nav>
          </>
        )}
      </div>
    </Shell>
  );
}
