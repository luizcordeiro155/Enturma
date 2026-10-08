"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Clock3,
  GraduationCap,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import type { Profile, Room } from "@enturma/contracts";
import { api, post } from "@/lib/api";
import { useLiveRefresh } from "@/lib/live-updates";
import { Feedback, Loading } from "./feedback";
import { Shell } from "./shell";

type RecommendedRoom = Room & {
  recommendationReason?: "SUBJECT" | "COURSE" | "RELATED";
};

function remainingLabel(endsAt: string) {
  const minutes = Math.max(
    0,
    Math.ceil((Date.parse(endsAt) - Date.now()) / 60000),
  );
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.ceil(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.ceil(hours / 24)}d`;
}

export function StudyRoomsDiscovery() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>();
  const [rooms, setRooms] = useState<RecommendedRoom[]>([]);
  const [query, setQuery] = useState("");
  const [joining, setJoining] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [me, result] = await Promise.all([
        api<Profile>("/users/me", { cache: "no-store" }),
        api<RecommendedRoom[]>("/study-rooms?recommended=true", {
          cache: "no-store",
        }),
      ]);
      setProfile(me);
      setRooms(result);
      setError("");
    } catch (e) {
      const failure = e as Error & { status?: number };
      if (failure.status === 401) {
        router.replace("/login");
        return;
      }
      setError(failure.message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  useLiveRefresh("rooms_changed", load, 12000);
  useLiveRefresh("profile_changed", load, 20000);

  const subjectIds = useMemo(
    () => new Set(profile?.subjects.map((subject) => subject.id) ?? []),
    [profile],
  );

  const relevantRooms = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return rooms
      .filter((room) => {
        const relatedToSelectedSubject = subjectIds.has(room.subjectId);
        const relatedToCourse = room.recommendationReason === "COURSE";
        if (!relatedToSelectedSubject && !relatedToCourse) return false;
        if (!normalized) return true;
        return `${room.title} ${room.subjectName} ${room.topicText ?? ""}`
          .toLocaleLowerCase()
          .includes(normalized);
      })
      .sort((a, b) => {
        const aDirect = subjectIds.has(a.subjectId) ? 0 : 1;
        const bDirect = subjectIds.has(b.subjectId) ? 0 : 1;
        if (aDirect !== bDirect) return aDirect - bDirect;
        return b.participants - a.participants;
      });
  }, [query, rooms, subjectIds]);

  async function join(room: RecommendedRoom) {
    setJoining(room.id);
    setError("");
    try {
      await post(`/study-rooms/${room.id}/join`);
      router.push(`/rooms/${room.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setJoining(undefined);
    }
  }

  return (
    <Shell>
      <section className="rooms-discovery">
        <header className="rooms-discovery-hero">
          <div>
            <span className="rooms-discovery-kicker">
              <Sparkles size={15} />
              Salas de estudo
            </span>
            <h1>Encontre uma sala para estudar agora.</h1>
            <p>
              O Enturma mostra primeiro salas abertas ligadas às suas matérias
              e ao seu curso.
            </p>
          </div>
          <Link className="button rooms-create-button" href="/rooms/new">
            <BookOpen size={17} />
            Criar sala
          </Link>
        </header>

        <Feedback error={error} />

        <section className="rooms-context-card" aria-label="Seu contexto acadêmico">
          <div className="rooms-context-heading">
            <div className="rooms-context-icon" aria-hidden="true">
              <GraduationCap size={22} />
            </div>
            <div>
              <strong>Seu contexto acadêmico</strong>
              <p>
                {profile?.subjects.length
                  ? `${profile.subjects.length} matéria(s) selecionada(s)`
                  : "Selecione suas matérias para personalizar as salas."}
              </p>
            </div>
            <Link href="/onboarding">Atualizar matérias</Link>
          </div>

          {profile?.subjects.length ? (
            <div className="rooms-subject-chips" aria-label="Suas matérias">
              {profile.subjects.map((subject) => (
                <span key={subject.id}>{subject.name}</span>
              ))}
            </div>
          ) : null}
        </section>

        <div className="rooms-list-heading">
          <div>
            <span className="rooms-open-indicator">
              <i aria-hidden="true" />
              Abertas agora
            </span>
            <h2>Salas recomendadas para você</h2>
          </div>

          <label className="rooms-search">
            <Search size={18} aria-hidden="true" />
            <span className="sr-only">Buscar salas</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar matéria ou assunto"
            />
          </label>
        </div>

        {loading ? (
          <Loading />
        ) : relevantRooms.length ? (
          <div className="rooms-discovery-list">
            {relevantRooms.map((room) => {
              const directSubject = subjectIds.has(room.subjectId);
              const full = room.participants >= room.maxParticipants;
              const locked = room.entriesLocked === true;
              const unavailable = full || locked;

              return (
                <article className="rooms-discovery-card" key={room.id}>
                  <div className="rooms-card-top">
                    <div className="rooms-card-main">
                      <span
                        className={
                          directSubject
                            ? "rooms-match-badge direct"
                            : "rooms-match-badge"
                        }
                      >
                        {directSubject ? "Sua matéria" : "Do seu curso"}
                      </span>
                      <h3>{room.title}</h3>
                      <strong>{room.subjectName}</strong>
                      {room.topicText ? <p>{room.topicText}</p> : null}
                    </div>
                    <div className="rooms-card-icon" aria-hidden="true">
                      <BookOpen size={21} />
                    </div>
                  </div>

                  <div className="rooms-card-meta">
                    <span>
                      <Users size={15} />
                      {room.participants}/{room.maxParticipants}
                    </span>
                    <span>
                      <Clock3 size={15} />
                      {remainingLabel(room.endsAt)} restantes
                    </span>
                    {room.lifecycle === "MULTIDAY" ? (
                      <span>Sala contínua</span>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    className="button wide rooms-join-button"
                    disabled={Boolean(joining) || unavailable}
                    onClick={() => void join(room)}
                  >
                    {joining === room.id
                      ? "Entrando..."
                      : locked
                        ? "Entradas encerradas"
                        : full
                          ? "Sala lotada"
                          : "Entrar na sala"}
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <section className="rooms-empty-state">
            <div className="rooms-empty-icon" aria-hidden="true">
              <BookOpen size={28} />
            </div>
            <h2>Nenhuma sala compatível aberta agora</h2>
            <p>
              Quando alguém abrir uma sala das suas matérias ou do seu curso,
              ela aparece aqui automaticamente.
            </p>
            <div>
              <Link className="button" href="/rooms/new">
                Criar uma sala
              </Link>
              {!profile?.subjects.length ? (
                <Link className="button secondary" href="/onboarding">
                  Selecionar matérias
                </Link>
              ) : null}
            </div>
          </section>
        )}
      </section>
    </Shell>
  );
}
