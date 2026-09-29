"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, CheckCheck, MessageCircle, X, AtSign } from "lucide-react";
import { api, post } from "@/lib/api";
import { useAppConnection, useLiveRefresh } from "@/lib/live-updates";

type Notice = {
  id: string;
  message: string;
  actorName: string | null;
  kind: string;
  contextKey: string | null;
  targetId: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};
type Inbox = { items: Notice[]; unreadCount: number };
type State = Inbox & {
  error: string;
  refresh: () => Promise<void>;
  read: (ids?: string[], all?: boolean) => Promise<void>;
  inline: Notice[];
};
const Context = createContext<State | undefined>(undefined);
function activeContexts() {
  return document.hidden
    ? []
    : [...document.querySelectorAll<HTMLElement>("[data-notification-context]")]
        .filter((e) => e.getClientRects().length > 0)
        .map((e) => e.dataset.notificationContext!);
}
export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [inbox, setInbox] = useState<Inbox>({ items: [], unreadCount: 0 });
  const [inline, setInline] = useState<Notice[]>([]);
  const [error, setError] = useState("");
  const pending = useRef(false),
    seen = useRef(new Set<string>());
  useAppConnection();
  async function refresh() {
    if (pending.current) return;
    pending.current = true;
    try {
      const data = await api<Inbox>("/notifications/inbox");
      const contexts = activeContexts();
      const viewed = data.items.filter(
        (n) =>
          !n.readAt &&
          contexts.includes(n.contextKey ?? "") &&
          ["PRIVATE_MESSAGE", "ROOM_MESSAGE", "MENTION"].includes(n.kind),
      );
      const fresh = viewed.filter((n) => !seen.current.has(n.id));
      if (fresh.length)
        setInline((old) =>
          [...fresh, ...old]
            .filter(
              (n, i, a) =>
                a.findIndex((x) => x.contextKey === n.contextKey) === i,
            )
            .slice(0, 10),
        );
      if (viewed.length) {
        await post("/notifications/read", { ids: viewed.map((n) => n.id) });
        const ids = new Set(viewed.map((n) => n.id));
        data.items = data.items.map((n) =>
          ids.has(n.id) ? { ...n, readAt: new Date().toISOString() } : n,
        );
        data.unreadCount = Math.max(0, data.unreadCount - viewed.length);
      }
      seen.current = new Set(data.items.map((n) => n.id));
      setInbox(data);
      setError("");
    } catch {
      setError("Não foi possível atualizar suas notificações.");
    } finally {
      pending.current = false;
    }
  }
  useLiveRefresh("notifications_changed", refresh, 5000);
  useEffect(() => {
    const timer = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(timer);
  }, []);
  async function read(ids?: string[], all = false) {
    try {
      await post("/notifications/read", { ids, all });
      setInbox((old) => ({
        ...old,
        items: old.items.map((n) =>
          all || ids?.includes(n.id)
            ? { ...n, readAt: n.readAt ?? new Date().toISOString() }
            : n,
        ),
        unreadCount: all
          ? 0
          : Math.max(
              0,
              old.unreadCount -
                old.items.filter((n) => !n.readAt && ids?.includes(n.id))
                  .length,
            ),
      }));
    } catch {
      setError("Não foi possível marcar como lida. Tente novamente.");
    }
  }
  return (
    <Context.Provider value={{ ...inbox, error, refresh, read, inline }}>
      {children}
    </Context.Provider>
  );
}

