"use client";
import { ChatImage } from "./chat-image-viewer";
import { isChatAtLatest } from "@/lib/chat-scroll";
import { PrivateCallButtons } from "./private-calls";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ImagePlus,
  MoreHorizontal,
  Send,
  Smile,
  X,
} from "lucide-react";
import { preparePrivateChatImage } from "@/lib/chat-image";
import {
  isMobileTextEntryContext,
  resizeMessageComposerTextarea,
  setNativeChatComposerFocused,
} from "@/lib/native-chat-ime";
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
  decryptAttachment,
  decryptMessage,
  encryptAttachment,
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
import {
  MessageActionPopover,
  messageActionAnchor,
  type MessageActionAnchor,
} from "./message-action-popover";
import { MessageMenu } from "./message-menu";
import { EmojiPicker, EmojiText, AnimatedEmoji } from "./emoji-picker";
type Friend = Omit<PublicProfile, "id"> & {
  id: string;
  userId: string;
  requester: string;
  recipient: string;
  status: string;
  online?: boolean;
  lastMessageId?: string;
  lastMessageAt?: string;
  unreadCount?: number;
};
type Envelope = {
  deletedAt?: string | null;
  hiddenAt?: string | null;
  editedAt?: string | null;
  reactions?: { emoji: string; count: number; mine: boolean }[];
  id: string;
  senderId: string;
  clientId: string;
  ciphertext: string;
  iv: string;
  createdAt: string;
  attachmentCiphertext?: string | null;
  attachmentIv?: string | null;
  attachmentMime?: string | null;
  attachmentName?: string | null;
  attachmentSize?: number | null;
};
type PrivateMessage = Envelope & {
  text: string;
  attachmentUrl?: string;
};
export function Friends() {
  const params = useSearchParams();
  const router = useRouter();
  const requestedChat = params.get("chat");
  useNotificationTarget();
  const [me, setMe] = useState<PublicProfile>();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selected, setSelected] = useState<Friend>();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [username, setUsername] = useState("");
  const [draft, setDraft] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [privateImagesEnabled, setPrivateImagesEnabled] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [emojiAnchor, setEmojiAnchor] = useState<MessageActionAnchor | null>(
    null,
  );
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
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [previews, setPreviews] = useState<
    Record<string, { id: string; text: string }>
  >({});
  const [page, setPage] = useState(0);
  const [older, setOlder] = useState(false);
  const [atLatest, setAtLatest] = useState(true);
  const [privateActionMessage, setPrivateActionMessage] =
    useState<PrivateMessage | null>(null);
  const [privateActionAnchor, setPrivateActionAnchor] =
    useState<MessageActionAnchor | null>(null);
  const [editingPrivate, setEditingPrivate] = useState<PrivateMessage | null>(
    null,
  );
  const [editPrivateText, setEditPrivateText] = useState("");
  const key = useRef<CryptoKey | null>(null);
  const generation = useRef(0);
  const messagesViewport = useRef<HTMLDivElement>(null);
  const composer = useRef<HTMLTextAreaElement>(null);
  const privateChat = useRef<HTMLElement>(null);
  const forceFollowLatest = useRef(false);
  const nearLatest = useRef(true);
  const previousMessageCount = useRef(0);
  const attachmentUrls = useRef(new Set<string>());
  const loadedPages = useRef(0);

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressOrigin = useRef<{ x: number; y: number } | null>(null);
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
    void api<{ privateImageAttachments?: boolean }>("/capabilities", {
      cache: "no-store",
    })
      .then((cap) =>
        setPrivateImagesEnabled(cap.privateImageAttachments === true),
      )
      .catch(() => setPrivateImagesEnabled(false));
    return () => {
      alive = false;
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
      if (!target && index === 0 && loadedPages.current > 0) {
        const olderRows = await Promise.all(
          Array.from({ length: loadedPages.current }, (_, i) =>
            api<Envelope[]>(`/friends/${friend.id}/messages?page=${i + 1}`, {
              signal: AbortSignal.timeout(12000),
            }),
          ),
        );
        rows.push(...olderRows.flat());
      }
      if (!target) loadedPages.current = Math.max(loadedPages.current, index);
      const decoded = await Promise.all(
        rows.map(async (m) => {
          const text =
            m.deletedAt || m.hiddenAt
              ? ""
              : await decryptMessage(cryptoKey, m, friend.id).catch(
                  () => "Não foi possível autenticar esta mensagem.",
                );
          let attachmentUrl: string | undefined;
          if (m.attachmentCiphertext && !m.hiddenAt && !m.deletedAt) {
            const blob = await decryptAttachment(cryptoKey, m, friend.id).catch(
              () => null,
            );
            if (blob) {
              attachmentUrl = URL.createObjectURL(blob);
              attachmentUrls.current.add(attachmentUrl);
            }
          }
          return { ...m, text, attachmentUrl };
        }),
      );
      if (version !== generation.current) return;
      const newest = decoded
        .filter((m) => !m.deletedAt && !m.hiddenAt)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
      if (newest)
        setPreviews((old) => ({
          ...old,
          [friend.id]: {
            id: newest.id,
            text:
              newest.text ||
              (newest.attachmentUrl ? "Imagem" : "Mensagem privada"),
          },
        }));
      setMessages((old) =>
        [...new Map([...old, ...decoded].map((m) => [m.id, m])).values()]
          .filter((m) => !m.hiddenAt)
          .sort(
            (a, b) =>
              a.createdAt.localeCompare(b.createdAt) ||
              a.id.localeCompare(b.id),
          ),
      );
      if (!target)
        setOlder(
          rows.length === (index === 0 ? (loadedPages.current + 1) * 50 : 50),
        );
    },
    [],
  );
  const scrollToLatest = useCallback((behavior: ScrollBehavior = "auto") => {
    const viewport = messagesViewport.current;
    if (!viewport) return;
    viewport.scrollTo({ top: viewport.scrollHeight, behavior });
    nearLatest.current = isChatAtLatest(viewport);
    setAtLatest(nearLatest.current);
  }, []);

  useEffect(() => {
    const count = messages.length;
    if (!count) {
      previousMessageCount.current = 0;
      return;
    }
    const hasNewMessage = count > previousMessageCount.current;
    previousMessageCount.current = count;
    if (!hasNewMessage) return;
    if (!forceFollowLatest.current && !nearLatest.current) return;
    const behavior =
      forceFollowLatest.current &&
      document.documentElement.dataset.reducedMotion !== "true"
        ? "smooth"
        : "auto";
    const frame = requestAnimationFrame(() => {
      if (!nearLatest.current && !forceFollowLatest.current) return;
      scrollToLatest(behavior);
      forceFollowLatest.current = false;
    });
    return () => cancelAnimationFrame(frame);
  }, [messages, scrollToLatest]);

  useEffect(() => {
    const urls = attachmentUrls.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
      urls.clear();
    };
  }, []);

  useEffect(() => {
    if (!selected || !ready || !identity.current) return;
    const friend = selected;
    const current = ++generation.current;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
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
        if (!target) {
          forceFollowLatest.current = true;
          requestAnimationFrame(() => {
            scrollToLatest("auto");
            if (!matchMedia("(max-width: 760px)").matches)
              composer.current?.focus({ preventScroll: true });
          });
        }
        if (target) {
          await load(friend, k, 0, current, target);
          if (active) focusMessage(`message-${target}`);
        }
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
  }, [selected, ready, load, connectionAttempt, scrollToLatest]);
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
  const closeConversation = useCallback(() => {
    composer.current?.blur();
    setNativeChatComposerFocused(false);
    router.replace("/friends", { scroll: false });
  }, [router]);

  useEffect(() => {
    const root = document.documentElement;
    if (selected) root.dataset.enturmaPrivateChat = "true";
    else delete root.dataset.enturmaPrivateChat;
    return () => {
      delete root.dataset.enturmaPrivateChat;
      setNativeChatComposerFocused(false);
    };
  }, [selected]);

  const choose = useCallback(
    (friend: Friend) => {
      router.push(`/friends?chat=${friend.id}`, { scroll: false });
    },
    [router],
  );

  // The URL is the single source of navigation state, including native Back.
  useEffect(() => {
    if (selected?.id === requestedChat) return;
    const target = friends.find(
      (f) => f.id === requestedChat && f.status === "ACCEPTED",
    );
    if (requestedChat && !target) return;
    const frame = requestAnimationFrame(() => {
      composer.current?.blur();
      setNativeChatComposerFocused(false);
      setConnectionState("preparing");
      setConnectionError("");
      setError("");
      setMessages([]);
      loadedPages.current = 0;
      setPrivateActionMessage(null);
      setPrivateActionAnchor(null);
      setEditingPrivate(null);
      setDraft("");
      setImage(null);
      setImagePreview((old) => {
        if (old) URL.revokeObjectURL(old);
        return null;
      });
      setEmojiOpen(false);
      setPage(0);
      setFinger("");
      key.current = null;
      nearLatest.current = true;
      forceFollowLatest.current = true;
      previousMessageCount.current = 0;
      setSelected(target);
    });
    return () => cancelAnimationFrame(frame);
  }, [requestedChat, friends, selected?.id]);
  const refreshFriendData = async () => {
    await refresh();
    if (selected && key.current)
      await load(selected, key.current, 0, generation.current);
  };
  useLiveRefresh("notifications_changed", refreshFriendData);
  useLiveRefresh("friends_changed", refreshFriendData, 8000);

  useEffect(() => {
    return () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };
  }, []);

  function cancelPrivateLongPress() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
    longPressOrigin.current = null;
  }

  function startPrivateLongPress(
    event: React.PointerEvent<HTMLElement>,
    message: PrivateMessage,
  ) {
    if (
      event.pointerType === "mouse" ||
      (event.target as HTMLElement).closest("button,a,input,textarea")
    )
      return;
    cancelPrivateLongPress();
    longPressOrigin.current = { x: event.clientX, y: event.clientY };
    const target = event.currentTarget;
    longPressTimer.current = setTimeout(() => {
      setPrivateActionAnchor(messageActionAnchor(target));
      setPrivateActionMessage(message);
      longPressTimer.current = null;
      longPressOrigin.current = null;
    }, 430);
  }

  function movePrivateLongPress(event: React.PointerEvent<HTMLElement>) {
    const origin = longPressOrigin.current;
    if (!origin) return;
    if (
      Math.abs(event.clientX - origin.x) > 10 ||
      Math.abs(event.clientY - origin.y) > 10
    )
      cancelPrivateLongPress();
  }

  async function deletePrivateMessage(
    message: PrivateMessage,
    scope: "me" | "everyone",
  ) {
    if (!selected) return;
    await api(
      `/friends/${selected.id}/messages/${message.id}${scope === "me" ? "/hide" : ""}`,
      { method: scope === "me" ? "POST" : "DELETE" },
    );
    setMessages((old) =>
      scope === "me"
        ? old.filter((m) => m.id !== message.id)
        : old.map((m) =>
            m.id === message.id
              ? {
                  ...m,
                  text: "",
                  deletedAt: new Date().toISOString(),
                  attachmentUrl: undefined,
                  reactions: [],
                }
              : m,
          ),
    );
    setEditingPrivate(null);
    if (key.current) await load(selected, key.current, 0, generation.current);
  }
  async function reactPrivate(message: PrivateMessage, emoji: string) {
    if (!selected || !key.current) return;
    const mine = messages
      .find((m) => m.id === message.id)
      ?.reactions?.some((r) => r.emoji === emoji && r.mine);
    await api(
      `/friends/${selected.id}/messages/${message.id}/reactions?emoji=${encodeURIComponent(emoji)}`,
      { method: mine ? "DELETE" : "POST" },
    );
    await load(selected, key.current, 0, generation.current);
  }

  async function savePrivateEdit(message: PrivateMessage) {
    if (!selected || !me || !key.current || message.senderId !== me.id) return;
    try {
      const payload = await encryptMessage(
        key.current,
        editPrivateText.trim(),
        selected.id,
        me.id,
        message.clientId,
      );
      await api(`/friends/${selected.id}/messages/${message.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ciphertext: payload.ciphertext,
          iv: payload.iv,
        }),
      });
      setMessages((old) =>
        old.map((item) =>
          item.id === message.id
            ? { ...item, text: editPrivateText.trim() }
            : item,
        ),
      );
      setEditingPrivate(null);
      setPrivateActionMessage(null);
      setPrivateActionAnchor(null);
    } catch (cause) {
      setError((cause as Error).message);
    }
  }

  useEffect(() => {
    resizeMessageComposerTextarea(composer.current);
  }, [draft]);
  function selectImage(file: File | null) {
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
        file.type,
      )
    ) {
      setError("Use JPG, PNG, WEBP ou GIF.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("A imagem pode ter no máximo 8 MB antes da otimização.");
      return;
    }
    setImage(file);
    setImagePreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(file);
    });
    setEmojiOpen(false);
    setError("");
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !me || !key.current || busy || (!draft.trim() && !image))
      return;

    setBusy(true);
    setError("");
    const friend = selected;
    const clientId = crypto.randomUUID();
    try {
      const payload = await encryptMessage(
        key.current,
        draft.trim(),
        friend.id,
        me.id,
        clientId,
      );
      const preparedImage = image ? await preparePrivateChatImage(image) : null;
      const attachment = preparedImage
        ? await encryptAttachment(
            key.current,
            preparedImage,
            friend.id,
            me.id,
            clientId,
          )
        : {};

      forceFollowLatest.current = true;
      await post(`/friends/${friend.id}/messages`, {
        ...payload,
        ...attachment,
        mentioned: !!friend.username && mentionsUser(draft, friend.username),
      });

      setDraft("");
      setImage(null);
      setImagePreview((old) => {
        if (old) URL.revokeObjectURL(old);
        return null;
      });
      setEmojiOpen(false);
      await load(friend, key.current, 0, generation.current);
      requestAnimationFrame(() => {
        scrollToLatest("auto");
        if (document.activeElement !== composer.current)
          composer.current?.focus({ preventScroll: true });
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell>
      <div
        className={
          selected ? "friends-page mobile-private-chat-open" : "friends-page"
        }
      >
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
                <article
                  key={f.id}
                  className="friend-conversation-row"
                  data-selected={selected?.id === f.id}
                >
                  <UserIdentity user={{ ...f, id: f.userId }} />
                  {f.status === "ACCEPTED" && (
                    <div className="friend-conversation-meta">
                      <small className={f.online ? "friend-online" : "muted"}>
                        {f.online ? "Online" : "Offline"}
                      </small>
                      {f.lastMessageAt && (
                        <time dateTime={f.lastMessageAt}>
                          {new Date(f.lastMessageAt).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </time>
                      )}
                      {!!f.unreadCount && (
                        <span
                          className="friend-unread"
                          aria-label={`${f.unreadCount} mensagens não lidas`}
                        >
                          {f.unreadCount}
                        </span>
                      )}
                    </div>
                  )}
                  {f.lastMessageId && (
                    <p className="friend-message-preview">
                      {previews[f.id]?.id === f.lastMessageId
                        ? previews[f.id].text
                        : "Mensagem privada criptografada"}
                    </p>
                  )}
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
            ref={privateChat}
            className="private-chat"
            aria-label="Conversa privada"
            data-notification-context={
              selected ? `friend:${selected.id}` : undefined
            }
            data-notification-at-latest={atLatest ? "true" : "false"}
          >
            {selected ? (
              <>
                <header className="private-chat-header">
                  <button
                    type="button"
                    className="private-chat-back"
                    aria-label="Voltar para conversas"
                    onClick={closeConversation}
                  >
                    <ArrowLeft size={24} />
                  </button>
                  <div className="private-chat-peer">
                    <UserIdentity user={{ ...selected, id: selected.userId }} />
                  </div>
                  <span className="privacy-pill">
                    Ponta a ponta · ECDH + AES-GCM
                  </span>
                  <PrivateCallButtons friendshipId={selected.id} />
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
                        {identityError && (
                          <button
                            className="secondary"
                            onClick={closeConversation}
                          >
                            Voltar à lista para desbloquear
                          </button>
                        )}
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
                              closeConversation();
                              requestAnimationFrame(() => {
                                const backup =
                                  document.getElementById("private-sync");
                                backup?.scrollIntoView({ block: "center" });
                                backup?.querySelector("input")?.focus();
                              });
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
                <div
                  ref={messagesViewport}
                  className="private-messages"
                  role="log"
                  aria-live="polite"
                  onScroll={(event) => {
                    const viewport = event.currentTarget;
                    nearLatest.current = isChatAtLatest(viewport);
                    setAtLatest(nearLatest.current);
                    if (nearLatest.current) {
                      window.dispatchEvent(
                        new CustomEvent("enturma-conversation-latest", {
                          detail: { context: `friend:${selected.id}` },
                        }),
                      );
                    }
                  }}
                >
                  {older ? (
                    <button
                      onClick={async () => {
                        if (!key.current) return;
                        nearLatest.current = false;
                        forceFollowLatest.current = false;
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
                      className={`${m.senderId === me?.id ? "mine" : ""} ${privateActionMessage?.id === m.id ? "message-action-selected" : ""}`}
                      onPointerDown={(event) => startPrivateLongPress(event, m)}
                      onPointerMove={movePrivateLongPress}
                      onPointerUp={cancelPrivateLongPress}
                      onPointerCancel={cancelPrivateLongPress}
                      onContextMenu={(event) => {
                        if (
                          !(event.target as HTMLElement).closest(
                            "input,textarea",
                          )
                        ) {
                          event.preventDefault();
                          setPrivateActionAnchor(
                            messageActionAnchor(event.currentTarget),
                          );
                          setPrivateActionMessage(m);
                        }
                      }}
                    >
                      <button
                        type="button"
                        className="message-overflow-trigger"
                        aria-label="Ações da mensagem"
                        onClick={(event) => {
                          setPrivateActionAnchor(
                            messageActionAnchor(
                              event.currentTarget.closest("article")!,
                            ),
                          );
                          setPrivateActionMessage(m);
                        }}
                      >
                        <MoreHorizontal size={19} />
                      </button>
                      <UserIdentity
                        compact
                        user={
                          m.senderId === me?.id
                            ? me!
                            : { ...selected, id: selected.userId }
                        }
                      />
                      <div className="private-message-body">
                        {m.deletedAt ? (
                          <p className="muted">Mensagem removida.</p>
                        ) : null}
                        {!m.deletedAt && m.attachmentUrl ? (
                          <ChatImage
                            src={m.attachmentUrl}
                            alt={m.attachmentName ?? "Imagem privada"}
                          />
                        ) : null}
                        {editingPrivate?.id === m.id ? (
                          <form
                            className="private-message-edit"
                            onSubmit={(event) => {
                              event.preventDefault();
                              void savePrivateEdit(m);
                            }}
                          >
                            <textarea
                              value={editPrivateText}
                              autoFocus
                              maxLength={4000}
                              onChange={(event) =>
                                setEditPrivateText(event.target.value)
                              }
                            />
                            <div>
                              <button type="submit">Salvar</button>
                              <button
                                type="button"
                                className="secondary"
                                onClick={() => setEditingPrivate(null)}
                              >
                                Cancelar
                              </button>
                            </div>
                          </form>
                        ) : m.text ? (
                          <p>
                            <EmojiText text={m.text} />
                          </p>
                        ) : null}
                        <small>
                          {new Date(m.createdAt).toLocaleString("pt-BR")}
                          {m.editedAt ? " · editada" : ""}
                        </small>
                        {!m.deletedAt && (
                          <div className="message-reactions">
                            {m.reactions?.map((r) => (
                              <button
                                type="button"
                                key={r.emoji}
                                aria-pressed={r.mine}
                                aria-label={`Reagir com ${r.emoji}`}
                                onClick={() =>
                                  void reactPrivate(m, r.emoji).catch((e) =>
                                    setError(e.message),
                                  )
                                }
                              >
                                <AnimatedEmoji value={r.emoji} /> {r.count}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
                {privateActionMessage && privateActionAnchor ? (
                  <MessageMenu
                    anchor={privateActionAnchor}
                    onDismiss={() => {
                      setPrivateActionMessage(null);
                      setPrivateActionAnchor(null);
                    }}
                    text={privateActionMessage.text}
                    onEdit={
                      privateActionMessage.senderId === me?.id &&
                      !privateActionMessage.deletedAt &&
                      privateActionMessage.text
                        ? () => {
                            setEditPrivateText(privateActionMessage.text);
                            setEditingPrivate(privateActionMessage);
                          }
                        : undefined
                    }
                    canDeleteEveryone={
                      privateActionMessage.senderId === me?.id &&
                      !privateActionMessage.deletedAt
                    }
                    onDelete={(scope) =>
                      deletePrivateMessage(privateActionMessage, scope)
                    }
                    onReact={
                      !privateActionMessage.deletedAt
                        ? (emoji) => reactPrivate(privateActionMessage, emoji)
                        : undefined
                    }
                  />
                ) : null}

                <form
                  onSubmit={send}
                  className="private-composer enturma-message-composer"
                >
                  {imagePreview && image ? (
                    <div className="attachment-preview private-attachment-preview">
                      <div className="attachment-preview-media">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imagePreview} alt={image.name} />
                        <button
                          type="button"
                          className="attachment-remove"
                          aria-label="Remover imagem selecionada"
                          onClick={() => {
                            setImage(null);
                            setImagePreview((old) => {
                              if (old) URL.revokeObjectURL(old);
                              return null;
                            });
                          }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div>
                        <strong>{image.name}</strong>
                        <small>Prévia antes do envio</small>
                      </div>
                    </div>
                  ) : null}

                  {emojiOpen && emojiAnchor ? (
                    <MessageActionPopover
                      anchor={emojiAnchor}
                      label="Emojis"
                      wide
                      onDismiss={() => setEmojiOpen(false)}
                    >
                      <EmojiPicker
                        onSelect={(emoji) => {
                          setDraft((value) => value + emoji);
                          setEmojiOpen(false);
                          composer.current?.focus({ preventScroll: true });
                        }}
                      />
                    </MessageActionPopover>
                  ) : null}

                  <div className="composer-main-row">
                    <button
                      type="button"
                      className="composer-icon-button"
                      aria-label="Adicionar emoji"
                      aria-expanded={emojiOpen}
                      onPointerDown={(event) => event.preventDefault()}
                      onClick={(event) => {
                        setEmojiAnchor(
                          messageActionAnchor(event.currentTarget),
                        );
                        setEmojiOpen((open) => !open);
                      }}
                    >
                      <Smile size={22} />
                    </button>

                    {privateImagesEnabled ? (
                      <label className="composer-icon-button composer-image-button">
                        <ImagePlus size={22} />
                        <span className="sr-only">Adicionar imagem</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          disabled={busy}
                          onChange={(event) => {
                            selectImage(event.target.files?.[0] ?? null);
                            event.target.value = "";
                          }}
                        />
                      </label>
                    ) : null}

                    <label className="composer-text-field">
                      <span className="sr-only">Mensagem privada</span>
                      <textarea
                        ref={composer}
                        value={draft}
                        onFocus={() => {
                          setNativeChatComposerFocused(true);
                          requestAnimationFrame(() => {
                            if (nearLatest.current) scrollToLatest("auto");
                          });
                        }}
                        onBlur={() => {
                          setNativeChatComposerFocused(false);
                        }}
                        onChange={(e) => setDraft(e.target.value)}
                        maxLength={4000}
                        disabled={!finger}
                        rows={1}
                        enterKeyHint="enter"
                        inputMode="text"
                        placeholder="Mensagem"
                        onKeyDown={(e) => {
                          if (
                            e.key === "Enter" &&
                            !e.shiftKey &&
                            !e.nativeEvent.isComposing &&
                            !isMobileTextEntryContext()
                          ) {
                            e.preventDefault();
                            e.currentTarget.form?.requestSubmit();
                          }
                        }}
                      />
                    </label>

                    <button
                      className="composer-send-button"
                      aria-label="Enviar mensagem"
                      onPointerDown={(event) => event.preventDefault()}
                      disabled={!finger || busy || (!draft.trim() && !image)}
                    >
                      <Send size={22} />
                    </button>
                  </div>
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
