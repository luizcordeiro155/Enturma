"use client";
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Gamepad2,
  Headphones,
  NotebookPen,
  Users,
} from "lucide-react";
import { api } from "@/lib/api";
import { Avatar, type PublicProfile } from "./user-identity";
import { ShowcaseView, type Showcase } from "./profile-showcase";
import { profileEntrance } from "./profile-motion";
import { RideReputation } from "./ride-reputation";

type Community = {
  rooms: { id: string; title: string; status: string }[];
  friends: PublicProfile[];
  activityVisible: boolean;
  activity?: {
    id: string;
    kind: string;
    startedAt: string;
    lastSeenAt: string;
    active: boolean;
  }[];
};
const activities = {
  GAME: { label: "Jogando desafios acadêmicos", Icon: Gamepad2 },
  PRACTICE: { label: "Praticando programação", Icon: Gamepad2 },
  NOTEBOOK: { label: "Estudando nos Cadernos IA", Icon: NotebookPen },
  ROOM: { label: "Estudando em sala", Icon: BookOpen },
  ROOM_CALL: { label: "Em chamada de sala de estudo", Icon: Headphones },
};

export function ProfileCommunity({
  userId,
  showcase,
  own,
  onNavigate,
}: {
  userId: string;
  showcase?: Showcase;
  own: boolean;
  onNavigate: () => void;
}) {
  const [data, setData] = useState<Community>();
  const [error, setError] = useState("");
  const [tab, setTab] = useState("mural");
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    let live = true;
    const refresh = () => {
      if (document.hidden) return;
      api<Community>(`/users/${userId}/community`)
        .then((value) => {
          if (live) {
            setData(value);
            setError("");
          }
        })
        .catch((e) => {
          if (live) setError(e.message);
        });
    };
    refresh();
    const interval = setInterval(refresh, 30000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      live = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [userId]);
  useEffect(() => {
    const animation = panel.current
      ? profileEntrance(panel.current)
      : undefined;
    return () => animation?.cancel();
  }, [tab]);
  const tabs = [
    ["mural", "Mural"],
    ["activity", "Atividade"],
    ["rooms", `Salas em comum${data ? ` · ${data.rooms.length}` : ""}`],
    ["friends", `Amigos em comum${data ? ` · ${data.friends.length}` : ""}`],
  ];
  const hasMural =
    showcase &&
    (showcase.stats ||
      showcase.joinedAt ||
      showcase.academic?.length ||
      showcase.achievements?.some((a) => a.earnedAt) ||
      showcase.widgets?.some((w) => w.visible) ||
      showcase.appearance.goal?.trim() ||
      showcase.appearance.technologies?.trim() ||
      showcase.appearance.projects?.trim());
  return (
    <div className="profile-community">
      <div
        className="profile-community-tabs"
        role="tablist"
        aria-label="Conteúdo do perfil"
      >
        {tabs.map(([key, label], index) => (
          <button
            type="button"
            role="tab"
            key={key}
            id={`${id}-${key}`}
            aria-controls={`${id}-panel`}
            aria-selected={tab === key}
            tabIndex={tab === key ? 0 : -1}
            onClick={() => setTab(key)}
            onKeyDown={(e) => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key))
                return;
              e.preventDefault();
              const next =
                e.key === "Home"
                  ? 0
                  : e.key === "End"
                    ? tabs.length - 1
                    : (index +
                        (e.key === "ArrowRight" ? 1 : -1) +
                        tabs.length) %
                      tabs.length;
              setTab(tabs[next][0]);
              document.getElementById(`${id}-${tabs[next][0]}`)?.focus();
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        className="profile-community-panel"
        ref={panel}
        role="tabpanel"
        tabIndex={0}
        id={`${id}-panel`}
        aria-labelledby={`${id}-${tab}`}
      >
        {tab === "mural" && (
          <>
            {own && (
              <Link
                className="profile-edit-link"
                href="/profile"
                onClick={onNavigate}
              >
                Personalizar perfil e mural
              </Link>
            )}
            {showcase ? (
              <ShowcaseView
                value={showcase}
                showBadges={false}
                compact
                detailed
              />
            ) : (
              <p>Carregando mural…</p>
            )}
            {showcase && !hasMural && (
              <p className="profile-community-empty">
                Este perfil ainda não compartilhou itens no mural. Você pode
                explorar as salas e amizades em comum nas abas acima.
              </p>
            )}
            <RideReputation userId={userId} />
          </>
        )}
        {tab !== "mural" && error && <p role="status">{error}</p>}
        {tab !== "mural" && !data && !error && <p>Carregando…</p>}
        {tab === "activity" && data && (
          <>
            {!data.activityVisible ? (
              <p className="profile-community-empty">
                Este perfil mantém suas atividades privadas.
              </p>
            ) : data.activity?.length ? (
              data.activity.map((activity) => {
                const { label, Icon } =
                  activities[activity.kind as keyof typeof activities] ??
                  activities.ROOM;
                return (
                  <article className="profile-activity" key={activity.id}>
                    <span
                      className={`profile-activity-art activity-${activity.kind}`}
                    >
                      <Icon size={30} />
                    </span>
                    <div>
                      <small>
                        {activity.active
                          ? "Agora"
                          : new Date(activity.lastSeenAt).toLocaleDateString(
                              "pt-BR",
                              { day: "numeric", month: "long" },
                            )}
                      </small>
                      <strong>{label}</strong>
                      <span>
                        {activity.active
                          ? "Em atividade"
                          : `${Math.max(1, Math.round((Date.parse(activity.lastSeenAt) - Date.parse(activity.startedAt)) / 60000))} min de atividade`}
                      </span>
                    </div>
                    {activity.active && (
                      <i className="profile-active-dot" aria-label="Ativo" />
                    )}
                  </article>
                );
              })
            ) : (
              <p className="profile-community-empty">
                As atividades compartilhadas dos últimos sete dias aparecem
                aqui.
              </p>
            )}
            {own && (
              <Link href="/profile" onClick={onNavigate}>
                Gerenciar a privacidade da atividade
              </Link>
            )}
          </>
        )}
        {tab === "rooms" &&
          data &&
          (data.rooms.length ? (
            data.rooms.map((room) => (
              <Link
                className="profile-community-row"
                key={room.id}
                href={`/rooms/${room.id}`}
                onClick={onNavigate}
              >
                <span className="profile-community-icon">
                  <BookOpen size={22} />
                </span>
                <span>
                  <strong>{room.title}</strong>
                  <small>
                    {room.status === "ENDED"
                      ? "Vocês estudaram juntos"
                      : "Sala de estudo"}
                  </small>
                </span>
              </Link>
            ))
          ) : (
            <p className="profile-community-empty">
              <BookOpen /> Vocês ainda não têm salas em comum.
            </p>
          ))}
        {tab === "friends" &&
          data &&
          (data.friends.length ? (
            data.friends.map((friend) => (
              <div className="profile-community-row" key={friend.id}>
                <Avatar user={friend} />
                <span>
                  <strong>{friend.name}</strong>
                  <small>@{friend.username}</small>
                </span>
              </div>
            ))
          ) : (
            <p className="profile-community-empty">
              <Users /> Nenhum amigo em comum por enquanto.
            </p>
          ))}
      </div>
    </div>
  );
}
