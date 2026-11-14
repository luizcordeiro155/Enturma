"use client";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { EllipsisVertical, KeyRound, Search, UserPlus, UserX, X } from "lucide-react";
import { api } from "@/lib/api";
import type { SocialPerson } from "@/lib/social";
import { Avatar, UserIdentity, type PublicProfile } from "./user-identity";
import { SocialStories } from "./social/social-stories";
import { useLongPress } from "./social/use-long-press";

export type InboxFriend = Omit<PublicProfile, "id"> & {
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

/** Lower case, no accents and no leading @, so "@BIA" finds "Bía". */
export function searchKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/^@/, "");
}

const USERNAME = /^[a-z0-9._-]{3,40}$/i;

/** WhatsApp-style time: the hour today, "Ontem", then the date. */
export function conversationTime(iso: string, now = new Date()) {
  const at = new Date(iso);
  const day = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const days = Math.round((day(now) - day(at)) / 86_400_000);
  if (days <= 0)
    return at.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (days === 1) return "Ontem";
  return at.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * The friends list as a messenger inbox: search by @ or name, the Social Stories
 * on top, then conversations with the last message, its time and unread count.
 */
export function FriendsInbox({
  me,
  friends,
  previews,
  selectedId,
  socialEnabled,
  open,
  accept,
  remove,
  invite,
  backup,
}: {
  me: Pick<PublicProfile, "id" | "name" | "username"> & Partial<PublicProfile>;
  friends: InboxFriend[];
  previews: Record<string, { id: string; text: string; mine?: boolean }>;
  selectedId?: string;
  socialEnabled: boolean;
  open: (friend: InboxFriend) => void;
  accept: (friend: InboxFriend) => void;
  remove: (friend: InboxFriend) => void;
  invite: (username: string) => Promise<void>;
  backup: ReactNode;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState<SocialPerson[]>([]);
  const [invited, setInvited] = useState<string[]>([]);
  const [menu, setMenu] = useState(false);
  const [security, setSecurity] = useState(false);
  const key = searchKey(query);
  const accepted = friends.filter((f) => f.status === "ACCEPTED");
  const pending = friends.filter((f) => f.status !== "ACCEPTED");
  const matches = (f: InboxFriend) =>
    !key ||
    searchKey(f.name).includes(key) ||
    searchKey(f.username ?? "").includes(key);
  const conversations = accepted.filter(matches);
  const known = useMemo(
    () => new Set([me.id, ...friends.map((f) => f.userId)]),
    [me.id, friends],
  );
  useEffect(() => {
    if (!socialEnabled || key.length < 2) return;
    let alive = true;
    const timer = window.setTimeout(() => {
      void api<SocialPerson[]>(`/social/people?q=${encodeURIComponent(key)}`, {
        cache: "no-store",
      })
        .then((found) => {
          if (alive) setPeople(found);
        })
        .catch(() => {
          if (alive) setPeople([]);
        });
    }, 250);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [key, socialEnabled]);
  const strangers =
    socialEnabled && key.length >= 2
      ? people.filter((person) => !known.has(person.id))
      : [];
  // An exact @ can always be invited, even when the Social search is unavailable.
  const exact =
    USERNAME.test(key) &&
    !friends.some((f) => searchKey(f.username ?? "") === key) &&
    key !== searchKey(me.username ?? "") &&
    !people.some((person) => searchKey(person.username) === key)
      ? key
      : null;
  async function add(username: string) {
    await invite(username);
    setInvited((list) => [...list, username]);
  }
  return (
    <div className="friends-inbox">
      <header className="friends-inbox-header">
        <h1>Amigos</h1>
        <div className="friends-inbox-menu">
          <button
            type="button"
            className="icon-control"
            aria-label="Mais opções"
            aria-haspopup="menu"
            aria-expanded={menu}
            onClick={() => setMenu((value) => !value)}
          >
            <EllipsisVertical size={20} />
          </button>
          {menu && (
            <Menu label="Opções de Amigos" close={() => setMenu(false)}>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenu(false);
                  setSecurity(true);
                }}
              >
                <KeyRound size={18} aria-hidden="true" /> Chaves e backup das
                conversas
              </button>
            </Menu>
          )}
        </div>
      </header>
      <label className="friends-search">
        <span className="sr-only">Pesquisar amigos e pessoas</span>
        <Search size={18} aria-hidden="true" />
        <input
          type="search"
          value={query}
          maxLength={80}
          placeholder="Pesquise por @usuário ou nome"
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      {socialEnabled && !key && (
        <div className="friends-stories">
          <SocialStories
            me={{
              id: me.id,
              name: me.name,
              username: me.username ?? "",
              hasAvatar: me.hasAvatar,
            }}
            create={() => router.push("/social?create=story")}
            person={(id) => router.push(`/social?person=${id}`)}
            refreshKey={0}
          />
        </div>
      )}
      {pending.length > 0 && !key && (
        <section className="friends-invites" aria-labelledby="friends-invites">
          <h2 id="friends-invites">Convites</h2>
          <ul>
            {pending.map((f) => (
              <li key={f.id} className="friend-row friend-invite-row">
                <UserIdentity user={{ ...f, id: f.userId }} compact />
                <span className="friend-row-text">
                  <strong>{f.name}</strong>
                  <small>
                    {f.recipient === me.id ? "Quer ser seu amigo" : "Convite enviado"}
                  </small>
                </span>
                {f.recipient === me.id ? (
                  <span className="friend-invite-actions">
                    <button type="button" onClick={() => accept(f)}>
                      Aceitar convite
                    </button>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => remove(f)}
                    >
                      Recusar
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => remove(f)}
                  >
                    Cancelar convite
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
      <ul className="friends-conversations" aria-label="Conversas">
        {conversations.map((f) => (
          <ConversationRow
            key={f.id}
            friend={f}
            preview={
              f.lastMessageId
                ? previews[f.id]?.id === f.lastMessageId
                  ? `${previews[f.id].mine ? "Você: " : ""}${previews[f.id].text}`
                  : "Mensagem privada"
                : `@${f.username}`
            }
            selected={selectedId === f.id}
            open={() => open(f)}
            remove={() => remove(f)}
          />
        ))}
      </ul>
      {accepted.length === 0 && pending.length === 0 && !key && (
        <p className="friends-empty">
          Nenhuma conversa ainda. Pesquise um colega pelo @ ou pelo nome para
          começar.
        </p>
      )}
      {key && conversations.length === 0 && (
        <p className="friends-empty">Nenhuma conversa com “{query.trim()}”.</p>
      )}
      {key && (strangers.length > 0 || exact) && (
        <section className="friends-people" aria-labelledby="friends-people">
          <h2 id="friends-people">Pessoas no Enturma</h2>
          <ul>
            {strangers.map((person) => (
              <li key={person.id} className="friend-row">
                <Avatar user={person as PublicProfile} />
                <span className="friend-row-text">
                  <strong>{person.name}</strong>
                  <small>@{person.username}</small>
                </span>
                <InviteButton
                  username={person.username}
                  sent={invited.includes(person.username)}
                  add={add}
                />
              </li>
            ))}
            {exact && (
              <li className="friend-row">
                <span className="friend-row-glyph" aria-hidden="true">
                  <UserPlus size={20} />
                </span>
                <span className="friend-row-text">
                  <strong>@{exact}</strong>
                  <small>Convidar pelo nome de usuário</small>
                </span>
                <InviteButton
                  username={exact}
                  sent={invited.includes(exact)}
                  add={add}
                />
              </li>
            )}
          </ul>
        </section>
      )}
      {security && (
        <SecurityDialog close={() => setSecurity(false)}>{backup}</SecurityDialog>
      )}
    </div>
  );
}

function InviteButton({
  username,
  sent,
  add,
}: {
  username: string;
  sent: boolean;
  add: (username: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  if (sent) return <small className="friend-invite-sent">Convite enviado</small>;
  return (
    <button
      type="button"
      className="friend-add"
      aria-label={`Adicionar @${username}`}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await add(username);
        } catch {
          /* The page reports the error. */
        } finally {
          setBusy(false);
        }
      }}
    >
      Adicionar
    </button>
  );
}

function ConversationRow({
  friend,
  preview,
  selected,
  open,
  remove,
}: {
  friend: InboxFriend;
  preview: string;
  selected: boolean;
  open: () => void;
  remove: () => void;
}) {
  const [menu, setMenu] = useState<DOMRect | null>(null);
  const row = useRef<HTMLButtonElement>(null);
  const press = useLongPress(() =>
    setMenu(row.current?.getBoundingClientRect() ?? null),
  );
  const unread = friend.unreadCount ?? 0;
  return (
    <li
      className="friend-row friend-conversation"
      data-selected={selected}
      data-online={friend.online === true}
    >
      <UserIdentity user={{ ...friend, id: friend.userId }} compact />
      <button
        ref={row}
        type="button"
        className="friend-row-open"
        aria-label={`Conversar com ${friend.name}`}
        aria-current={selected ? "true" : undefined}
        onClick={open}
        {...press}
      >
        <span className="friend-row-top">
          <strong>{friend.name}</strong>
          {friend.lastMessageAt && (
            <time dateTime={friend.lastMessageAt} data-unread={unread > 0}>
              {conversationTime(friend.lastMessageAt)}
            </time>
          )}
        </span>
        <span className="friend-row-bottom">
          <span className="friend-row-preview">{preview}</span>
          {unread > 0 && (
            <span
              className="friend-unread"
              aria-label={`${unread} mensagens não lidas`}
            >
              {unread}
            </span>
          )}
        </span>
      </button>
      {menu && (
        <Menu
          label={`Opções da conversa com ${friend.name}`}
          close={() => setMenu(null)}
          style={{
            top: menu.top + 8,
            left: Math.max(8, Math.min(menu.right - 220, window.innerWidth - 228)),
          }}
        >
          <button
            type="button"
            role="menuitem"
            className="danger"
            onClick={() => {
              setMenu(null);
              remove();
            }}
          >
            <UserX size={18} aria-hidden="true" /> Remover amizade
          </button>
        </Menu>
      )}
    </li>
  );
}

function Menu({
  label,
  close,
  style,
  children,
}: {
  label: string;
  close: () => void;
  style?: React.CSSProperties;
  children: ReactNode;
}) {
  const menu = useRef<HTMLDivElement>(null);
  useEffect(() => {
    menu.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const outside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (menu.current?.contains(target)) return;
      // The ⋮ button toggles the menu itself.
      if ((target as Element).closest?.('[aria-haspopup="menu"]')) return;
      close();
    };
    document.addEventListener("keydown", key);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", key);
      document.removeEventListener("pointerdown", outside);
    };
  }, [close]);
  const content = (
    <div
      ref={menu}
      role="menu"
      aria-label={label}
      className={`friends-menu ${style ? "friends-menu-fixed" : ""}`}
      style={style}
    >
      {children}
    </div>
  );
  // Screen-positioned menus go to the body so no transformed ancestor can move them.
  return style ? createPortal(content, document.body) : content;
}

function SecurityDialog({
  close,
  children,
}: {
  close: () => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!element || element.open) return;
    if (typeof element.showModal === "function") element.showModal();
    else element.setAttribute("open", "");
  }, []);
  return (
    <dialog
      ref={dialog}
      className="friends-security-dialog"
      aria-labelledby="friends-security-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <header>
        <h2 id="friends-security-title">Chaves e backup das conversas</h2>
        <button
          type="button"
          className="icon-control"
          aria-label="Fechar"
          onClick={close}
        >
          <X size={20} />
        </button>
      </header>
      {children}
    </dialog>
  );
}
