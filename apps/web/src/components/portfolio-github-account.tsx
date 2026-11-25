"use client";

import { FolderGit2, ListChecks, Unplug } from "lucide-react";
import { ProviderLink } from "./provider-link";

export type GithubAccount = { login: string; auto: boolean };

/**
 * The GitHub account behind a Tecnologia e Jogos portfolio: connect it, choose repositories by
 * hand, or let new public repositories enter by themselves.
 */
export function PortfolioGithubAccount({
  account,
  available,
  busy,
  full = false,
  onAuto,
  onChoose,
  onDisconnect,
}: {
  account: GithubAccount | null | undefined;
  /** Whether this server can connect GitHub accounts at all. */
  available: boolean;
  busy: boolean;
  /** The portfolio holds no more projects. */
  full?: boolean;
  onAuto: (auto: boolean) => void;
  onChoose: () => void;
  onDisconnect: () => void;
}) {
  if (!account)
    return available ? (
      <aside className="portfolio-github-account" aria-label="Conta do GitHub">
        <FolderGit2 size={22} aria-hidden="true" />
        <div>
          <strong>Conecte sua conta do GitHub</strong>
          <p>
            Seus repositórios públicos viram projetos: escolha um a um ou deixe
            os novos entrarem sozinhos. O Enturma não pede acesso a repositórios
            privados nem permissão para alterar nada.
          </p>
          <small>
            Você sai desta página por um instante: salve o portfólio antes.
          </small>
        </div>
        <ProviderLink
          className="button secondary"
          href="/api/oauth/github/start"
        >
          Conectar GitHub
        </ProviderLink>
      </aside>
    ) : null;
  return (
    <aside
      className="portfolio-github-account"
      data-connected="true"
      aria-label="Conta do GitHub"
    >
      <FolderGit2 size={22} aria-hidden="true" />
      <div>
        <strong>
          GitHub conectado <span>@{account.login}</span>
        </strong>
        <label className="portfolio-github-auto">
          <input
            type="checkbox"
            role="switch"
            checked={account.auto}
            disabled={busy}
            onChange={(event) => onAuto(event.target.checked)}
          />
          <span>
            Trazer repositórios novos sozinho
            <small>
              Ao abrir o portfólio, cada repositório público novo entra uma vez
              como projeto. Forks e arquivados ficam de fora, e o que você
              remover não volta.
            </small>
          </span>
        </label>
      </div>
      <div className="portfolio-github-account-actions">
        <button
          type="button"
          className="secondary"
          disabled={full}
          onClick={onChoose}
        >
          <ListChecks size={16} aria-hidden="true" />
          Escolher repositórios
        </button>
        <button
          type="button"
          className="secondary compact"
          disabled={busy}
          onClick={onDisconnect}
          aria-label="Desconectar GitHub"
        >
          <Unplug size={15} aria-hidden="true" />
          Desconectar
        </button>
      </div>
    </aside>
  );
}
