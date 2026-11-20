"use client";
import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { FolderGit2, GitFork, Search, Star, X } from "lucide-react";
import {
  githubLogin,
  listRepos,
  projectFromRepo,
  repoLanguages,
  type GithubRepo,
} from "@/lib/github-repos";
import type { Project } from "@/lib/portfolio-projects";
import { playMotion } from "@/lib/motion";
import {
  useOverlayHistory,
  waitForOverlayHistory,
} from "@/lib/use-overlay-history";
import "./portfolio-github.css";

const month = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
  year: "numeric",
});
const worked = (iso: string) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : month.format(date);
};

/**
 * Lists a GitHub user's public repositories so the student can pick which become
 * project drafts. Nothing is ticked for them and nothing is saved here.
 */
export function GithubImportDialog({
  taken,
  room,
  initialLogin = "",
  onImport,
  onClose,
}: {
  /** Repositories already in the portfolio, as "owner/name". */
  taken: string[];
  /** How many more projects the portfolio can hold. */
  room: number;
  initialLogin?: string;
  onImport: (projects: Project[]) => void;
  onClose: () => void;
}) {
  const titleId = useId(),
    loginId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const [login, setLogin] = useState(initialLogin);
  const [repos, setRepos] = useState<GithubRepo[]>();
  const [owner, setOwner] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState<"search" | "import">();
  const [error, setError] = useState("");
  const alive = useRef(true);
  useOverlayHistory(onClose);

  useEffect(() => {
    alive.current = true;
    const element = dialog.current!;
    const previous = document.activeElement as HTMLElement | null;
    element.showModal();
    const viewport = window.visualViewport;
    const fit = () =>
      element.style.setProperty(
        "--invite-viewport",
        `${viewport?.height ?? window.innerHeight}px`,
      );
    fit();
    viewport?.addEventListener("resize", fit);
    const animation = playMotion(
      element,
      [
        { opacity: 0, transform: "translateY(22px) scale(.97)" },
        { opacity: 1, transform: "none" },
      ],
      { duration: 300 },
    );
    return () => {
      alive.current = false;
      animation?.cancel();
      viewport?.removeEventListener("resize", fit);
      element.close();
      void waitForOverlayHistory().then(() =>
        previous?.focus({ preventScroll: true }),
      );
    };
  }, []);

  const have = new Set(taken.map((name) => name.toLowerCase()));
  const full = picked.length >= room;

  async function search(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const name = githubLogin(login);
    setError("");
    if (!name) {
      setError(
        "Escreva só o nome de usuário do GitHub, como ana-dev ou github.com/ana-dev.",
      );
      return;
    }
    setBusy("search");
    setPicked([]);
    try {
      const found = await listRepos(name);
      if (!alive.current) return;
      setRepos(found);
      setOwner(name);
    } catch (cause) {
      if (alive.current) {
        setRepos(undefined);
        setError((cause as Error).message);
      }
    } finally {
      if (alive.current) setBusy(undefined);
    }
  }

  async function add() {
    if (busy || !repos || !picked.length) return;
    setBusy("import");
    const chosen = repos.filter((entry) => picked.includes(entry.fullName));
    const drafts = await Promise.all(
      chosen.map(async (entry) =>
        projectFromRepo(entry, await repoLanguages(entry.fullName)),
      ),
    );
    if (!alive.current) return;
    onImport(drafts);
    onClose();
  }

  return (
    <dialog
      ref={dialog}
      className="room-invite-dialog portfolio-github-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="room-invite-dialog-content">
        <header className="room-invite-dialog-header">
          <div>
            <h2 id={titleId}>Importar do GitHub</h2>
            <p>
              O Enturma lê só os repositórios públicos, direto do GitHub. Não
              pede senha nem permissão na sua conta, e nada entra no portfólio
              sem você escolher e salvar.
            </p>
          </div>
          <button
            type="button"
            className="icon-control"
            aria-label="Fechar importação"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        <form className="portfolio-github-search" onSubmit={search}>
          <label htmlFor={loginId}>Usuário do GitHub</label>
          <div>
            <input
              id={loginId}
              value={login}
              onChange={(event) => setLogin(event.target.value)}
              placeholder="ana-dev ou github.com/ana-dev"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={120}
            />
            <button disabled={!login.trim() || Boolean(busy)}>
              <Search size={16} aria-hidden="true" />
              {busy === "search" ? "Buscando…" : "Buscar repositórios"}
            </button>
          </div>
        </form>
        {error ? (
          <p className="portfolio-github-error" role="alert">
            {error}
          </p>
        ) : null}
        <div
          className="portfolio-github-list"
          aria-busy={busy === "search"}
          aria-live="polite"
        >
          {repos === undefined ? (
            <div className="portfolio-github-empty">
              <FolderGit2 size={28} aria-hidden="true" />
              <p>
                Busque um usuário para ver os repositórios e marcar os que viram
                projeto.
              </p>
            </div>
          ) : repos.length ? (
            <>
              <p className="portfolio-github-count">
                {repos.length === 1
                  ? "1 repositório público"
                  : `${repos.length} repositórios públicos`}{" "}
                de {owner}.{" "}
                {room > 0
                  ? `Cabe mais ${room} ${room === 1 ? "projeto" : "projetos"} no portfólio.`
                  : "O portfólio já está cheio."}
              </p>
              <ul>
                {repos.map((entry, index) => {
                  const mine = have.has(entry.fullName.toLowerCase());
                  const on = picked.includes(entry.fullName);
                  const when = worked(entry.pushedAt);
                  return (
                    <li
                      key={entry.fullName}
                      style={
                        { "--row": Math.min(index, 10) } as React.CSSProperties
                      }
                    >
                      <label data-on={on || undefined}>
                        <input
                          type="checkbox"
                          checked={on}
                          disabled={
                            mine || Boolean(busy) || (!on && (full || room < 1))
                          }
                          onChange={() =>
                            setPicked((list) =>
                              on
                                ? list.filter((name) => name !== entry.fullName)
                                : [...list, entry.fullName],
                            )
                          }
                        />
                        <span className="portfolio-github-repo">
                          <strong>{entry.name}</strong>
                          {entry.description ? (
                            <span>{entry.description}</span>
                          ) : null}
                          <small>
                            {entry.language ? <b>{entry.language}</b> : null}
                            {entry.stars ? (
                              <i>
                                <Star size={12} aria-hidden="true" />
                                {entry.stars}
                              </i>
                            ) : null}
                            {when ? <i>atualizado em {when}</i> : null}
                            {entry.fork ? (
                              <em>
                                <GitFork size={12} aria-hidden="true" />
                                Fork
                              </em>
                            ) : null}
                            {entry.archived ? (
                              <em>Arquivado no GitHub</em>
                            ) : null}
                            {mine ? <em>Já está no portfólio</em> : null}
                          </small>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <div className="portfolio-github-empty">
              <FolderGit2 size={28} aria-hidden="true" />
              <p>{owner} não tem repositórios públicos.</p>
            </div>
          )}
        </div>
        <footer className="portfolio-github-footer">
          <p>
            Os projetos entram como rascunho: revise os textos e salve o
            portfólio para valer.
          </p>
          <button
            type="button"
            disabled={!picked.length || Boolean(busy)}
            onClick={() => void add()}
          >
            {busy === "import"
              ? "Adicionando…"
              : !picked.length
                ? "Escolha os repositórios"
                : picked.length === 1
                  ? "Adicionar 1 projeto"
                  : `Adicionar ${picked.length} projetos`}
          </button>
        </footer>
      </div>
    </dialog>
  );
}
