"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { BookOpen, LogIn, Users } from "lucide-react";
import { api } from "@/lib/api";
import { roomInvitationCodes, type RoomInvitation } from "@/lib/room-invite";
import { RoomJoinDialog } from "./room-join-dialog";
import { RoomArtwork } from "./room-artwork";

function InvitationCard({ code }: { code: string }) {
  const container = useRef<HTMLElement>(null);
  const [room, setRoom] = useState<RoomInvitation>();
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    let started = false;
    const load = () => {
      if (started) return;
      started = true;
      // api() coalesces repeated cards with the same code in the conversation.
      void api<RoomInvitation>(`/study-rooms/join-code/${code}`)
        .then((result) => {
          if (alive) setRoom(result);
        })
        .catch(() => {
          if (alive) setError("Este convite não está disponível.");
        });
    };
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            (entries) => {
              if (entries.some((entry) => entry.isIntersecting)) {
                load();
                observer?.disconnect();
              }
            },
            { rootMargin: "100px" },
          );
    if (observer && container.current) observer.observe(container.current);
    else load();
    return () => {
      alive = false;
      observer?.disconnect();
    };
  }, [code]);

  return (
    <article
      ref={container}
      className="room-invitation-card"
      aria-label="Convite para sala de estudo"
    >
      {room ? (
        <>
          <RoomArtwork room={room} />
          <div className="room-invitation-copy">
            <small>CONVITE PARA ESTUDAR</small>
            <h3>{room.title}</h3>
            <p>{room.subjectName}</p>
            <span className="room-invitation-members">
              <Users size={15} aria-hidden="true" />
              {room.participantCount}{" "}
              {room.participantCount === 1 ? "participante" : "participantes"}
            </span>
            <button
              type="button"
              className="button"
              disabled={!room.available}
              onClick={() => setOpen(true)}
            >
              <LogIn size={17} aria-hidden="true" />
              {room.available ? "Entrar na sala" : "Sala encerrada"}
            </button>
            {error && (
              <p className="room-invitation-error" role="alert">
                {error}
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="room-invitation-loading" role="status">
          <BookOpen size={24} aria-hidden="true" />
          <span>{error || "Carregando convite…"}</span>
        </div>
      )}
      {open && <RoomJoinDialog code={code} onClose={() => setOpen(false)} />}
    </article>
  );
}

export function RoomInvitationPreview({ text }: { text: string }) {
  // Server has no browser origin. React uses the empty server snapshot for hydration.
  const origin = useSyncExternalStore(
    subscribeOrigin,
    browserOrigin,
    serverOrigin,
  );
  const codes = origin ? roomInvitationCodes(text, origin) : [];
  if (!codes.length) return null;
  return (
    <div className="room-invitation-previews">
      {codes.map((code) => (
        <InvitationCard key={code} code={code} />
      ))}
    </div>
  );
}

const subscribeOrigin = () => () => {};
const browserOrigin = () => window.location.origin;
const serverOrigin = () => "";