export function NotificationBell() {
  const data = useContext(Context),
    router = useRouter(),
    path = usePathname();
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null),
    button = useRef<HTMLButtonElement>(null),
    last = useRef(0);
  useEffect(() => {
    if (open) {
      const el = dialog.current!;
      const trigger = button.current;
      el.showModal();
      animate(el, [
        { opacity: 0, transform: "translateY(-10px)" },
        { opacity: 1, transform: "none" },
      ]);
      return () => {
        el.close();
        trigger?.focus();
      };
    }
  }, [open]);
  useEffect(() => {
    if ((data?.unreadCount ?? 0) > last.current && button.current)
      animate(button.current, [
        { transform: "rotate(0)" },
        { transform: "rotate(-12deg)" },
        { transform: "rotate(12deg)" },
        { transform: "rotate(0)" },
      ]);
    last.current = data?.unreadCount ?? 0;
  }, [data?.unreadCount]);
  if (!data) return null;
  async function visit(n: Notice) {
    await data!.read([n.id]);
    setOpen(false);
    if (n.href?.startsWith("/") && !n.href.startsWith("//")) {
      router.push(n.href);
      if (n.href.split(/[?#]/)[0] === path)
        window.dispatchEvent(
          new CustomEvent("enturma-notification-open", {
            detail: { href: n.href },
          }),
        );
    }
  }
  return (
    <>
      <button
        ref={button}
        className="icon-control notification-bell"
        aria-label={`Notificações${data.unreadCount ? `, ${data.unreadCount} não lidas` : ""}`}
        aria-haspopup="dialog"
        onClick={() => {
          setOpen(true);
          void data.refresh();
        }}
      >
        <Bell size={20} />
        {data.unreadCount ? (
          <span className="notification-count">
            {data.unreadCount > 99 ? "99+" : data.unreadCount}
          </span>
        ) : null}
      </button>
      {open ? (
        <dialog
          ref={dialog}
          className="notification-inbox"
          aria-labelledby="inbox-title"
          onCancel={() => setOpen(false)}
        >
          <header>
            <div>
              <h2 id="inbox-title">Sua caixa de entrada</h2>
              <small>{data.unreadCount} não lidas</small>
            </div>
            <button
              className="icon-control"
              aria-label="Fechar notificações"
              onClick={() => setOpen(false)}
            >
              <X size={20} />
            </button>
          </header>
          <button
            className="text-button"
            disabled={!data.unreadCount}
            onClick={() => void data.read(undefined, true)}
          >
            <CheckCheck size={17} /> Marcar todas como lidas
          </button>
          {data.error ? (
            <p role="alert">
              {data.error}
              <button
                className="text-button"
                onClick={() => void data.refresh()}
              >
                Tentar novamente
              </button>
            </p>
          ) : null}
          {!data.items.length && !data.error ? (
            <p className="notification-empty">
              Tudo em dia. Curtidas, menções e novas mensagens aparecerão aqui.
            </p>
          ) : null}
          <div className="notification-items">
            {data.items.map((n) => (
              <button
                key={n.id}
                className={`notification-item ${n.readAt ? "" : "unread"}`}
                onClick={() => void visit(n)}
              >
                {n.kind === "MENTION" ? (
                  <AtSign size={18} />
                ) : (
                  <MessageCircle size={18} />
                )}
                <span>
                  {n.actorName ? <strong>{n.actorName}</strong> : null}
                  <span>{n.message}</span>
                  <time dateTime={n.createdAt}>
                    {new Date(n.createdAt).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </span>
                {!n.readAt ? <i aria-label="Não lida" /> : null}
              </button>
            ))}
          </div>
        </dialog>
      ) : null}
    </>
  );
}
export function ConversationNotice({ context }: { context: string }) {
  const data = useContext(Context);
  const [dismissed, setDismissed] = useState("");
  const notice = data?.inline.find(
    (n) => n.contextKey === context && n.id !== dismissed,
  );
  useEffect(() => {
    window.dispatchEvent(new Event("enturma-notifications_changed"));
  }, [context]);
  return notice ? (
    <button
      className="conversation-notice"
      onClick={() => {
        if (notice.targetId) focusMessage(`message-${notice.targetId}`);
        setDismissed(notice.id);
      }}
    >
      {notice.kind === "MENTION" ? (
        <AtSign size={16} />
      ) : (
        <MessageCircle size={16} />
      )}{" "}
      {notice.kind === "MENTION"
        ? "Você foi mencionado · ver mensagem"
        : "Nova mensagem · ir para ela"}
    </button>
  ) : null;
}
export function focusMessage(id: string) {
  const show = () => {
    const el = document.getElementById(id);
    if (!el) return false;
    el.scrollIntoView({
      block: "center",
      behavior: reduced() ? "instant" : "smooth",
    });
    el.classList.add("notification-target");
    animate(el, [
      { outlineColor: "transparent" },
      { outlineColor: "var(--accent)" },
      { outlineColor: "transparent" },
    ]);
    setTimeout(() => el.classList.remove("notification-target"), 4500);
    return true;
  };
  if (show()) return;
  const observer = new MutationObserver(() => {
    if (show()) observer.disconnect();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(() => observer.disconnect(), 10000);
}
export function useNotificationTarget() {
  const path = usePathname();
  useEffect(() => {
    const show = () => {
      const id = location.hash.slice(1);
      if (/^(message|entry)-[a-f0-9-]+$/.test(id)) focusMessage(id);
    };
    const event = (e: Event) => {
      const href = (e as CustomEvent).detail?.href;
      if (href) {
        const hash = href.split("#")[1];
        if (hash) focusMessage(hash);
      }
    };
    show();
    window.addEventListener("hashchange", show);
    window.addEventListener("enturma-notification-open", event);
    return () => {
      window.removeEventListener("hashchange", show);
      window.removeEventListener("enturma-notification-open", event);
    };
  }, [path]);
}
function reduced() {
  return (
    matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.dataset.reducedMotion === "true"
  );
}
function animate(el: Element, frames: Keyframe[]) {
  if (!reduced()) el.animate(frames, { duration: 420, easing: "ease-out" });
}
