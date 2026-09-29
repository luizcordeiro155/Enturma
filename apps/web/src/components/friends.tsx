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
    api<PublicProfile>("/users/me")
      .then(async (user) => {
        if (!alive) return;
        setMe(user);
        let local = await readIdentity(user.id);
        const stored =
          await api<{ publicKey: JsonWebKey }[]>("/private-identity");
        if (!local) {
          if (stored.length)
            throw Error(
              "Este navegador não tem sua chave. Restaure o backup ou use o dispositivo original.",
            );
          local = await createIdentity();
          await storeIdentity(user.id, local);
        }
        await api("/private-identity", {
          method: "PUT",
          body: JSON.stringify(publicFields(local.publicKey)),
        });
        if (alive) {
          identity.current = local;
          setReady(true);
        }
      })
      .catch((e) => {
        if (alive) setError(e.message);
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
  }, [refresh]);
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
    let timer: ReturnType<typeof setInterval>;
    async function connect() {
      try {
        const peer = await api<{ publicKey: JsonWebKey }>(
          `/friends/${friend.id}/identity`,
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
        key.current = k;
        setFinger(code);
        await load(friend, k, 0, current);
        const target = location.hash.match(/^#message-([a-f0-9-]+)$/)?.[1];
        if (target) {
          await load(friend, k, 0, current, target);
          focusMessage(`message-${target}`);
        }
        timer = setInterval(() => {
          if (document.visibilityState === "visible")
            void load(friend, k, 0, current).catch((e) => setError(e.message));
        }, 3000);
      } catch (e) {
        if (active)
          setError(
            "A conversa ainda não está pronta. A outra pessoa precisa abrir Amigos para ativar sua chave. " +
              (e as Error).message,
          );
      }
    }
    void connect();
    return () => {
      active = false;
      generation.current = current + 1;
      key.current = null;
      clearInterval(timer);
    };
  }, [selected, ready, load]);
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
  function choose(friend: Friend) {
    setError("");
    setMessages([]);
    setDraft("");
    setPage(0);
    setFinger("");
    key.current = null;
    setSelected(friend);
  }
  useEffect(() => {
    if (!requestedChat || selected?.id === requestedChat) return;
    const target = friends.find(
      (f) => f.id === requestedChat && f.status === "ACCEPTED",
    );
    if (target) {
      const timer = setTimeout(() => choose(target), 0);
      return () => clearTimeout(timer);
    }
  }, [requestedChat, friends, selected?.id]);
  useLiveRefresh("notifications_changed", async () => {
    await refresh();
    if (selected && key.current)
      await load(selected, key.current, 0, generation.current);
  });
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
        mentioned:
          !!friend.username && mentionsUser(draft, friend.username),
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
        <details className="private-backup">
          <summary>Chaves e backup das conversas</summary>
          <p>
            Sua chave privada fica neste navegador. Guarde um backup cifrado
            para abrir o histórico em outro dispositivo. Sem a chave ou o
            backup, não é possível recuperar as mensagens. Compare o código de
            segurança com seu amigo por outro canal.
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
                  <p>Preparando conversa…</p>
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
