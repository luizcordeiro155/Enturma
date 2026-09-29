"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { AcademicEntry, Profile, Room } from "@enturma/contracts";
import { api, post } from "@/lib/api";
import { Shell } from "./shell";
import { Feedback } from "./feedback";
export function StudyForm() {
  const [profile, setProfile] = useState<Profile>();
  const [subject, setSubject] = useState("");
  const [topics, setTopics] = useState<AcademicEntry[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  useEffect(() => {
    api<Profile>("/users/me")
      .then(setProfile)
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    if (!subject) return;
    let active = true;
    api<AcademicEntry[]>(`/academics?kind=TOPIC&parentId=${subject}`)
      .then((r) => {
        if (active) setTopics(r);
      })
      .catch((e) => setError(e.message));
    return () => {
      active = false;
    };
  }, [subject]);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      const room = await post<Room>("/study-rooms", {
        subjectId: subject,
        topicId: f.get("topic") || null,
        title: f.get("title"),
        minutes: Number(f.get("minutes")),
        maxParticipants: Number(f.get("capacity")),
      });
      router.push(`/rooms/${room.id}${room.reused ? "?reused=1" : ""}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell>
      <div className="narrow">
        <h1>
          O que vamos
          <br />
          estudar agora?
        </h1>
        <p className="lead">
          Se já houver uma turma compatível, você entra nela. Se não, começamos
          uma nova.
        </p>
        <Feedback error={error} />
        {profile && !profile.enrollment ? (
          <div className="empty compact">
            <p>Primeiro, selecione suas matérias.</p>
            <Link className="button" href="/onboarding">
              Completar perfil
            </Link>
          </div>
        ) : (
          <form onSubmit={submit}>
            <label>
              Matéria
              <select
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              >
                <option value="">Escolha uma matéria</option>
                {profile?.subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tópico
              <select name="topic" key={subject}>
                <option value="">Toda a matéria</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Objetivo da sessão
              <input
                name="title"
                required
                maxLength={150}
                placeholder="O que você quer aprender ou revisar?"
              />
            </label>
            <div className="form-row">
              <label>
                Duração
                <select name="minutes" defaultValue="50">
                  {[25, 50, 60, 90, 120, 180].map((n) => (
                    <option key={n} value={n}>
                      {n} minutos
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Participantes
                <input
                  name="capacity"
                  type="number"
                  min={2}
                  max={30}
                  defaultValue={8}
                  required
                />
              </label>
            </div>
            <button className="button" disabled={busy || !subject}>
              {busy ? "Encontrando sua turma…" : "Estudar agora"}
            </button>
          </form>
        )}
      </div>
    </Shell>
  );
}
