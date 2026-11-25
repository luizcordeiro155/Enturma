"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FolderGit2, KeyRound } from "lucide-react";
import { api } from "@/lib/api";
import { useProviders } from "@/lib/external-access";
import { oauthMessage } from "@/lib/oauth-messages";
import { Feedback } from "./feedback";
import { ProviderLink } from "./provider-link";

type Identity = {
  provider: "GOOGLE" | "GITHUB";
  login: string;
  createdAt: string;
};
type Accounts = {
  passwordSet: boolean;
  emailVerified: boolean;
  identities: Identity[];
};

/** Google as a way into the account, and the GitHub account behind the portfolio. */
export function ConnectedAccounts() {
  const providers = useProviders();
  const [accounts, setAccounts] = useState<Accounts>();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    let active = true;
    api<Accounts>("/auth/identities")
      .then((value) => {
        if (active) setAccounts(value);
      })
      .catch(() => {});
    // Back from Google: say what happened, then leave a clean address behind.
    const url = new URL(window.location.href);
    const result = url.searchParams.get("conta");
    if (result) {
      queueMicrotask(() => {
        if (result === "google") setNotice("Conta Google conectada.");
        else setError(oauthMessage(result));
      });
      url.searchParams.delete("conta");
      window.history.replaceState(
        null,
        "",
        url.pathname + url.search + url.hash,
      );
    }
    return () => {
      active = false;
    };
  }, []);

  if (!accounts) return null;
  const google = accounts.identities.find((i) => i.provider === "GOOGLE");
  const github = accounts.identities.find((i) => i.provider === "GITHUB");

  async function disconnect(provider: "google" | "github") {
    setBusy(provider);
    setError("");
    setNotice("");
    try {
      setAccounts(
        await api<Accounts>(`/auth/identities/${provider}`, {
          method: "DELETE",
        }),
      );
      setNotice(
        provider === "google"
          ? "Conta Google desconectada."
          : "GitHub desconectado.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="settings-connected">
      <Feedback error={error} success={notice} />
      <ul className="settings-sessions">
        <li aria-label="Google">
          <span className="settings-session-icon" aria-hidden="true">
            <KeyRound size={18} />
          </span>
          <div>
            <span className="settings-session-title">
              <strong>Google</strong>
            </span>
            <small className="settings-session-meta">
              {google ? google.login : "Não conectada"}
              {google ? null : (
                <span> · entre no Enturma sem digitar a senha</span>
              )}
            </small>
          </div>
          {google ? (
            <button
              type="button"
              className="secondary compact"
              disabled={!accounts.passwordSet || busy === "google"}
              onClick={() => disconnect("google")}
              aria-label="Desconectar Google"
            >
              Desconectar
            </button>
          ) : providers.google ? (
            <ProviderLink
              className="button secondary compact"
              href="/api/oauth/google/start?intent=link"
            >
              Conectar
            </ProviderLink>
          ) : null}
        </li>
        <li aria-label="GitHub">
          <span className="settings-session-icon" aria-hidden="true">
            <FolderGit2 size={18} />
          </span>
          <div>
            <span className="settings-session-title">
              <strong>GitHub</strong>
            </span>
            <small className="settings-session-meta">
              {github ? `@${github.login}` : "Não conectado"}
              <span> · projetos do portfólio de Tecnologia e Jogos</span>
            </small>
          </div>
          {github ? (
            <button
              type="button"
              className="secondary compact"
              disabled={busy === "github"}
              onClick={() => disconnect("github")}
              aria-label="Desconectar GitHub"
            >
              Desconectar
            </button>
          ) : (
            <Link className="button secondary compact" href="/portfolio">
              Conectar no portfólio
            </Link>
          )}
        </li>
      </ul>
      {accounts.passwordSet ? null : (
        <p className="settings-connected-note">
          Sua conta entra só com o Google e ainda não tem senha.{" "}
          <Link href="/forgot-password">Criar uma senha</Link>
        </p>
      )}
    </div>
  );
}
