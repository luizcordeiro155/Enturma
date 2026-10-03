"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ConversationNotice,
  useNotificationTarget,
  focusMessage,
} from "./notifications";
import { useLiveRefresh } from "@/lib/live-updates";
import { mentionsUser } from "@/lib/mentions";
import { api, post } from "@/lib/api";
import {
  conversationKey,
  createIdentity,
  decryptMessage,
  encryptMessage,
  exportBackup,
  fingerprint,
  importBackup,
  publicFields,
  readIdentity,
  storeIdentity,
} from "@/lib/private-chat-crypto";
import { PrivateKeySync } from "./private-key-sync";
import { Shell } from "./shell";
import { UserIdentity, type PublicProfile } from "./user-identity";
type Friend = Omit<PublicProfile, "id"> & {
  id: string;
  userId: string;
  requester: string;
  recipient: string;
  status: string;
};
type Envelope = {
  id: string;
  senderId: string;
  clientId: string;
  ciphertext: string;
  iv: string;
  createdAt: string;
};
export function Friends() {
  const params = useSearchParams();
  const requestedChat = params.get("chat");
  useNotificationTarget();
  const [me, setMe] = useState<PublicProfile>();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selected, setSelected] = useState<Friend>();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [username, setUsername] = useState("");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [identityError, setIdentityError] = useState("");
  const [identityAttempt, setIdentityAttempt] = useState(0);
  const [connectionAttempt, setConnectionAttempt] = useState(0);
  const [connectionState, setConnectionState] = useState<
    "preparing" | "waiting" | "error" | "ready"
  >("preparing");
  const [connectionError, setConnectionError] = useState("");
  const [finger, setFinger] = useState("");
  const [password, setPassword] = useState("");
  const [messages, setMessages] = useState<(Envelope & { text: string })[]>([]);
  const [page, setPage] = useState(0);
  const [older, setOlder] = useState(false);
  const key = useRef<CryptoKey | null>(null);
  const generation = useRef(0);
  const identity = useRef<Awaited<ReturnType<typeof createIdentity>> | null>(
    null,
  );
  const refresh = useCallback(
    () => api<Friend[]>("/friends").then(setFriends),
    [],
  );
  useEffect(() => {
    let alive = true;
    api<PublicProfile>("/users/me", { signal: AbortSignal.timeout(12000) })
      .then(async (user) => {
        if (!alive) return;
        setMe(user);
        const prepare = async () => {
          let local = await readIdentity(user.id);
          const stored = await api<{ publicKey: JsonWebKey }[]>(
            "/private-identity",
            { signal: AbortSignal.timeout(12000) },
          );
          if (!local) {
            if (stored.length)
              throw Error(
                "Desbloqueie as conversas na seção Conversas em todos os dispositivos. Se ainda não ativou a sincronização, ative pelo dispositivo original ou restaure seu backup cifrado.",
              );
            local = await createIdentity();
            await storeIdentity(user.id, local);
          }
          await api("/private-identity", {
            method: "PUT",
            body: JSON.stringify(publicFields(local.publicKey)),
            signal: AbortSignal.timeout(12000),
          });
          if (alive) {
            identity.current = local;
            setReady(true);
            setIdentityError("");
          }
        };
        if (navigator.locks)
          await navigator.locks.request(
            `enturma-private-identity:${user.id}`,
            prepare,
          );
        else await prepare();
      })
      .catch((e) => {
        if (alive)
          setIdentityError(
            e.name === "TimeoutError"
              ? "A ativação da conversa demorou demais. Confira sua conexão e tente novamente."
              : e.message,
          );
      });
    void refresh().catch((e) => setError(e.message));
    const timer = setInterval(() => {
      if (document.visibilityState === "visible")
        void refresh().catch(() => {});
    }, 5000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [refresh, identityAttempt]);
  const unlock = useCallback(
    (restored: Awaited<ReturnType<typeof createIdentity>>) => {
      identity.current = restored;
      setReady(true);
      setIdentityError("");
      setConnectionAttempt((n) => n + 1);
      setError("");
      setNotice("Conversas desbloqueadas neste dispositivo.");
    },
    [],
  );
  const load = useCallback(
    async (
      friend: Friend,
      cryptoKey: CryptoKey,
      index: number,
      version: number,
      target?: string,
    ) => {
      const rows = await api<Envelope[]>(
        target
          ? `/friends/${friend.id}/messages/target/${target}`
          : `/friends/${friend.id}/messages?page=${index}`,
        { signal: AbortSignal.timeout(12000) },
      );
      const decoded = await Promise.all(
        rows.map(async (m) => ({
          ...m,
          text: await decryptMessage(cryptoKey, m, friend.id).catch(
            () => "Não foi possível autenticar esta mensagem.",
          ),
        })),
      );
      if (version !== generation.current) return;
      setMessages((old) =>
        [...new Map([...old, ...decoded].map((m) => [m.id, m])).values()].sort(
          (a, b) =>
            a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
        ),
      );
      if (!target) setOlder(rows.length === 50);
    },
    [],
  );
  useEffect(() => {
    if (!selected || !ready || !identity.current) return;
    const friend = selected;
    const current = ++generation.current;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    async function poll(k: CryptoKey) {
      if (!active) return;
      try {
        if (document.visibilityState === "visible")
          await load(friend, k, 0, current);
      } catch (e) {
        if (active) setError((e as Error).message);
      }
      if (active) timer = setTimeout(() => void poll(k), 3000);
    }
    async function connect() {
      try {
        const peer = await api<{ publicKey: JsonWebKey }>(
          `/friends/${friend.id}/identity`,
          { signal: AbortSignal.timeout(12000) },
        );
        if (!active) return;
        const k = await conversationKey(
          identity.current!,
          peer.publicKey,
          friend.id,
        );
        const code = await fingerprint(
          identity.current!.publicKey,
          peer.publicKey,
        );
        if (!active) return;
        await load(friend, k, 0, current);
        if (!active) return;
        key.current = k;
        setFinger(code);
        setConnectionState("ready");
        setConnectionError("");
        const target = location.hash.match(/^#message-([a-f0-9-]+)$/)?.[1];
        if (target) {
          await load(friend, k, 0, current, target);
          if (active) focusMessage(`message-${target}`);
        }
        if (active) timer = setTimeout(() => void poll(k), 3000);
      } catch (e) {
        if (!active) return;
        const failure = e as Error & { status?: number };
        key.current = null;
        setFinger("");
        const waiting = failure.status === 404;
        setConnectionState(waiting ? "waiting" : "error");
        setConnectionError(
          waiting
            ? "Aguardando a outra pessoa ativar a conversa. Assim que ela abrir Amigos no dispositivo dela, conectaremos automaticamente."
            : "Não foi possível preparar a conversa. Verifique a conexão e tente novamente.",
        );
        if (waiting || !failure.status || failure.status >= 500)
          timer = setTimeout(() => void connect(), 4000);
      }
    }
    const start = setTimeout(() => {
      setConnectionState("preparing");
      setConnectionError("");
      void connect();
    }, 0);
    return () => {
      active = false;
      generation.current = current + 1;
      key.current = null;
      clearTimeout(timer);
      clearTimeout(start);
    };
  }, [selected, ready, load, connectionAttempt]);
  useEffect(() => {
    const jump = () => {
      const target = location.hash.match(/^#message-([a-f0-9-]+)$/)?.[1];
      if (target && selected && key.current)
        void load(selected, key.current, 0, generation.current, target).then(
          () => focusMessage(`message-${target}`),
        );
    };
    window.addEventListener("hashchange", jump);
    window.addEventListener("enturma-notification-open", jump);
    return () => {
      window.removeEventListener("hashchange", jump);
      window.removeEventListener("enturma-notification-open", jump);
    };
  }, [selected, load]);
  const choose = useCallback(
    (friend: Friend) => {
      if (selected?.id === friend.id) {
        if (!key.current) setConnectionAttempt((n) => n + 1);
        return;
      }
      setConnectionState("preparing");
      setConnectionError("");
      setError("");
      setMessages([]);
      setDraft("");
      setPage(0);
      setFinger("");
      key.current = null;
      setSelected(friend);
    },
    [selected?.id],
  );
  useEffect(() => {
    if (!requestedChat || selected?.id === requestedChat) return;
    const target = friends.find(
      (f) => f.id === requestedChat && f.status === "ACCEPTED",
    );
    if (target) {
      const timer = setTimeout(() => choose(target), 0);
      return () => clearTimeout(timer);
    }
  }, [requestedChat, friends, selected?.id, choose]);
  const refreshFriendData = async () => {
    await refresh();
    if (selected && key.current)
      await load(selected, key.current, 0, generation.current);
  };
  useLiveRefresh("notifications_changed", refreshFriendData);
  useLiveRefresh("friends_changed", refreshFriendData, 8000);
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !me || !key.current || busy || !draft.trim()) return;
    setBusy(true);
    setError("");
    const friend = selected;
    try {
      const payload = await encryptMessage(
        key.current,
        draft.trim(),
        friend.id,
        me.id,
        crypto.randomUUID(),
      );
      await post(`/friends/${friend.id}/messages`, {
        ...payload,
        mentioned: !!friend.username && mentionsUser(draft, friend.username),
      });
      setDraft("");
      await load(friend, key.current, 0, generation.current);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell>
      <div className="friends-page">
        <h1>Amigos e conversas</h1>
        <p>
          Conecte-se com sua turma. Mensagens privadas são cifradas no seu
          dispositivo.
        </p>
        {error ? (
          <p role="alert" className="error">
            {error}
          </p>
        ) : null}
        {!selected && identityError ? (
          <p className="error" role="alert">
            {identityError}
          </p>
        ) : null}
        <p role="status">{notice}</p>
        <form
          className="friend-invite"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await post("/friends", { username });
              setUsername("");
              setNotice("Convite enviado.");
              await refresh();
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          <label>
            Adicionar pelo nome de usuário
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={40}
              placeholder="@colega"
              required
            />
          </label>
          <button>Enviar convite</button>
        </form>
        {me && (
          <PrivateKeySync userId={me.id} ready={ready} onUnlock={unlock} />
        )}
        <details className="private-backup" id="private-backup">
          <summary>Chaves e backup das conversas</summary>
          <p>
            Além da sincronização, você pode guardar um backup cifrado para
            recuperar sua chave em outro dispositivo. Sem a chave ou o backup,
            não é possível recuperar as mensagens. Compare o código de segurança
            com seu amigo por outro canal.
          </p>
          <label>
            Senha do backup
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={12}
            />
          </label>
          <div className="actions">
            <button
              disabled={!ready}
              onClick={async () => {
                try {
                  const raw = await exportBackup(identity.current!, password);
                  const url = URL.createObjectURL(
                    new Blob([raw], { type: "application/json" }),
                  );
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "enturma-chave-cifrada.json";
                  a.click();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                  setNotice("Backup baixado. Guarde a senha separadamente.");
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              Baixar backup cifrado
            </button>
            <label>
              Restaurar backup
              <input
                type="file"
                accept="application/json,.json"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !me) return;
                  try {
                    if (file.size > 20000)
                      throw Error("Arquivo de backup inválido.");
                    const restored = await importBackup(
                      await file.text(),
                      password,
                    );
                    await api("/private-identity", {
                      method: "PUT",
                      body: JSON.stringify(publicFields(restored.publicKey)),
                    });
                    await storeIdentity(me.id, restored);
                    identity.current = restored;
                    setReady(true);
                    setIdentityError("");
                    setConnectionAttempt((n) => n + 1);
                    setError("");
                    setNotice("Chave restaurada.");
                  } catch {
                    setError(
                      "Não foi possível restaurar: confira senha, arquivo e conta.",
                    );
                  }
                }}
              />
            </label>
          </div>
        </details>
        <div className="friends-workspace">
          <aside aria-label="Lista de amigos">
            {friends.length === 0 ? (
              <p>Nenhuma amizade ainda. Convide alguém pelo nome de usuário.</p>
            ) : (
              friends.map((f) => (
                <article key={f.id}>
                  <UserIdentity user={{ ...f, id: f.userId }} />
                  {f.status === "ACCEPTED" ? (
                    <button
                      className="secondary"
                      aria-pressed={selected?.id === f.id}
                      onClick={() => choose(f)}
                    >
                      Conversar
                    </button>
                  ) : f.recipient === me?.id ? (
                    <button
                      onClick={async () => {
                        try {
                          await post(`/friends/${f.id}/accept`);
                          await refresh();
                        } catch (e) {
                          setError((e as Error).message);
                        }
                      }}
                    >
                      Aceitar convite
                    </button>
                  ) : (
                    <small>Convite enviado</small>
                  )}
                  <button
                    className="text-button"
                    onClick={async () => {
                      if (
                        !confirm(
                          "Remover amizade/convite e o histórico privado desta conversa?",
                        )
                      )
                        return;
                      try {
                        await api(`/friends/${f.id}`, { method: "DELETE" });
                        if (selected?.id === f.id) setSelected(undefined);
                        await refresh();
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                  >
                    {f.status === "ACCEPTED"
                      ? "Remover amizade"
                      : "Cancelar / recusar"}
                  </button>
                </article>
              ))
            )}
          </aside>
          <section
            className="private-chat"
            aria-label="Conversa privada"
            data-notification-context={
              selected ? `friend:${selected.id}` : undefined
            }
          >
            {selected ? (
              <>
                <header>
                  <UserIdentity user={{ ...selected, id: selected.userId }} />
                  <span className="privacy-pill">
                    Ponta a ponta · ECDH + AES-GCM
                  </span>
                </header>
                {finger ? (
                  <details>
                    <summary>Código de segurança</summary>
                    <code className="safety-code">{finger}</code>
                    <p>Os dois dispositivos devem mostrar o mesmo código.</p>
                  </details>
                ) : (
                  <div className="private-connection-status" role="status">
                    <strong>
                      {identityError
                        ? "Sua chave precisa de atenção"
                        : connectionState === "waiting"
                          ? "Aguardando seu amigo"
                          : connectionState === "error"
                            ? "Conversa indisponível no momento"
                            : "Preparando conversa segura…"}
                    </strong>
                    <p>
                      {identityError ||
                        connectionError ||
                        "Ativando a criptografia neste dispositivo. Isso deve levar poucos segundos."}
                    </p>
                    {identityError ||
                    connectionState === "error" ||
                    connectionState === "waiting" ? (
                      <div className="actions">
                        <button
                          className="secondary"
                          onClick={() => {
                            if (!ready) {
                              setIdentityError("");
                              setIdentityAttempt((n) => n + 1);
                            } else {
                              setConnectionState("preparing");
                              setConnectionError("");
                              setConnectionAttempt((n) => n + 1);
                            }
                          }}
                        >
                          Tentar conectar novamente
                        </button>
                        {identityError ? (
                          <button
                            className="text-button"
                            onClick={() => {
                              const backup =
                                document.getElementById("private-sync");
                              if (backup) {
                                backup.scrollIntoView({ block: "center" });
                                backup.querySelector("input")?.focus();
                              }
                            }}
                          >
                            Desbloquear neste dispositivo
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                )}
                <ConversationNotice context={`friend:${selected.id}`} />
                <div className="private-messages" role="log">
                  {older ? (
                    <button
                      onClick={async () => {
                        if (!key.current) return;
                        try {
                          await load(
                            selected,
                            key.current,
                            page + 1,
                            generation.current,
                          );
                          setPage(page + 1);
                        } catch (e) {
                          setError((e as Error).message);
                        }
                      }}
                    >
                      Mensagens anteriores
                    </button>
                  ) : null}
                  {messages.map((m) => (
                    <article
                      key={m.id}
                      id={`message-${m.id}`}
                      className={m.senderId === me?.id ? "mine" : ""}
                    >
                      <UserIdentity
                        compact
                        user={
                          m.senderId === me?.id
                            ? me!
                            : { ...selected, id: selected.userId }
                        }
                      />
                      <div>
                        <p>{m.text}</p>
                        <small>
                          {new Date(m.createdAt).toLocaleString("pt-BR")}
                        </small>
                      </div>
                    </article>
                  ))}
                </div>
                <form onSubmit={send}>
                  <label>
                    Mensagem privada
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      maxLength={4000}
                      disabled={!finger}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          !e.shiftKey &&
                          !e.nativeEvent.isComposing
                        ) {
                          e.preventDefault();
                          e.currentTarget.form?.requestSubmit();
                        }
                      }}
                    />
                  </label>
                  <button disabled={!finger || busy || !draft.trim()}>
                    {busy ? "Enviando…" : "Enviar mensagem"}
                  </button>
                  <small>Enter envia · Shift+Enter quebra a linha</small>
                </form>
              </>
            ) : (
              <p>Escolha um amigo para conversar.</p>
            )}
          </section>
        </div>
      </div>
    </Shell>
  );
}
