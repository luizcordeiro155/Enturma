"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  FileCheck2,
  GraduationCap,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { api, post } from "@/lib/api";
import { authDestination } from "@/lib/auth-navigation";
import {
  useAcademicIdentity,
  type AcademicInstitution,
} from "@/lib/academic-identity";
import { AcademicMotion } from "./academic-motion";

type Campus = { id: string; name: string };
export function AcademicVerification() {
  const {
    identity,
    error: connectionError,
    loading,
    refresh,
  } = useAcademicIdentity();
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [institutions, setInstitutions] = useState<AcademicInstitution[]>([]);
  const [more, setMore] = useState(false);
  const [finding, setFinding] = useState(false);
  const [selected, setSelected] = useState<AcademicInstitution | null>(null);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [campus, setCampus] = useState("");
  const [method, setMethod] = useState<"email" | "document">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [institutionError, setInstitutionError] = useState("");
  const [campusError, setCampusError] = useState("");
  const [catalogAttempt, setCatalogAttempt] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const panel = useRef<HTMLDivElement>(null);
  const navigating = useRef(false);
  const choosing = !identity?.institutionId || editing;
  const approved = Boolean(identity?.accessAllowed);
  const stage = approved
    ? "approved"
    : choosing
      ? "select"
      : identity?.status === "PENDING_REVIEW"
        ? "review"
        : "email";
  const advance = useCallback(() => {
    if (navigating.current) return;
    navigating.current = true;
    const requested = authDestination(
      new URLSearchParams(window.location.search).get("next"),
    );
    // The proxy verifies the same database state before delivering student content.
    window.location.replace(
      requested === "/academic-verification" ? "/onboarding" : requested,
    );
  }, []);

  useEffect(() => {
    if (!approved) return;
    const timeout = setTimeout(advance, 1250);
    return () => clearTimeout(timeout);
  }, [approved, advance]);

  const retryConnection = useCallback(() => {
    setCatalogAttempt((attempt) => attempt + 1);
    void refresh();
  }, [refresh]);

  useEffect(() => {
    window.addEventListener("online", retryConnection);
    return () => window.removeEventListener("online", retryConnection);
  }, [retryConnection]);

  useEffect(() => {
    if (!choosing || approved) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setFinding(true);
      api<{ items: AcademicInstitution[]; hasMore: boolean }>(
        `/auth/academic/institutions?search=${encodeURIComponent(search)}&page=${page}`,
        { cache: "no-store", signal: controller.signal },
      )
        .then((data) => {
          if (controller.signal.aborted) return;
          setInstitutions(data.items);
          setMore(data.hasMore);
          setInstitutionError("");
        })
        .catch((e: Error) => {
          if (!controller.signal.aborted) setInstitutionError(e.message);
        })
        .finally(() => {
          if (!controller.signal.aborted) setFinding(false);
        });
    }, 180);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [choosing, approved, search, page, catalogAttempt]);

  useEffect(() => {
    if (!selected || !choosing || approved) return;
    const controller = new AbortController();
    api<{ items: Campus[] }>(`/catalog/campuses?parentId=${selected.id}`, {
      signal: controller.signal,
    })
      .then((data) => {
        if (controller.signal.aborted) return;
        setCampuses(data.items);
        setCampusError("");
      })
      .catch((e: Error) => {
        if (!controller.signal.aborted) setCampusError(e.message);
      });
    return () => controller.abort();
  }, [selected, choosing, approved, catalogAttempt]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden) setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (
      !panel.current?.animate ||
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.dataset.reducedMotion === "true"
    )
      return;
    const animations = [
      ...panel.current.querySelectorAll<HTMLElement>("[data-academic-enter]"),
    ].map((node, i) =>
      node.animate(
        [
          { opacity: 0, transform: "translateY(16px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        {
          duration: 440,
          delay: i * 45,
          easing: "cubic-bezier(.2,.8,.2,1)",
          fill: "both",
        },
      ),
    );
    return () => animations.forEach((a) => a.cancel());
  }, [stage, method]);

  async function perform(operation: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await operation();
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function choose() {
    if (!selected) return;
    await perform(async () => {
      await api("/auth/academic/institution", {
        method: "PUT",
        body: JSON.stringify({
          institutionId: selected.id,
          campusId: campus || null,
        }),
      });
      setEditing(false);
      setMethod(selected.domains.length ? "email" : "document");
    });
  }
  async function upload() {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Escolha um comprovante de até 2 MB.");
      return;
    }
    await perform(async () => {
      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1]);
        reader.onerror = () => reject(Error("Não foi possível ler o arquivo."));
        reader.readAsDataURL(file);
      });
      await post("/auth/academic/document", { mime: file.type, content });
      setFile(null);
    });
  }
  const seconds = identity?.tokenExpiresAt
    ? Math.max(
        0,
        Math.ceil((new Date(identity.tokenExpiresAt).getTime() - now) / 1000),
      )
    : 0;
  const resendWait = Math.max(0, seconds - 29 * 60);
  const visibleError =
    error ||
    (choosing && !approved && (institutionError || (selected && campusError))) ||
    connectionError;
  return (
    <main className="academic-page">
      <header className="academic-header">
        <Link href="/home" className="brand">
          <BookOpen /> enturma.
        </Link>
        <Link href="/download">
          Baixar o app <ArrowRight size={16} />
        </Link>
      </header>
      <div className="academic-layout">
        <aside className="academic-story">
          <span className="academic-eyebrow">
            SUA VIDA UNIVERSITÁRIA, CONECTADA
          </span>
          <h1>
            {approved ? (
              "Agora você faz parte."
            ) : (
              <>
                Gente da sua faculdade.
                <br />
                <em>Uma comunidade de verdade.</em>
              </>
            )}
          </h1>
          <p>
            Um espaço para estudar, compartilhar e se conectar. Confirme seu
            vínculo acadêmico para encontrar sua turma.
          </p>
          <AcademicMotion state={stage} />
          <div className="academic-trust">
            <ShieldCheck size={20} />
            <span>
              Seus comprovantes são privados e apagados após a análise.
            </span>
          </div>
        </aside>
        <section
          ref={panel}
          className="academic-panel"
          aria-busy={busy || loading}
        >
          <ol className="academic-steps" aria-label="Etapas do cadastro">
            {["Conta", "Instituição", "Verificação"].map((label, i) => (
              <li
                key={label}
                className={
                  i === 0 || (i === 1 && !choosing) || approved ? "done" : ""
                }
                aria-current={i === (choosing ? 1 : 2) ? "step" : undefined}
              >
                <span>{i === 0 || approved ? <Check size={15} /> : i + 1}</span>
                {label}
              </li>
            ))}
          </ol>
          {visibleError && (
            <div className="academic-error" role="alert">
              {visibleError}
              <button type="button" onClick={retryConnection}>
                <RefreshCw size={16} /> Verificar conexão
              </button>
            </div>
          )}
          {loading && !identity ? (
            <p role="status">Consultando sua conta…</p>
          ) : approved ? (
            <div className="academic-success" data-academic-enter role="status">
              <div className="academic-success-mark">
                <Check size={36} />
              </div>
              <h2>Acesso liberado!</h2>
              <p>{identity?.institutionName || "Sua conta está aprovada."}</p>
              {identity?.method === "ACADEMIC_EMAIL" && (
                <p className="muted">
                  Endereço acadêmico confirmado. Essa confirmação comprova a
                  posse do e-mail.
                </p>
              )}
              <button className="button" onClick={advance}>
                Continuar para o Enturma <ArrowRight size={18} />
              </button>
            </div>
          ) : choosing ? (
            <>
              <div data-academic-enter>
                <span className="academic-eyebrow">PASSO 2 DE 3</span>
                <h2>Onde você estuda?</h2>
                <p>Encontre sua instituição no catálogo do Enturma.</p>
              </div>
              <label className="academic-search" data-academic-enter>
                <Search size={18} />
                <input
                  aria-label="Buscar instituição"
                  placeholder="Nome da faculdade"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(0);
                  }}
                />
              </label>
              <div
                className="academic-institutions"
                aria-busy={finding}
                data-academic-enter
              >
                {institutions.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    aria-pressed={selected?.id === item.id}
                    onClick={() => {
                      setSelected(item);
                      setCampus("");
                      setCampuses([]);
                      setCampusError("");
                    }}
                  >
                    <GraduationCap size={22} />
                    <span>
                      <strong>{item.name}</strong>
                      <small>
                        {item.domains.length
                          ? "Verificação por e-mail disponível"
                          : "Verificação por comprovante"}
                      </small>
                    </span>
                    {selected?.id === item.id && <Check size={20} />}
                  </button>
                ))}
                {!finding && institutions.length === 0 && (
                  <p>
                    Nenhuma instituição encontrada. Tente o nome completo ou
                    fale com o suporte.
                  </p>
                )}
                {finding && <p role="status">Buscando instituições…</p>}
              </div>
              <div className="academic-pagination">
                <button
                  disabled={page === 0 || finding}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Anterior
                </button>
                <span>Página {page + 1}</span>
                <button
                  disabled={!more || finding}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Próxima
                </button>
              </div>
              {selected && (
                <label data-academic-enter>
                  Campus <span className="muted">(opcional)</span>
                  <select
                    value={campus}
                    onChange={(e) => setCampus(e.target.value)}
                  >
                    <option value="">Selecionar depois</option>
                    {campuses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <button
                className="button academic-primary"
                data-academic-enter
                disabled={!selected || busy}
                onClick={() => void choose()}
              >
                {busy ? "Salvando…" : "Continuar"}
                <ArrowRight size={18} />
              </button>
              {editing && (
                <button
                  className="academic-text-button"
                  onClick={() => setEditing(false)}
                >
                  Cancelar alteração
                </button>
              )}
            </>
          ) : (
            <>
              <div className="academic-selected" data-academic-enter>
                <GraduationCap />
                <span>
                  <strong>{identity?.institutionName}</strong>
                  <small>
                    {identity?.campusName || "Campus a definir no onboarding"}
                  </small>
                </span>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  aria-label="Alterar instituição"
                >
                  <ArrowLeft size={18} />
                </button>
              </div>
              {identity?.status === "PENDING_REVIEW" ? (
                <div data-academic-enter>
                  <FileCheck2 size={30} />
                  <h2>Comprovante em análise.</h2>
                  <p>
                    Você receberá a decisão aqui, sem precisar atualizar a
                    página. Um administrador precisa conferir seu documento
                    antes de liberar o acesso.
                  </p>
                  <p className="academic-note">
                    O arquivo será apagado após a análise ou em até 14 dias.
                    Caso o prazo expire, você poderá enviar novamente.
                  </p>
                  <button
                    className="academic-text-button"
                    onClick={() => void refresh()}
                  >
                    <RefreshCw size={16} /> Consultar andamento
                  </button>
                </div>
              ) : (
                <>
                  {identity?.status === "REJECTED" && (
                    <div className="academic-error" role="status">
                      <strong>Precisamos de uma correção</strong>
                      <p>{identity.reviewReason}</p>
                    </div>
                  )}
                  {identity?.status === "EMAIL_PENDING" && (
                    <div
                      className="academic-waiting"
                      data-academic-enter
                      role="status"
                    >
                      <Mail size={28} />
                      <h2>
                        {identity.delivery === "SENT"
                          ? "Confira seu e-mail."
                          : identity.delivery === "FAILED"
                            ? "O envio não foi concluído."
                            : "Preparando seu e-mail."}
                      </h2>
                      <p>{identity.academicEmail}</p>
                      <p>
                        {identity.delivery === "FAILED"
                          ? "Confira o endereço e solicite um novo envio."
                          : "Abra o link no celular, Desktop ou em outra aba. Esta tela acompanha a confirmação automaticamente."}
                      </p>
                      <small>
                        {seconds
                          ? `Link válido por ${Math.floor(seconds / 60)}min ${String(seconds % 60).padStart(2, "0")}s`
                          : "O link expirou. Solicite um novo envio."}
                      </small>
                    </div>
                  )}
                  {method === "email" ? (
                    <form
                      data-academic-enter
                      onSubmit={(e) => {
                        e.preventDefault();
                        const data = new FormData(e.currentTarget);
                        void perform(() =>
                          post("/auth/academic/email", {
                            email: data.get("email"),
                          }),
                        );
                      }}
                    >
                      <h2>
                        {identity?.status === "EMAIL_PENDING"
                          ? "Reenviar confirmação"
                          : "Confirme seu e-mail acadêmico"}
                      </h2>
                      <p>
                        Seu e-mail pessoal continua sendo usado para entrar e
                        recuperar sua conta.
                      </p>
                      <label>
                        E-mail institucional
                        <input
                          key={identity?.academicEmail ?? "email"}
                          name="email"
                          type="email"
                          autoComplete="email"
                          defaultValue={identity?.academicEmail ?? ""}
                          placeholder="você@instituição.edu.br"
                          required
                          maxLength={254}
                        />
                      </label>
                      <button
                        className="button academic-primary"
                        disabled={busy || resendWait > 0}
                      >
                        {busy
                          ? "Solicitando envio…"
                          : resendWait > 0
                            ? `Reenviar em ${resendWait}s`
                            : "Enviar link de confirmação"}
                        <Mail size={18} />
                      </button>
                      <button
                        type="button"
                        className="academic-text-button"
                        onClick={() => setMethod("document")}
                      >
                        Não possui e-mail acadêmico? Verificar minha matrícula.
                      </button>
                    </form>
                  ) : (
                    <div data-academic-enter>
                      <h2>Verificar minha matrícula</h2>
                      <p>
                        Envie um comprovante que identifique você e sua
                        instituição. O acesso será liberado somente após
                        análise.
                      </p>
                      <label className="academic-upload">
                        <Upload size={25} />
                        <strong>
                          {file?.name || "Selecionar comprovante"}
                        </strong>
                        <small>PDF, PNG ou JPEG · até 2 MB</small>
                        <input
                          type="file"
                          accept="application/pdf,image/png,image/jpeg"
                          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                        />
                      </label>
                      <p className="academic-note">
                        Envie apenas os dados necessários para conferir seu
                        vínculo. O documento não aparece no perfil e fica
                        disponível somente para a equipe responsável pela
                        análise.
                      </p>
                      <button
                        className="button academic-primary"
                        disabled={!file || busy}
                        onClick={() => void upload()}
                      >
                        {busy ? "Enviando…" : "Enviar para análise"}
                        <ShieldCheck size={18} />
                      </button>
                      <button
                        className="academic-text-button"
                        onClick={() => setMethod("email")}
                      >
                        Usar e-mail institucional
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
          <footer className="academic-footer">
            <Link href="/privacidade">Privacidade</Link>
            <Link href="/academic-verification/support">Preciso de ajuda</Link>
            <button
              onClick={() =>
                void perform(async () => {
                  await post("/auth/logout");
                  window.location.replace("/login");
                })
              }
            >
              Sair da conta
            </button>
          </footer>
        </section>
      </div>
    </main>
  );
}
