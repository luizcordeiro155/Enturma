"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ShieldCheck, KeyRound } from "lucide-react";
import { api } from "@/lib/api";
import {
  synchronizeAccountIdentity,
  type AccountVaultState,
} from "@/lib/account-chat-sync";
import {
  decryptIdentityVault,
  decryptAccountIdentity,
  deriveAccountWrappingKey,
  prepareAccountWrappingKey,
  readAccountWrappingKey,
  readIdentity,
  publicFields,
  storeIdentity,
  type Identity,
  type IdentityVault,
} from "@/lib/private-chat-crypto";

export function PrivateKeySync({
  userId,
  ready,
  onUnlock,
}: {
  userId: string;
  ready: boolean;
  onUnlock: (identity: Identity) => void;
}) {
  const announced = useRef("");
  const [account, setAccount] = useState<AccountVaultState>();
  const [legacy, setLegacy] = useState<IdentityVault>();
  const [hasWrappingKey, setHasWrappingKey] = useState(false);
  const [synced, setSynced] = useState(false);
  const [password, setPassword] = useState("");
  const [recovery, setRecovery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    const [state, old, wrapping] = await Promise.all([
      api<AccountVaultState>("/private-account-vault", { cache: "no-store" }),
      api<{ envelope: IdentityVault }[]>("/private-vault", {
        cache: "no-store",
      }),
      readAccountWrappingKey(userId),
    ]);
    setAccount(state);
    setLegacy(old[0]?.envelope);
    setHasWrappingKey(wrapping?.epoch === state.epoch);
    const result = await synchronizeAccountIdentity(userId);
    const identityKey = result.identity.publicKey.x ?? "";
    if (announced.current !== identityKey) {
      announced.current = identityKey;
      onUnlock(result.identity);
    }
    setSynced(result.synced);
  }, [userId, onUnlock]);
  useEffect(() => {
    let active = true;
    const update = () => {
      if (document.visibilityState === "visible")
        void refresh().catch((error) => {
          if (active) setError(error.message);
        });
    };
    update();
    document.addEventListener("visibilitychange", update);
    return () => {
      active = false;
      document.removeEventListener("visibilitychange", update);
    };
  }, [refresh]);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !account) return;
    setBusy(true);
    setError("");
    try {
      if (password) {
        const verified = await api<{ epoch: number }>(
          "/private-account-vault/verify",
          { method: "POST", body: JSON.stringify({ password }) },
        );
        await prepareAccountWrappingKey(password, userId, verified.epoch);
      }
      if (!(await readIdentity(userId)) && recovery) {
        const identity = legacy
          ? await decryptIdentityVault(legacy, recovery, userId)
          : account.envelope
            ? await decryptAccountIdentity(
                account.envelope,
                await deriveAccountWrappingKey(
                  recovery,
                  userId,
                  account.envelope.epoch,
                ),
                userId,
              )
            : undefined;
        if (identity) {
          const registered = await api<{ publicKey: JsonWebKey }[]>(
            "/private-identity",
            { cache: "no-store" },
          );
          if (
            registered.length &&
            JSON.stringify(publicFields(identity.publicKey)) !==
              JSON.stringify(publicFields(registered[0].publicKey))
          )
            throw Error(
              "Essa identidade não corresponde à conta. A chave original continua preservada.",
            );
          await storeIdentity(userId, identity);
        }
      }
      const result = await synchronizeAccountIdentity(userId);
      if (!result.synced)
        throw Error("Confirme a senha da conta para concluir a sincronização.");
      onUnlock(result.identity);
      setSynced(true);
      setPassword("");
      setRecovery("");
      await refresh();
    } catch (error) {
      setError(
        (error as Error).name === "OperationError"
          ? "Não foi possível abrir o histórico com essa senha. A chave original continua preservada."
          : (error as Error).message,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="private-backup private-key-sync"
      id="private-sync"
      aria-labelledby="private-sync-title"
    >
      <h2 id="private-sync-title">
        <ShieldCheck size={20} /> Conversas vinculadas à sua conta
      </h2>
      {synced ? (
        <p role="status">
          Seu login abre as conversas nos seus dispositivos. As mensagens e a
          chave sincronizada continuam cifradas.
        </p>
      ) : (
        <>
          <p>
            {ready
              ? "Conecte uma vez a proteção das conversas ao login. Os próximos dispositivos abrirão seu histórico ao entrar na conta."
              : "Vamos recuperar sua identidade original e conectar as conversas ao login, preservando as mensagens."}
          </p>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          {account ? (
            <form onSubmit={submit} className="private-sync-form">
              {!hasWrappingKey && (
                <label>
                  Senha da sua conta
                  <input
                    type="password"
                    autoComplete="current-password"
                    required
                    maxLength={256}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={busy}
                  />
                </label>
              )}
              {!ready && (legacy || account.envelope) && (
                <label>
                  {legacy
                    ? "Senha antiga das conversas (migração única)"
                    : "Senha anterior da conta (recuperar histórico)"}
                  <input
                    type="password"
                    autoComplete="off"
                    maxLength={256}
                    value={recovery}
                    onChange={(event) => setRecovery(event.target.value)}
                    disabled={busy}
                  />
                  <small>
                    Você também pode usar o dispositivo que já abre as mensagens
                    ou restaurar seu backup cifrado abaixo.
                  </small>
                </label>
              )}
              <button disabled={busy}>
                <KeyRound size={16} />
                {busy
                  ? "Protegendo histórico…"
                  : ready
                    ? "Vincular conversas à conta"
                    : "Recuperar e vincular conversas"}
              </button>
            </form>
          ) : (
            <p role="status">Conferindo proteção da conta…</p>
          )}
        </>
      )}
      <button
        className="text-button"
        disabled={busy}
        onClick={() =>
          void refresh()
            .then(() => setError(""))
            .catch((error) => setError(error.message))
        }
      >
        Atualizar sincronização
      </button>
    </section>
  );
}
