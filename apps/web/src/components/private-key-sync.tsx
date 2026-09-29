"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  decryptIdentityVault,
  encryptIdentityVault,
  publicFields,
  readIdentity,
  storeIdentity,
  type Identity,
  type IdentityVault,
} from "@/lib/private-chat-crypto";

type VaultRow = { envelope: IdentityVault };
export function PrivateKeySync({
  userId,
  ready,
  onUnlock,
}: {
  userId: string;
  ready: boolean;
  onUnlock: (value: Identity) => void;
}) {
  const [rows, setRows] = useState<VaultRow[] | null>(null);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    try {
      setRows(
        await api<VaultRow[]>("/private-vault", {
          signal: AbortSignal.timeout(12000),
        }),
      );
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    const initial = setTimeout(() => void refresh(), 0);
    const visible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      clearTimeout(initial);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [refresh, userId]);
  const synced = !!rows?.length;
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !rows) return;
    setBusy(true);
    setError("");
    try {
      const registered = await api<{ publicKey: JsonWebKey }[]>(
        "/private-identity",
        { signal: AbortSignal.timeout(12000) },
      );
      if (!registered.length)
        throw Error("Aguarde a ativação da conversa e tente novamente.");
      if (synced) {
        let restored: Identity;
        try {
          restored = await decryptIdentityVault(
            rows[0].envelope,
            password,
            userId,
          );
        } catch {
          throw Error(
            "Não foi possível desbloquear. Confira a senha das conversas; ela é diferente da senha de login.",
          );
        }
        if (
          JSON.stringify(publicFields(restored.publicKey)) !==
          JSON.stringify(publicFields(registered[0].publicKey))
        )
          throw Error("A chave sincronizada não corresponde a esta conta.");
        await storeIdentity(userId, restored);
        onUnlock(restored);
      } else {
        if (password !== confirmation)
          throw Error("As senhas das conversas não coincidem.");
        const local = await readIdentity(userId);
        if (
          !local ||
          JSON.stringify(publicFields(local.publicKey)) !==
            JSON.stringify(publicFields(registered[0].publicKey))
        )
          throw Error(
            "Ative a sincronização pelo dispositivo que já abre suas conversas.",
          );
        const envelope = await encryptIdentityVault(local, password, userId);
        await api("/private-vault", {
          method: "PUT",
          body: JSON.stringify(envelope),
          signal: AbortSignal.timeout(12000),
        });
        setRows([{ envelope }]);
      }
      setPassword("");
      setConfirmation("");
    } catch (e) {
      if ((e as Error & { status?: number }).status === 409) await refresh();
      setError((e as Error).message);
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
      <h2 id="private-sync-title">Conversas em todos os dispositivos</h2>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {!rows ? (
        <p role="status">Carregando sincronização…</p>
      ) : synced && ready ? (
        <p role="status">
          Sincronização ativa neste dispositivo. Em outro navegador ou celular,
          entre na mesma conta e desbloqueie as conversas com sua senha das
          conversas.
        </p>
      ) : (
        <>
          <p>
            {synced
              ? "Desbloqueie seu histórico neste navegador. A senha das conversas é usada apenas aqui para abrir sua chave cifrada."
              : "Ative uma vez para abrir suas conversas em outros navegadores e celulares, sem transferir arquivos. Sua chave é sincronizada cifrada; a senha das conversas nunca é enviada ao servidor."}
          </p>
          {synced || ready ? (
            <form onSubmit={submit} className="private-sync-form">
              <label>
                Senha das conversas
                <input
                  type="password"
                  autoComplete={synced ? "current-password" : "new-password"}
                  minLength={12}
                  maxLength={256}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={busy}
                />
              </label>
              {!synced && (
                <>
                  <label>
                    Confirmar senha das conversas
                    <input
                      type="password"
                      autoComplete="new-password"
                      minLength={12}
                      maxLength={256}
                      required
                      value={confirmation}
                      onChange={(e) => setConfirmation(e.target.value)}
                      disabled={busy}
                    />
                  </label>
                  <small>
                    Crie uma senha exclusiva com pelo menos 12 caracteres e
                    guarde-a. Sem ela, um dispositivo com a chave ou um backup,
                    não há como recuperar o histórico.
                  </small>
                </>
              )}
              <button disabled={busy}>
                {busy
                  ? "Protegendo suas conversas…"
                  : synced
                    ? "Desbloquear conversas"
                    : "Ativar sincronização"}
              </button>
            </form>
          ) : (
            <p>
              Abra Amigos no dispositivo que já acessa o histórico e ative a
              sincronização. Depois volte aqui e toque em “Atualizar
              sincronização”. Você também pode restaurar um backup abaixo.
            </p>
          )}
        </>
      )}
      <button
        className="text-button"
        disabled={busy}
        onClick={() => void refresh()}
      >
        Atualizar sincronização
      </button>
    </section>
  );
}
