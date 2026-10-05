"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { AcademicEntry } from "@enturma/contracts";
import { api, post } from "@/lib/api";
import { useRideUpdates } from "@/lib/use-ride-updates";
import type { Match, Ride } from "@/lib/ride-types";
import { Shell } from "./shell";
import { Feedback } from "./feedback";
import { RideSearchPanel } from "./ride-activity";
import { Voice } from "./room-tools";
import { UserIdentity, type PublicProfile } from "./user-identity";
import { RideMatchCelebration } from "./ride-match-celebration";
import {
  ApproximateLocationButton,
  RidePreferences,
  RideSuggestions,
  RideTripPanel,
} from "./ride-mobility";
import { rideAccept, rideEnter, ridePanel } from "@/lib/ride-motion";

export function Rides({ create = false }: { create?: boolean }) {
  const router = useRouter();
  const [rides, setRides] = useState<Ride[]>([]);
  const [mine, setMine] = useState<Ride[]>([]);
  const [entries, setEntries] = useState<AcademicEntry[]>([]);
  const [campuses, setCampuses] = useState<AcademicEntry[]>([]);
  const [allCampuses, setAllCampuses] = useState<AcademicEntry[]>([]);
  const [institution, setInstitution] = useState("");
  const [me, setMe] = useState("");
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    accuracyMeters: number;
  }>();
  const [suggestRide, setSuggestRide] = useState<Ride>();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const [available, owned, institutions, campusList, user] = await Promise.all([
      api<Ride[]>("/rides", { cache: "no-store" }),
      api<Ride[]>("/rides/mine", { cache: "no-store" }),
      api<AcademicEntry[]>("/academics?kind=INSTITUTION"),
      api<AcademicEntry[]>("/academics?kind=CAMPUS"),
      api<{ id: string }>("/users/me"),
    ]);
    setRides(available);
    setMine(owned);
    setEntries(institutions);
    setAllCampuses(campusList);
    setMe(user.id);
  }, []);

  useEffect(() => {
    void load().catch((e) => setError(e.message));
  }, [load]);

  const live = useRideUpdates(async () => {
    try {
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  });

  useEffect(() => {
    if (!institution) {
      setCampuses([]);
      return;
    }
    let active = true;
    api<AcademicEntry[]>(`/academics?kind=CAMPUS&parentId=${institution}`)
      .then((rows) => {
        if (active) setCampuses(rows);
      })
      .catch((e) => setError(e.message));
    return () => {
      active = false;
    };
  }, [institution]);

  useEffect(() => {
    listRef.current
      ?.querySelectorAll(".ride-list-item")
      .forEach((node, index) => rideEnter(node, index));
  }, [rides, mine]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formElement = e.currentTarget;
    setBusy(true);
    setError("");
    setSuccess("");
    const f = new FormData(e.currentTarget);
    const departure = new Date(String(f.get("departure")));
    if (!Number.isFinite(departure.getTime())) {
      setBusy(false);
      setError("Confira a data e o horário de saída.");
      return;
    }
    try {
      const created = await post<{ id: string }>("/rides", {
        campusId: f.get("campus"),
        type: f.get("type"),
        originArea: f.get("area"),
        direction: f.get("direction"),
        departureAt: departure.toISOString(),
        seats: Number(f.get("seats")),
        areaLat: location?.lat ?? null,
        areaLng: location?.lng ?? null,
        areaAccuracyMeters: location?.accuracyMeters ?? null,
      });
      const owned = await api<Ride[]>("/rides/mine", { cache: "no-store" });
      setMine(owned);
      setSuggestRide(owned.find((ride) => ride.id === created.id));
      setSuccess(
        location
          ? "Carona publicada com região aproximada para melhorar o matching."
          : "Carona publicada. Você já pode procurar combinações.",
      );
      rideAccept(formElement);
      if (create) router.replace("/caronas");
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      <div className="narrow ride-page" ref={listRef}>
        <h1>{create ? "Publique sua rota." : "Enturma Caronas"}</h1>
        <p className="lead">
          Mobilidade universitária com matching por campus, horário e região,
          sem publicar seu endereço residencial.
        </p>
        <p className="ride-live-status" role="status">
          {live
            ? "Caronas atualizadas em tempo real"
            : "Reconectando · atualização automática ativa"}
        </p>
        <div className="actions">
          {!create ? (
            <Link href="/caronas/create" className="button">
              Publicar carona
            </Link>
          ) : (
            <Link href="/caronas">Voltar às caronas</Link>
          )}
          <Link href="/caronas/matches">Meus matches</Link>
        </div>
        <Feedback error={error} success={success} />

        {create ? (
          <form className="ride-create-form" onSubmit={submit}>
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
                onChange={(event) => setInstitution(event.target.value)}
              >
                <option value="">Selecione</option>
                {entries.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Campus
              <select required name="campus" key={institution}>
                <option value="">Selecione</option>
                {campuses.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Bairro ou região de origem
              <input name="area" required maxLength={120} />
              <small>
                O Enturma mostra somente esta região na descoberta. Coordenadas
                opcionais são usadas internamente para proximidade.
              </small>
            </label>
            <ApproximateLocationButton onLocation={setLocation} />
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
            <button disabled={busy}>
              {busy ? "Publicando…" : "Publicar e procurar combinações"}
            </button>
          </form>
        ) : (
          <>
            <RideSearchPanel />
            <section className="ride-mobility-section">
              <div className="ride-section-heading">
                <div>
                  <h2>Caronas disponíveis</h2>
                  <p>
                    Ofertas e pedidos ativos. O matching automático fica ainda
                    mais preciso quando os dois lados adicionam localização
                    aproximada.
                  </p>
                </div>
              </div>
              {rides.filter((ride) => ride.ownerId !== me).length === 0 ? (
                <div className="empty">
                  <h3>Nenhuma carona disponível.</h3>
                  <p>
                    Publique sua rota para o Enturma procurar estudantes
                    compatíveis.
                  </p>
                </div>
              ) : (
                rides
                  .filter((ride) => ride.ownerId !== me)
                  .map((ride) => (
                    <article
                      key={ride.id}
                      className="room-row ride-list-item"
                    >
                      <div>
                        <h3>
                          {ride.originArea} · {ride.campusName}
                        </h3>
                        <p>
                          {ride.name ?? "Estudante"} ·{" "}
                          {ride.type === "OFFER"
                            ? "Oferece carona"
                            : "Procura carona"}
                        </p>
                        <small>
                          {new Date(ride.departureAt).toLocaleString("pt-BR")} ·{" "}
                          {ride.type === "OFFER"
                            ? `${Math.max(0, ride.seats - (ride.acceptedSeats ?? 0))} vaga(s)`
                            : "Pedido de carona"}
                          {ride.ownerRating
                            ? ` · ★ ${Number(ride.ownerRating).toFixed(1)}`
                            : ""}
                        </small>
                        {ride.vehicleBrand ? (
                          <small className="ride-vehicle-line">
                            {ride.vehicleBrand} {ride.vehicleModel} ·{" "}
                            {ride.vehicleColor}
                          </small>
                        ) : null}
                      </div>
                      <button
                        disabled={busy}
                        onClick={async (event) => {
                          const card = event.currentTarget.closest(".ride-list-item");
                          setBusy(true);
                          try {
                            const result = await post<{
                              id: string;
                              status: string;
                            }>(`/rides/${ride.id}/interest`);
                            rideAccept(card);
                            setSuccess(
                              result.status === "WAITLISTED"
                                ? "A carona está lotada. Você entrou na lista de espera."
                                : "Interesse enviado. Aguarde a confirmação.",
                            );
                            router.push(`/caronas/matches?match=${result.id}`);
                          } catch (e) {
                            setError((e as Error).message);
                          } finally {
                            setBusy(false);
                          }
                        }}
                      >
                        Tenho interesse
                      </button>
                    </article>
                  ))
              )}
            </section>

            <section className="ride-mobility-section">
              <div className="ride-section-heading">
                <div>
                  <h2>Minhas publicações</h2>
                  <p>
                    Procure combinações automáticas ou acompanhe as vagas da sua
                    rota.
                  </p>
                </div>
              </div>
              {mine.map((ride) => (
                <article
                  key={ride.id}
                  className="room-row ride-list-item"
                >
                  <div>
                    <h3>
                      {ride.originArea} · {ride.campusName}
                    </h3>
                    <small>
                      {ride.status} ·{" "}
                      {new Date(ride.departureAt).toLocaleString("pt-BR")} ·{" "}
                      {ride.acceptedSeats ?? 0} confirmado(s)
                      {(ride.waitlistedSeats ?? 0) > 0
                        ? ` · ${ride.waitlistedSeats} em espera`
                        : ""}
                    </small>
                  </div>
                  {ride.status === "OPEN" ? (
                    <div className="actions">
                      <button
                        onClick={(event) => {
                          setSuggestRide(ride);
                          rideAccept(
                            event.currentTarget.closest(".ride-list-item"),
                          );
                        }}
                      >
                        Encontrar combinações
                      </button>
                      <button
                        className="secondary"
                        onClick={async () => {
                          if (!window.confirm("Cancelar esta publicação?"))
                            return;
                          await post(`/rides/${ride.id}/cancel`);
                          await load();
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
            </section>

            {suggestRide ? (
              <RideSuggestions
                source={suggestRide}
                onConnected={(matchId, status) => {
                  setSuccess(
                    status === "WAITLISTED"
                      ? "Você entrou na lista de espera desta carona."
                      : "Pedido enviado para a outra pessoa confirmar.",
                  );
                  router.push(`/caronas/matches?match=${matchId}`);
                }}
              />
            ) : null}

            <RidePreferences campuses={allCampuses} onChanged={load} />
          </>
        )}
      </div>
    </Shell>
  );
}

export function Matches() {
  const params = useSearchParams();
  const requestedMatch = params.get("match");
  const [matches, setMatches] = useState<Match[]>([]);
  const [me, setMe] = useState("");
  const [selected, setSelected] = useState<Match>();
  const [messages, setMessages] = useState<
    (PublicProfile & { userId: string; body: string })[]
  >([]);
  const [celebration, setCelebration] = useState<{
    driver: PublicProfile;
    passenger: PublicProfile;
    area: string;
  }>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const selectionVersion = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const [items, user] = await Promise.all([
      api<Match[]>("/matches", { cache: "no-store" }),
      api<{ id: string }>("/users/me"),
    ]);
    setMatches(items);
    setMe(user.id);
    setSelected((previous) => {
      if (!previous) return previous;
      const current = items.find((item) => item.id === previous.id);
      if (!current) setMessages([]);
      return current;
    });
  }, []);

  useEffect(() => {
    void load().catch((e) => setError(e.message));
  }, [load]);

  useEffect(() => {
    listRef.current
      ?.querySelectorAll(".ride-match-row")
      .forEach((node, index) => rideEnter(node, index));
  }, [matches]);

  const live = useRideUpdates(async () => {
    const version = selectionVersion.current;
    try {
      const items = await api<Match[]>("/matches", { cache: "no-store" });
      if (version !== selectionVersion.current) return;
      setMatches(items);
      if (!selected?.id) return;
      const updated = items.find((item) => item.id === selected.id);
      setSelected(updated);
      if (updated?.status === "ACCEPTED" && !updated.deletedAt) {
        const chat = await api<
          (PublicProfile & { userId: string; body: string })[]
        >(`/matches/${updated.id}/messages`, { cache: "no-store" });
        if (version === selectionVersion.current) setMessages(chat);
      }
    } catch (e) {
      setError((e as Error).message);
    }
  });

  const open = useCallback(async (match: Match) => {
    const version = ++selectionVersion.current;
    setSelected(match);
    if (match.status !== "ACCEPTED" || match.deletedAt) {
      setMessages([]);
      return;
    }
    try {
      const chat = await api<
        (PublicProfile & { userId: string; body: string })[]
      >(`/matches/${match.id}/messages`, { cache: "no-store" });
      if (version === selectionVersion.current) {
        setMessages(chat);
        setError("");
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    if (!requestedMatch || !matches.length) return;
    const match = matches.find((item) => item.id === requestedMatch);
    if (match) void open(match);
  }, [requestedMatch, matches, open]);

  async function change(
    match: Match,
    action: "cancel" | "close" | "delete",
  ) {
    const prompts = {
      cancel:
        "Cancelar este match? A vaga será liberada e a conversa será encerrada.",
      close:
        "Encerrar a conversa? O histórico será excluído automaticamente após o prazo de retenção.",
      delete:
        "Excluir o histórico privado para os dois participantes? Esta ação não pode ser desfeita.",
    };
    if (!window.confirm(prompts[action])) return;
    setBusy(true);
    setError("");
    ++selectionVersion.current;
    try {
      await api(
        `/matches/${match.id}/${action === "delete" ? "conversation" : action}`,
        { method: action === "delete" ? "DELETE" : "POST" },
      );
      await load();
      if (selected?.id === match.id) {
        if (action === "delete" || action === "cancel") {
          setSelected(undefined);
          setMessages([]);
        }
      }
      setSuccess(
        action === "delete"
          ? "Conversa excluída."
          : action === "cancel"
            ? "Match cancelado. Se havia lista de espera, o próximo pedido foi reaberto."
            : "Conversa encerrada.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const closed =
    !!selected && (!!selected.closedAt || selected.rideStatus !== "OPEN");

  const labels: Record<string, string> = {
    PENDING: "Aguardando confirmação",
    WAITLISTED: "Lista de espera",
    ACCEPTED: "Confirmado",
    CANCELLED: "Cancelado",
    REJECTED: "Recusado",
    NO_SHOW: "Não compareceu",
  };

  return (
    <Shell>
      <div className="narrow ride-page" ref={listRef}>
        <h1>Seus encontros pelo caminho.</h1>
        <p className="ride-live-status" role="status">
          {live
            ? "Conectado · mudanças aparecem em tempo real"
            : "Conectando · atualização automática ativa"}
        </p>
        <div className="actions">
          <Link href="/caronas">Encontrar caronas</Link>
          <Link href="/caronas/create">Publicar outra carona</Link>
        </div>
        <Feedback error={error} success={success} />

        {matches.length === 0 ? (
          <div className="empty">
            <h2>Nenhum match ainda.</h2>
            <p>
              Publique sua rota para o Enturma procurar combinações
              automaticamente.
            </p>
          </div>
        ) : (
          matches.map((match) => {
            const peer =
              match.driverId === me
                ? match.passengerName
                : match.driverName;
            return (
              <article
                className="room-row ride-match-row"
                key={match.id}
              >
                <div>
                  <h3>{peer}</h3>
                  <p>
                    {match.originArea} → {match.campusName}
                  </p>
                  <small>
                    {labels[match.status] ?? match.status} ·{" "}
                    {new Date(match.departureAt).toLocaleString("pt-BR")}
                    {match.peerRating
                      ? ` · ★ ${Number(match.peerRating).toFixed(1)}`
                      : ""}
                  </small>
                  {match.vehicleBrand ? (
                    <small className="ride-vehicle-line">
                      {match.vehicleBrand} {match.vehicleModel} ·{" "}
                      {match.vehicleColor}
                    </small>
                  ) : null}
                </div>
                <div className="actions ride-match-actions">
                  {match.status === "PENDING" &&
                  match.requestedBy !== me ? (
                    <button
                      disabled={busy}
                      onClick={async (event) => {
                        const card = event.currentTarget.closest(".ride-match-row");
                        setBusy(true);
                        try {
                          await post(`/matches/${match.id}/accept`);
                          rideAccept(card);
                          await load();
                          const updated = (
                            await api<Match[]>("/matches", {
                              cache: "no-store",
                            })
                          ).find((item) => item.id === match.id);
                          if (updated?.status === "ACCEPTED") {
                            const [driver, passenger] = await Promise.all([
                              api<PublicProfile>(
                                `/users/${updated.driverId}/profile`,
                              ).catch(() => ({
                                id: updated.driverId,
                                name: updated.driverName,
                              })),
                              api<PublicProfile>(
                                `/users/${updated.passengerId}/profile`,
                              ).catch(() => ({
                                id: updated.passengerId,
                                name: updated.passengerName,
                              })),
                            ]);
                            setCelebration({
                              driver,
                              passenger,
                              area: updated.originArea,
                            });
                            await open(updated);
                          }
                        } catch (e) {
                          setError((e as Error).message);
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      Aceitar combinação
                    </button>
                  ) : match.status === "ACCEPTED" && !match.deletedAt ? (
                    <button onClick={() => void open(match)}>
                      {match.closedAt ? "Ver histórico" : "Abrir carona"}
                    </button>
                  ) : match.status === "WAITLISTED" ? (
                    <small>A vaga será oferecida se alguém cancelar.</small>
                  ) : null}
                  {match.rideStatus === "OPEN" &&
                  ["PENDING", "WAITLISTED", "ACCEPTED"].includes(
                    match.status,
                  ) ? (
                    <button
                      className="secondary"
                      disabled={busy}
                      onClick={() => void change(match, "cancel")}
                    >
                      Cancelar match
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })
        )}

        {selected?.status === "ACCEPTED" ? (
          <>
            <RideTripPanel
              match={selected}
              me={me}
              companions={matches.filter(
                (item) =>
                  item.rideId === selected.rideId &&
                  item.status === "ACCEPTED" &&
                  !item.deletedAt,
              )}
              onRefresh={async () => {
                await load();
                const updated = (
                  await api<Match[]>("/matches", { cache: "no-store" })
                ).find((item) => item.id === selected.id);
                if (updated) setSelected(updated);
              }}
            />
            <section
              className="chat ride-chat"
              ref={(node) => {
                if (node) ridePanel(node);
              }}
            >
              <Voice
                key={selected.id}
                roomId={selected.id}
                ended={closed}
                endpoint={`/matches/${selected.id}/voice`}
              />
              <h2>Conversa privada da carona</h2>
              <div className="actions">
                {!closed ? (
                  <button
                    className="secondary"
                    disabled={busy}
                    onClick={() => void change(selected, "close")}
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
                <p role="status">Conversa encerrada.</p>
              ) : (
                <>
                  <form
                    onSubmit={async (event) => {
                      event.preventDefault();
                      const formElement = event.currentTarget;
                      const point = new FormData(formElement).get("point");
                      try {
                        await api(
                          `/matches/${selected.id}/meeting-point`,
                          {
                            method: "PUT",
                            body: JSON.stringify({ point }),
                          },
                        );
                        await load();
                        setSuccess("Ponto de encontro atualizado.");
                        rideAccept(formElement);
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                  >
                    <label>
                      Ponto privado combinado
                      <input
                        name="point"
                        maxLength={500}
                        required
                        defaultValue={selected.meetingPoint ?? ""}
                      />
                    </label>
                    <button>Salvar ponto</button>
                  </form>
                  <div className="messages">
                    {[...messages].reverse().map((message) => (
                      <div className="message" key={message.id}>
                        <UserIdentity
                          user={{ ...message, id: message.userId }}
                        />
                        <p>{message.body}</p>
                      </div>
                    ))}
                  </div>
                  <form
                    onSubmit={async (event) => {
                      event.preventDefault();
                      const form = event.currentTarget;
                      try {
                        await post(`/matches/${selected.id}/messages`, {
                          body: new FormData(form).get("message"),
                        });
                        form.reset();
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
                        onKeyDown={(event) => {
                          if (
                            event.key === "Enter" &&
                            !event.shiftKey &&
                            !event.nativeEvent.isComposing
                          ) {
                            event.preventDefault();
                            event.currentTarget.form?.requestSubmit();
                          }
                        }}
                      />
                    </label>
                    <button>Enviar</button>
                  </form>
                </>
              )}
              <button
                className="text-button"
                disabled={busy}
                onClick={() => void change(selected, "delete")}
              >
                Excluir histórico privado
              </button>
            </section>
          </>
        ) : null}

        {celebration ? (
          <RideMatchCelebration
            owner={celebration.driver}
            passenger={celebration.passenger}
            area={celebration.area}
            onClose={() => setCelebration(undefined)}
            onChat={() => setCelebration(undefined)}
          />
        ) : null}
      </div>
    </Shell>
  );
}
