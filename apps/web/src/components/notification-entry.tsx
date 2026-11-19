"use client";
import { AtSign, MessageCircle, ShieldAlert } from "lucide-react";
import { Avatar } from "./user-identity";

export type NoticeActor = {
  id: string;
  name: string | null;
  username?: string | null;
  hasAvatar?: boolean;
};
export type Notice = {
  id: string;
  message: string;
  actorName: string | null;
  actorId?: string;
  actorUsername?: string;
  actorHasAvatar?: boolean;
  /** Who did it, the latest first: at most three, for the faces. */
  actors?: NoticeActor[];
  /** How many people the entry stands for. */
  actorCount?: number;
  socialFollowStatus?: string;
  kind: string;
  contextKey: string | null;
  targetId: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

/** What the people in an entry did: said of one person, then of several. */
const DID: Record<string, [string, string]> = {
  SOCIAL_LIKE: ["curtiu sua publicação.", "curtiram sua publicação."],
  SOCIAL_REPOST: ["republicou seu conteúdo.", "republicaram seu conteúdo."],
  SOCIAL_COMMENT: [
    "respondeu à sua publicação.",
    "responderam à sua publicação.",
  ],
  SOCIAL_FOLLOW: ["começou a seguir você.", "começaram a seguir você."],
  SOCIAL_FOLLOW_REQUEST: [
    "pediu para seguir você.",
    "pediram para seguir você.",
  ],
  SOCIAL_FOLLOW_ACCEPTED: [
    "aceitou seu pedido para seguir.",
    "aceitaram seu pedido para seguir.",
  ],
  FORUM_LIKE: [
    "curtiu o que você escreveu no fórum.",
    "curtiram o que você escreveu no fórum.",
  ],
  FORUM_REACTION: [
    "reagiu ao que você escreveu no fórum.",
    "reagiram ao que você escreveu no fórum.",
  ],
};

/** Who an entry is about: what the server grouped, or its single actor. */
function people(notice: Notice): NoticeActor[] {
  if (notice.actors?.length) return notice.actors;
  return notice.actorId
    ? [
        {
          id: notice.actorId,
          name: notice.actorName,
          username: notice.actorUsername,
          hasAvatar: notice.actorHasAvatar,
        },
      ]
    : [];
}

/** "Ana", "Ana e Bruno", "Ana, Bruno e mais 4 pessoas": the latest two, then a count. */
function names(who: NoticeActor[], total: number) {
  const called = who.map((person) => person.name ?? "Estudante");
  if (total <= 1) return called[0];
  if (total === 2 && called.length >= 2) return `${called[0]} e ${called[1]}`;
  const rest = total - Math.min(2, called.length);
  return `${called.slice(0, 2).join(", ")} e mais ${rest} ${rest === 1 ? "pessoa" : "pessoas"}`;
}

/**
 * One line of the inbox: the faces of who did it and what happened. Likes and other
 * reactions on the same thing arrive from the server as a single entry.
 */
export function NoticeSummary({ notice }: { notice: Notice }) {
  const who = people(notice),
    did = DID[notice.kind],
    total = Math.max(notice.actorCount ?? who.length, who.length),
    social = notice.kind.startsWith("SOCIAL_") || Boolean(did);
  return (
    <>
      {social && who.length ? (
        <span className="notification-faces" data-faces={who.length}>
          {who.map((person) => (
            <Avatar
              key={person.id}
              user={{
                id: person.id,
                name: person.name ?? "Estudante",
                username: person.username ?? undefined,
                hasAvatar: person.hasAvatar,
              }}
            />
          ))}
        </span>
      ) : notice.kind === "MODERATION" ? (
        <ShieldAlert size={18} />
      ) : notice.kind === "MENTION" ? (
        <AtSign size={18} />
      ) : (
        <MessageCircle size={18} />
      )}
      <span className="notification-copy">
        {did && who.length ? (
          <span>
            <strong>{names(who, total)}</strong> {did[total > 1 ? 1 : 0]}
          </span>
        ) : (
          <>
            {notice.actorName ? <strong>{notice.actorName}</strong> : null}
            <span>{notice.message}</span>
          </>
        )}
        <time dateTime={notice.createdAt}>
          {new Date(notice.createdAt).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
      </span>
    </>
  );
}
