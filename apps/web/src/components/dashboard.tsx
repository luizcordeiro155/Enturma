"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Users, Clock, ArrowRight } from "lucide-react";
import type { Profile, Room } from "@enturma/contracts";
import { api, post } from "@/lib/api";
import { Shell } from "./shell";
import { Feedback, Loading } from "./feedback";
import { useRouter } from "next/navigation";
import { CatalogSearch } from "./catalog-search";
import { ForumHighlights } from "./forum-highlights";
export function Dashboard({ explore = false }: { explore?: boolean }) {
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
        <div>
          <h1>
            {explore ? (
              "Encontre sua próxima turma."
            ) : (
              <>
                Seu próximo estudo
                <br />
                começa em boa companhia.
              </>
            )}
          </h1>
          <p className="lead">
            Encontre sua matéria, entre em uma turma e aprenda junto.
          </p>
          <Feedback error={error} />
          {explore ? <CatalogSearch /> : null}
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
          <div className="section-heading">
            <h2>Salas acontecendo agora</h2>
            {rooms.length ? (
              <Link href="/rooms/new">
                Estudar agora <ArrowRight size={16} />
              </Link>
            ) : null}
          </div>
          {explore ? (
            <label>
              Filtrar salas nesta página
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Busque pelo assunto ou objetivo"
              />
            </label>
          ) : null}
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
          {explore ? (
            <div className="actions">
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
          ) : null}
          {!explore ? <ForumHighlights /> : null}
        </div>
        <aside className="study-guide">
          <h2>Seu espaço de estudo</h2>
          {[
            ["Escolha sua matéria", "Encontre os temas que você quer estudar."],
            ["Encontre sua turma", "Participe de salas com outros estudantes."],
            [
              "Aprenda em companhia",
              "Troque ideias, tire dúvidas e evolua junto.",
            ],
          ].map(([title, body], i) => (
            <div className="guide-step" key={title}>
              <span>{i + 1}</span>
              <div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            </div>
          ))}
        </aside>
      </div>
    </Shell>
  );
}
