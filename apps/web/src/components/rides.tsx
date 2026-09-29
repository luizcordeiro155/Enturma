"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { AcademicEntry } from "@enturma/contracts";
import { api, post } from "@/lib/api";
import { Shell } from "./shell";
import { Feedback } from "./feedback";
type Ride = {
  id: string;
  ownerId: string;
  name: string;
  campusName: string;
  originArea: string;
  departureAt: string;
  seats: number;
  type: string;
  status: string;
  direction: string;
};
type Match = {
  id: string;
  rideId: string;
  userId: string;
  ownerId: string;
  status: string;
  rideStatus: string;
  meetingPoint: string | null;
  originArea: string;
  passengerName: string;
  ownerName: string;
  departureAt: string;
};
export function Rides({ create = false }: { create?: boolean }) {
  const [rides, setRides] = useState<Ride[]>([]);
  const [mine, setMine] = useState<Ride[]>([]);
  const [entries, setEntries] = useState<AcademicEntry[]>([]);
  const [campuses, setCampuses] = useState<AcademicEntry[]>([]);
  const [institution, setInstitution] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    Promise.all([
      api<Ride[]>("/rides"),
      api<Ride[]>("/rides/mine"),
      api<AcademicEntry[]>("/academics?kind=INSTITUTION"),
    ])
      .then(([r, m, e]) => {
        setRides(r);
        setMine(m);
        setEntries(e);
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    if (!institution) return;
    let active = true;
    api<AcademicEntry[]>(`/academics?kind=CAMPUS&parentId=${institution}`)
      .then((r) => {
        if (active) setCampuses(r);
      })
      .catch((e) => setError(e.message));
    return () => {
      active = false;
    };
  }, [institution]);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      await post("/rides", {
        campusId: f.get("campus"),
        type: f.get("type"),
        originArea: f.get("area"),
        direction: f.get("direction"),
        departureAt: new Date(String(f.get("departure"))).toISOString(),
        seats: Number(f.get("seats")),
      });
      setSuccess("Carona publicada. Acompanhe os pedidos em Meus matches.");
      setMine(await api<Ride[]>("/rides/mine"));
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
          {create
            ? "O caminho também pode ser em companhia."
            : "Enturma Caronas"}
        </h1>
        <p className="lead">
          Conecte-se com estudantes que fazem um caminho parecido com o seu.
        </p>
        <div className="actions">
          <Link href="/caronas/create" className="button">
            Publicar carona
          </Link>
          <Link href="/caronas/matches">Meus matches</Link>
        </div>
        <Feedback error={error} success={success} />
        {create ? (
          <form onSubmit={submit}>
            <label>
              O que você precisa?
              <select name="type">
                <option value="OFFER">Ofereço carona</option>
                <option value="REQUEST">Procuro carona</option>
              </select>
            </label>
            <label>
              Universidade
              <select
                required
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
              >
                <option value="">Selecione</option>
                {entries.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Campus
              <select required name="campus" key={institution}>
                <option value="">Selecione</option>
                {campuses.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Bairro ou região de origem
              <input name="area" required maxLength={120} />
              <small>
                Informe somente a região. O ponto exato é combinado em privado
                após o aceite.
              </small>
            </label>
            <label>
              Direção
              <select name="direction">
                <option value="TO_CAMPUS">Indo para o campus</option>
                <option value="FROM_CAMPUS">Saindo do campus</option>
              </select>
            </label>
            <div className="form-row">
              <label>
                Saída
                <input name="departure" type="datetime-local" required />
              </label>
              <label>
                Vagas
                <input
                  name="seats"
                  type="number"
                  min={1}
                  max={8}
                  defaultValue={1}
                  required
                />
              </label>
            </div>
            <button disabled={busy}>{busy ? "Publicando…" : "Publicar"}</button>
          </form>
        ) : (
          <>
            {rides.length === 0 && !error ? (
              <div className="empty">
                <h2>Nenhuma carona disponível.</h2>
                <p>Publique seu trajeto e encontre companhia para o caminho.</p>
              </div>
            ) : (
              rides.map((r) => (
                <article key={r.id} className="room-row">
                  <div>
                    <h3>
                      {r.originArea} · {r.campusName}
                    </h3>
                    <p>
                      {r.name} ·{" "}
                      {r.type === "OFFER" ? "Oferece carona" : "Procura carona"}
                    </p>
                    <small>
                      {new Date(r.departureAt).toLocaleString("pt-BR")} ·{" "}
                      {r.seats} vaga(s)
                    </small>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        await post(`/rides/${r.id}/interest`);
                        setSuccess(
                          "Interesse registrado. Aguarde o aceite em Meus matches.",
                        );
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                  >
                    Tenho interesse
                  </button>
                </article>
              ))
            )}
          </>
        )}
        <h2 className="section-heading">Minhas caronas</h2>
        {mine.map((r) => (
          <article key={r.id} className="room-row">
            <div>
              <h3>
                {r.originArea} · {r.campusName}
              </h3>
              <small>
                {r.status} · {new Date(r.departureAt).toLocaleString("pt-BR")}
              </small>
            </div>
            {r.status === "OPEN" ? (
              <div className="actions">
                <button
                  onClick={async () => {
                    try {
                      await post(`/rides/${r.id}/complete`);
                      setMine(await api("/rides/mine"));
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  Concluir
                </button>
                <button
                  onClick={async () => {
                    if (!window.confirm("Cancelar esta carona?")) return;
                    try {
                      await post(`/rides/${r.id}/cancel`);
                      setMine(await api("/rides/mine"));
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  Cancelar
                </button>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </Shell>
  );
}
export function Matches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [me, setMe] = useState("");
  const [selected, setSelected] = useState<Match>();
  const [messages, setMessages] = useState<
    { id: string; name: string; body: string }[]
  >([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  useEffect(() => {
    Promise.all([api<Match[]>("/matches"), api<{ id: string }>("/users/me")])
      .then(([m, p]) => {
        setMatches(m);
        setMe(p.id);
      })
      .catch((e) => setError(e.message));
  }, []);
  async function open(m: Match) {
    try {
      setMessages(await api(`/matches/${m.id}/messages`));
      setSelected(m);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <Shell>
      <div className="narrow">
        <h1>Seus encontros pelo caminho.</h1>
        <p className="lead">
          O ponto de encontro e a conversa ficam disponíveis após o aceite.
        </p>
        <Feedback error={error} success={success} />
        {matches.length === 0 ? (
          <p>Nenhum pedido de carona por aqui.</p>
        ) : (
          matches.map((m) => (
            <article className="room-row" key={m.id}>
              <div>
                <h3>{m.originArea}</h3>
                <p>
                  {m.ownerId === me ? m.passengerName : m.ownerName} ·{" "}
                  {m.status}
                </p>
                <small>{new Date(m.departureAt).toLocaleString("pt-BR")}</small>
              </div>
              {m.status === "PENDING" && m.ownerId === me ? (
                <button
                  onClick={async () => {
                    try {
                      await post(`/matches/${m.id}/accept`);
                      setMatches(await api("/matches"));
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  Aceitar
                </button>
              ) : m.status === "ACCEPTED" ? (
                <button onClick={() => open(m)}>Conversa privada</button>
              ) : null}
            </article>
          ))
        )}
        {selected ? (
          <section className="chat">
            <h2>
              Conversa com{" "}
              {selected.ownerId === me
                ? selected.passengerName
                : selected.ownerName}
            </h2>
            <p>
              Ponto de encontro:{" "}
              {selected.meetingPoint ?? "Ainda não combinado"}
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const point = new FormData(e.currentTarget).get("point");
                try {
                  await api(`/matches/${selected.id}/meeting-point`, {
                    method: "PUT",
                    body: JSON.stringify({ point }),
                  });
                  setSelected({ ...selected, meetingPoint: String(point) });
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              <label>
                Ponto privado
                <input name="point" maxLength={500} required />
              </label>
              <button>Salvar ponto</button>
            </form>
            <div className="messages">
              {[...messages].reverse().map((m) => (
                <div className="message" key={m.id}>
                  <strong>{m.name}</strong>
                  <p>{m.body}</p>
                </div>
              ))}
            </div>
            <button className="text-button" onClick={() => open(selected)}>
              Atualizar conversa
            </button>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const f = e.currentTarget;
                try {
                  await post(`/matches/${selected.id}/messages`, {
                    body: new FormData(f).get("message"),
                  });
                  f.reset();
                  await open(selected);
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              <label>
                Mensagem
                <textarea name="message" required maxLength={2000} />
              </label>
              <button>Enviar</button>
            </form>
            {selected.rideStatus === "COMPLETED" ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await post(`/matches/${selected.id}/review`, {
                      rating: Number(
                        new FormData(e.currentTarget).get("rating"),
                      ),
                    });
                    setSuccess("Avaliação registrada.");
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                <label>
                  Avaliar experiência
                  <select name="rating">
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {n} estrelas
                      </option>
                    ))}
                  </select>
                </label>
                <button>Avaliar</button>
              </form>
            ) : null}
          </section>
        ) : null}
      </div>
    </Shell>
  );
}
