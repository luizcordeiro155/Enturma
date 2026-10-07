"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Users, Clock, ArrowRight, GraduationCap } from "lucide-react";
import type { Profile, Room } from "@enturma/contracts";
import { api, post } from "@/lib/api";
import { Shell } from "./shell";
import { Feedback, Loading } from "./feedback";
import { useRouter } from "next/navigation";
import { CatalogSearch } from "./catalog-search";
import { ForumHighlights } from "./forum-highlights";
import { StudyJourney } from "./study-journey";
import { useLiveRefresh } from "@/lib/live-updates";
import { EnturmaIntroExperience } from "./intro/enturma-intro-experience";
export function Dashboard() {
  const [profile, setProfile] = useState<Profile>();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(0);
  const router = useRouter();
  const [now] = useState(() => Date.now());
  useEffect(() => {
    let alive = true;
    Promise.all([
      api<Profile>("/users/me"),
      api<Room[]>(`/study-rooms?page=${page}`),
    ])
      .then(([p, r]) => {
        if (alive) {
          setProfile(p);
          setRooms(r);
          setError("");
        }
      })
      .catch((e) => {
        if (e.status === 401) router.replace("/login");
        else if (alive) setError(e.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [router, page]);
  async function refreshRooms() {
    const next = await api<Room[]>(`/study-rooms?page=${page}`, { cache: "no-store" });
    setRooms(next);
  }
  useLiveRefresh("rooms_changed", refreshRooms, 12000);

  async function join(id: string) {
    try {
      await post(`/study-rooms/${id}/join`);
      router.push(`/rooms/${id}`);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <Shell>
      <div className="dashboard-grid">
        <div className="dashboard-main">
          <div className="dashboard-intro">
            <h1>
              <>Seu próximo estudo<br />começa em boa companhia.</>
            </h1>
            <p className="lead">
              Encontre sua matéria, entre em uma turma e aprenda junto.
            </p>
            <Feedback error={error} />
            <CatalogSearch />
            {profile && !profile.enrollment ? (
              <section className="onboarding-banner">
                <BookOpen size={44} />
                <div>
                  <h2>Vamos encontrar a sua turma</h2>
                  <p>Complete seu perfil acadêmico para começar.</p>
                </div>
                <Link className="button" href="/onboarding">
                  Completar perfil
                </Link>
              </section>
            ) : profile ? (
              <section className="onboarding-banner">
                <BookOpen size={40} />
                <div>
                  <h2>Vamos estudar, {profile.name.split(" ")[0]}?</h2>
                  <p>Suas matérias conectam você à próxima turma.</p>
                </div>
                <Link className="button" href="/rooms/new">
                  Estudar agora
                </Link>
              </section>
            ) : null}
          </div>
          {profile ? (
            <EnturmaIntroExperience profile={profile} />
          ) : null}
          {profile ? (
            <section id="minhas-materias" tabIndex={-1} className="home-subjects-section">
              <div className="section-heading">
                <div>
                  <span className="home-section-kicker">
                    <GraduationCap size={16} />
                    Seu semestre
                  </span>
                  <h2>Minhas matérias</h2>
                </div>
                <Link className="button secondary" href="/onboarding">
                  Atualizar matérias
                </Link>
              </div>
              {profile.subjects.length ? (
                <div className="home-subjects-grid">
                  {profile.subjects.map((subject) => (
                    <article key={subject.id} className="home-subject-card">
                      <div className="subject-mark">
                        <BookOpen />
                      </div>
                      <div>
                        <h3>
                          <Link href={`/subjects/${subject.id}`}>
                            {subject.name}
                          </Link>
                        </h3>
                        <small>{subject.sourceName}</small>
                      </div>
                      <Link className="button secondary" href="/rooms/new">
                        Estudar
                      </Link>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty compact">
                  <GraduationCap size={34} />
                  <div>
                    <h3>Escolha suas matérias</h3>
                    <p>
                      Elas ficam no Início e conectam você a salas, conteúdos e colegas.
                    </p>
                  </div>
                  <Link className="button" href="/onboarding">
                    Selecionar matérias
                  </Link>
                </div>
              )}
            </section>
          ) : null}
          <div className="dashboard-community">
            <div className="section-heading">
              <h2>Salas acontecendo agora</h2>
              {rooms.length ? (
                <Link href="/rooms/new">
                  Estudar agora <ArrowRight size={16} />
                </Link>
              ) : null}
            </div>
            <label className="home-room-filter">Filtrar salas<input
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Busque pelo assunto ou objetivo"
                /></label>
            {loading ? (
              <Loading />
            ) : !error && rooms.length === 0 ? (
              <section className="empty">
                <BookOpen size={52} />
                <h3>Ainda não há salas abertas.</h3>
                <p>Escolha uma matéria para começar a primeira turma.</p>
                <Link
                  className="button"
                  href={profile?.enrollment ? "/rooms/new" : "/onboarding"}
                >
                  Estudar agora
                </Link>
              </section>
            ) : (
              <div className="room-list">
                {rooms
                  .filter((r) =>
                    `${r.title} ${r.subjectName}`
                      .toLocaleLowerCase()
                      .includes(filter.toLocaleLowerCase()),
                  )
                  .map((r) => (
                    <article key={r.id} className="room-row">
                      <div className="subject-mark">
                        <BookOpen />
                      </div>
                      <div>
                        <h3>{r.subjectName}</h3>
                        <p>{r.title}</p>
                        <small>
                          <Users size={14} />
                          {r.participants} estudantes <Clock size={14} />
                          {Math.max(
                            0,
                            Math.ceil((Date.parse(r.endsAt) - now) / 60000),
                          )}{" "}
                          min restantes
                        </small>
                      </div>
                      <button
                        className="button secondary"
                        onClick={() => join(r.id)}
                      >
                        Entrar na turma
                      </button>
                    </article>
                  ))}
              </div>
            )}
            <div className="actions home-room-pages">
                <button
                  disabled={page === 0}
                  onClick={() => {
                    setLoading(true);
                    setPage((p) => p - 1);
                  }}
                >
                  Anterior
                </button>
                <span>Página {page + 1}</span>
                <button
                  disabled={rooms.length < 30}
                  onClick={() => {
                    setLoading(true);
                    setPage((p) => p + 1);
                  }}
                >
                  Próxima
                </button>
              </div>
            <ForumHighlights />
          </div>
        </div>
        {profile ? <StudyJourney enrolled={!!profile.enrollment} /> : null}
      </div>
    </Shell>
  );
}
