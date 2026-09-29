"use client";
import { UserIdentity, type PublicProfile } from "./user-identity";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { AcademicEntry } from "@enturma/contracts";
import { api, post } from "@/lib/api";
import { Shell } from "./shell";
import { Voice } from "./room-tools";
import { RideMatchCelebration } from "./ride-match-celebration";
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
  closedAt: string | null;
  deletedAt: string | null;
  purgeAt: string | null;
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
  const [seen, setSeen] = useState<string[]>([]);
  const [me, setMe] = useState("");
  const [selected, setSelected] = useState<Match>();
  const [messages, setMessages] = useState<
    (PublicProfile & { userId: string; body: string })[]
  >([]);
  const [busy, setBusy] = useState(false);
  const selectionVersion = useRef(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  useEffect(() => {
    Promise.all([api<Match[]>("/matches"), api<{ id: string }>("/users/me")])
      .then(([m, p]) => {
        setMatches(m);
        setMe(p.id);
        try {
          const stored = JSON.parse(
            localStorage.getItem(`enturma-ride-matches:${p.id}`) || "[]",
          );
          if (Array.isArray(stored))
            setSeen(stored.filter((v) => typeof v === "string"));
        } catch {}
      })
      .catch((e) => setError(e.message));
  }, []);
  const selectedId = selected?.id;
  useEffect(() => {
    let active = true;
    const timer = setInterval(async () => {
      if (document.hidden) return;
      const version = selectionVersion.current;
      try {
        const items = await api<Match[]>("/matches");
        if (!active || version !== selectionVersion.current) return;
        setMatches(items);
        if (!selectedId) return;
        const updated = items.find(
          (m) => m.id === selectedId && m.status === "ACCEPTED" && !m.deletedAt,
        );
        setSelected(updated);
        if (!updated) {
          setMessages([]);
          return;
        }
        const chat = await api<
          (PublicProfile & { userId: string; body: string })[]
        >(`/matches/${updated.id}/messages`);
        if (active && version === selectionVersion.current) setMessages(chat);
      } catch (e) {
        if (active) setError((e as Error).message);
      }
    }, 3000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [selectedId]);
  async function open(m: Match) {
    const version = ++selectionVersion.current;
    try {
      const chat = await api<
        (PublicProfile & { userId: string; body: string })[]
      >(`/matches/${m.id}/messages`);
      if (version !== selectionVersion.current) return;
      setMessages(chat);
      setSelected(m);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function change(m: Match, action: "cancel" | "close" | "delete") {
    const prompts = {
      cancel:
        "Cancelar este match para os dois participantes? A vaga será liberada e mensagens e chamadas serão bloqueadas. O histórico será excluído em 24 horas.",
      close:
        "Encerrar esta conversa para os dois participantes? Mensagens e chamadas serão bloqueadas e o histórico será excluído em 24 horas. A carona continua combinada.",
      delete:
        "Excluir definitivamente esta conversa e o ponto de encontro para os dois participantes? Isso encerra a chamada e não pode ser desfeito. A exclusão não cancela a carona; use Cancelar match para liberar a vaga.",
    };
    if (!window.confirm(prompts[action])) return;
    setBusy(true);
    setError("");
    ++selectionVersion.current;
    try {
      await api(
        `/matches/${m.id}/${action === "delete" ? "conversation" : action}`,
        { method: action === "delete" ? "DELETE" : "POST" },
      );
      const items = await api<Match[]>("/matches");
      setMatches(items);
      if (selected?.id === m.id) {
        const updated = items.find(
          (item) =>
            item.id === m.id && item.status === "ACCEPTED" && !m.deletedAt,
        );
        setSelected(updated);
        if (!updated) setMessages([]);
      }
      setSuccess(
        action === "delete"
          ? "Conversa excluída para os dois participantes."
          : action === "cancel"
            ? "Match cancelado. A vaga foi liberada."
            : "Conversa encerrada. Exclusão automática em 24 horas.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const closed =
    !!selected && (!!selected.closedAt || selected.rideStatus !== "OPEN");
  const celebration = me
    ? matches.find(
        (m) =>
          m.status === "ACCEPTED" &&
          m.rideStatus === "OPEN" &&
          !m.closedAt &&
          !m.deletedAt &&
          !seen.includes(m.id),
      )
    : undefined;
  function dismissMatch(id: string) {
    const next = [...seen, id].slice(-100);
    setSeen(next);
    try {
      localStorage.setItem(`enturma-ride-matches:${me}`, JSON.stringify(next));
    } catch {}
  }
  const labels: Record<string, string> = {
    PENDING: "Aguardando aceite",
    ACCEPTED: "Aceito",
    CANCELLED: "Cancelado",
    REJECTED: "Recusado",
  };
  return (
    <Shell>
      <div className="narrow">
        <h1>Seus encontros pelo caminho.</h1>
        <p className="lead">
          Após o aceite, os dois participantes podem encerrar ou excluir a
          conversa. O histórico é apagado 24 horas após o encerramento.
          Conversas abertas encerram automaticamente 24 horas após a saída.
        </p>
        {celebration ? (
          <RideMatchCelebration
            key={celebration.id}
            owner={{ id: celebration.ownerId, name: celebration.ownerName }}
            passenger={{
              id: celebration.userId,
              name: celebration.passengerName,
            }}
            area={celebration.originArea}
            onClose={() => dismissMatch(celebration.id)}
            onChat={() => {
              dismissMatch(celebration.id);
              void open(celebration);
            }}
          />
        ) : null}
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
                  {labels[m.status] ?? m.status}
                </p>
                <small>{new Date(m.departureAt).toLocaleString("pt-BR")}</small>
              </div>
              <div className="actions ride-match-actions">
                {m.status === "PENDING" && m.ownerId === me ? (
                  <button
                    onClick={async () => {
                      try {
                        await post(`/matches/${m.id}/accept`);
                        setMatches(await api("/matches"));
                        await open({ ...m, status: "ACCEPTED" });
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                  >
                    Aceitar
                  </button>
                ) : m.status === "ACCEPTED" && !m.deletedAt ? (
                  <button onClick={() => open(m)}>
                    {m.closedAt ? "Ver histórico" : "Conversa privada"}
                  </button>
                ) : null}
                {m.rideStatus === "OPEN" &&
                ["PENDING", "ACCEPTED"].includes(m.status) ? (
                  <button
                    className="secondary"
                    disabled={busy}
                    onClick={() => change(m, "cancel")}
                  >
                    Cancelar match
                  </button>
                ) : null}
                {!m.deletedAt ? (
                  <button
                    className="secondary"
                    disabled={busy}
                    onClick={() => change(m, "delete")}
                  >
                    Excluir conversa
                  </button>
                ) : (
                  <small>Conversa excluída. A carona continua combinada.</small>
                )}
              </div>
              {m.purgeAt && !m.deletedAt ? (
                <small className="ride-retention">
                  Exclusão automática:{" "}
                  {new Date(m.purgeAt).toLocaleString("pt-BR")}
                </small>
              ) : null}
            </article>
          ))
        )}
        {selected ? (
          <section className="chat ride-chat">
            <Voice
              key={selected.id}
              roomId={selected.id}
              ended={closed}
              endpoint={`/matches/${selected.id}/voice`}
            />
            <h2>
              Conversa com{" "}
              {selected.ownerId === me
                ? selected.passengerName
                : selected.ownerName}
            </h2>
            <div className="actions">
              {!closed ? (
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() => change(selected, "close")}
                >
                  Encerrar conversa
                </button>
              ) : null}
              <button
                className="text-button"
                onClick={() => {
                  ++selectionVersion.current;
                  setSelected(undefined);
                  setMessages([]);
                }}
              >
                Fechar painel
              </button>
            </div>
            {closed ? (
              <p role="status">
                Conversa encerrada.{" "}
                {selected.purgeAt
                  ? `O histórico será excluído em ${new Date(selected.purgeAt).toLocaleString("pt-BR")}.`
                  : "Aguardando exclusão automática do histórico."}
              </p>
            ) : null}
            <p>
              Ponto de encontro:{" "}
              {selected.meetingPoint ?? "Ainda não combinado"}
            </p>
            {!closed ? (
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
            ) : null}
            <div className="messages">
              {[...messages].reverse().map((m) => (
                <div className="message" key={m.id}>
                  <UserIdentity user={{ ...m, id: m.userId }} />
                  <p>{m.body}</p>
                </div>
              ))}
            </div>
            <button className="text-button" onClick={() => open(selected)}>
              Atualizar conversa
            </button>
            {!closed ? (
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
                  <textarea
                    name="message"
                    required
                    maxLength={2000}
                    disabled={selected.rideStatus !== "OPEN"}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        !e.shiftKey &&
                        !e.nativeEvent.isComposing
                      ) {
                        e.preventDefault();
                        e.currentTarget.form?.requestSubmit();
                      }
                    }}
                  />
                </label>
                <button>Enviar</button>
              </form>
            ) : null}
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
