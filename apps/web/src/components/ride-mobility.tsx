"use client";

import {
  AlertTriangle,
  Car,
  Clock3,
  LocateFixed,
  MapPin,
  Navigation,
  Route,
  ShieldCheck,
  Star,
  UserCheck,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AcademicEntry } from "@enturma/contracts";
import { api, post } from "@/lib/api";
import { matchLevelLabel, tripStatusLabel } from "@/lib/ride-labels";
import {
  animateRouteLine,
  rideAccept,
  rideEnter,
  ridePanel,
  ridePulse,
  rideStatus,
} from "@/lib/ride-motion";
import type {
  Match,
  PeerLocation,
  PickupZone,
  Ride,
  RideRecurrence,
  RideSuggestion,
  RideVehicle,
  SafetyShare,
} from "@/lib/ride-types";

function localTime(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function locate(): Promise<{
  lat: number;
  lng: number;
  accuracyMeters: number;
}> {
  if (!navigator.geolocation)
    return Promise.reject(
      new Error("Localização não está disponível neste dispositivo."),
    );
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracyMeters: Math.round(position.coords.accuracy || 0),
        }),
      (error) =>
        reject(
          new Error(
            error.code === error.PERMISSION_DENIED
              ? "Permita a localização para usar o matching por proximidade."
              : "Não foi possível obter sua localização agora.",
          ),
        ),
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 120000 },
    );
  });
}

export function ApproximateLocationButton({
  onLocation,
}: {
  onLocation: (value: {
    lat: number;
    lng: number;
    accuracyMeters: number;
  }) => void;
}) {
  const [label, setLabel] = useState("Usar localização aproximada");
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <button
      ref={ref}
      type="button"
      className="secondary"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const value = await locate();
          onLocation(value);
          setLabel("Localização aproximada adicionada");
          rideAccept(ref.current);
        } catch (error) {
          setLabel((error as Error).message);
          rideStatus(ref.current);
        } finally {
          setBusy(false);
        }
      }}
    >
      <LocateFixed size={17} />
      {busy ? "Localizando…" : label}
    </button>
  );
}

export function RideSuggestions({
  source,
  onConnected,
}: {
  source: Ride;
  onConnected: (matchId: string, status: string) => void;
}) {
  const [items, setItems] = useState<RideSuggestion[]>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    api<RideSuggestion[]>(`/rides/${source.id}/suggestions`, {
      cache: "no-store",
    })
      .then((rows) => {
        if (active) setItems(rows);
      })
      .catch((e) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [source.id]);

  useEffect(() => {
    root.current
      ?.querySelectorAll(".ride-suggestion")
      .forEach((node, index) => rideEnter(node, index));
  }, [items]);

  return (
    <section className="ride-mobility-section" ref={root}>
      <div className="ride-section-heading">
        <div>
          <h2>Combinações para sua rota</h2>
          <p>
            O Enturma cruza campus, direção, horário, região, vagas, bloqueios e
            reputação. A compatibilidade explica os motivos em vez de prometer
            segurança.
          </p>
        </div>
        <Route size={24} aria-hidden="true" />
      </div>
      {error ? <p className="feedback error">{error}</p> : null}
      {!items ? (
        <p>Procurando estudantes com rota compatível…</p>
      ) : items.length === 0 ? (
        <div className="empty">
          <h3>Nenhuma combinação boa por enquanto.</h3>
          <p>
            Sua publicação continua ativa e novas opções aparecem em tempo real.
          </p>
        </div>
      ) : (
        <div className="ride-suggestions">
          {items.map((item) => (
            <article className="ride-suggestion" key={item.id}>
              <div className="ride-suggestion-main">
                <div className="ride-match-level">{matchLevelLabel(item.matchLevel)}</div>
                <h3>{item.ownerName}</h3>
                <p>
                  {item.originArea} → {item.campusName}
                </p>
                <small>{localTime(item.departureAt)}</small>
                <div className="ride-reasons">
                  {item.reasons.map((reason) => (
                    <span key={reason}>{reason}</span>
                  ))}
                </div>
              </div>
              <div className="ride-suggestion-facts">
                {item.distanceKm != null ? (
                  <span>
                    <Navigation size={15} /> {item.distanceKm} km
                  </span>
                ) : null}
                {item.estimatedDetourMinutes != null ? (
                  <span>
                    <Clock3 size={15} /> ~{item.estimatedDetourMinutes} min
                  </span>
                ) : null}
                {item.verifiedStudent ? (
                  <span>
                    <UserCheck size={15} /> Estudante cadastrado
                  </span>
                ) : null}
                {item.rating > 0 ? (
                  <span>
                    <Star size={15} /> {item.rating.toFixed(1)} ({item.reviews})
                  </span>
                ) : null}
                {item.vehicle ? (
                  <span>
                    <Car size={15} /> {item.vehicle}
                  </span>
                ) : null}
                <span>
                  <Users size={15} />{" "}
                  {item.full
                    ? "Lotada · lista de espera"
                    : `${item.availableSeats} vaga(s)`}
                </span>
              </div>
              <button
                disabled={busy === item.id}
                onClick={async (event) => {
                  const card = event.currentTarget.closest("article");
                  setBusy(item.id);
                  setError("");
                  try {
                    const result = await post<{ id: string; status: string }>(
                      `/rides/${source.id}/suggestions/${item.id}/connect`,
                    );
                    rideAccept(card);
                    onConnected(result.id, result.status);
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy("");
                  }
                }}
              >
                {busy === item.id
                  ? "Conectando…"
                  : item.full
                    ? "Entrar na lista de espera"
                    : "Solicitar esta carona"}
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function RidePreferences({
  campuses,
  onChanged,
}: {
  campuses: AcademicEntry[];
  onChanged?: () => void;
}) {
  const [vehicle, setVehicle] = useState<RideVehicle>({});
  const [recurrences, setRecurrences] = useState<RideRecurrence[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    accuracyMeters: number;
  }>();

  const load = useCallback(async () => {
    const [v, r] = await Promise.all([
      api<RideVehicle>("/rides/vehicle", { cache: "no-store" }),
      api<RideRecurrence[]>("/rides/recurrences", { cache: "no-store" }),
    ]);
    setVehicle(v);
    setRecurrences(r);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load().catch((e) => setError(e.message));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <section className="ride-mobility-section">
      <div className="ride-section-heading">
        <div>
          <h2>Minha mobilidade</h2>
          <p>
            Veículo e rotina ficam salvos para facilitar caronas recorrentes.
            Placa completa nunca é exibida na descoberta.
          </p>
        </div>
        <Car size={24} aria-hidden="true" />
      </div>
      {error ? <p className="feedback error">{error}</p> : null}
      {message ? <p className="feedback success">{message}</p> : null}
      <div className="ride-preferences-grid">
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const formElement = event.currentTarget;
            const form = new FormData(formElement);
            try {
              setVehicle(
                await api<RideVehicle>("/rides/vehicle", {
                  method: "PUT",
                  body: JSON.stringify({
                    brand: form.get("brand"),
                    model: form.get("model"),
                    color: form.get("color"),
                    modelYear: form.get("year")
                      ? Number(form.get("year"))
                      : null,
                    seats: Number(form.get("seats")),
                    plateHint: form.get("plate"),
                  }),
                }),
              );
              setMessage("Perfil do veículo atualizado.");
              rideAccept(formElement);
              onChanged?.();
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          <h3>Veículo</h3>
          <label>
            Marca
            <input
              name="brand"
              required
              maxLength={60}
              defaultValue={vehicle.brand ?? ""}
              key={`brand-${vehicle.brand ?? ""}`}
            />
          </label>
          <label>
            Modelo
            <input
              name="model"
              required
              maxLength={80}
              defaultValue={vehicle.model ?? ""}
              key={`model-${vehicle.model ?? ""}`}
            />
          </label>
          <div className="form-row">
            <label>
              Cor
              <input
                name="color"
                required
                maxLength={40}
                defaultValue={vehicle.color ?? ""}
                key={`color-${vehicle.color ?? ""}`}
              />
            </label>
            <label>
              Ano
              <input
                name="year"
                type="number"
                min={1980}
                max={2100}
                defaultValue={vehicle.modelYear ?? ""}
                key={`year-${vehicle.modelYear ?? ""}`}
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Vagas
              <input
                name="seats"
                type="number"
                min={1}
                max={8}
                defaultValue={vehicle.seats ?? 3}
                required
              />
            </label>
            <label>
              Identificação parcial
              <input
                name="plate"
                maxLength={8}
                placeholder="Ex.: •••1A23"
                defaultValue={vehicle.plateHint ?? ""}
                key={`plate-${vehicle.plateHint ?? ""}`}
              />
            </label>
          </div>
          <button>Salvar veículo</button>
        </form>

        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const formElement = event.currentTarget;
            const form = new FormData(formElement);
            const weekdays = form
              .getAll("weekday")
              .map((value) => Number(value));
            try {
              await post("/rides/recurrences", {
                campusId: form.get("campus"),
                type: form.get("type"),
                originArea: form.get("area"),
                direction: form.get("direction"),
                localTime: form.get("time"),
                timezone:
                  Intl.DateTimeFormat().resolvedOptions().timeZone ||
                  "America/Sao_Paulo",
                weekdays,
                seats: Number(form.get("seats")),
                areaLat: location?.lat ?? null,
                areaLng: location?.lng ?? null,
                areaAccuracyMeters: location?.accuracyMeters ?? null,
              });
              setMessage(
                "Rotina criada. As próximas caronas serão geradas automaticamente.",
              );
              rideAccept(formElement);
              await load();
              onChanged?.();
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          <h3>Rotina universitária</h3>
          <label>
            Campus
            <select name="campus" required defaultValue="">
              <option value="">Selecione</option>
              {campuses.map((campus) => (
                <option key={campus.id} value={campus.id}>
                  {campus.name}
                </option>
              ))}
            </select>
          </label>
          <div className="form-row">
            <label>
              Tipo
              <select name="type">
                <option value="OFFER">Ofereço carona</option>
                <option value="REQUEST">Procuro carona</option>
              </select>
            </label>
            <label>
              Direção
              <select name="direction">
                <option value="TO_CAMPUS">Indo ao campus</option>
                <option value="FROM_CAMPUS">Saindo do campus</option>
              </select>
            </label>
          </div>
          <label>
            Bairro ou região
            <input name="area" maxLength={120} required />
          </label>
          <div className="form-row">
            <label>
              Horário
              <input name="time" type="time" required />
            </label>
            <label>
              Vagas
              <input
                name="seats"
                type="number"
                min={1}
                max={8}
                defaultValue={1}
              />
            </label>
          </div>
          <fieldset className="ride-weekdays">
            <legend>Dias da semana</legend>
            {[
              [1, "Seg"],
              [2, "Ter"],
              [3, "Qua"],
              [4, "Qui"],
              [5, "Sex"],
              [6, "Sáb"],
              [7, "Dom"],
            ].map(([value, label]) => (
              <label key={value}>
                <input type="checkbox" name="weekday" value={value} />
                {label}
              </label>
            ))}
          </fieldset>
          <ApproximateLocationButton onLocation={setLocation} />
          <button>Criar rotina</button>
        </form>
      </div>
      {recurrences.length ? (
        <div className="ride-recurrence-list">
          {recurrences.map((item, index) => (
            <article
              key={item.id}
              ref={(node) => {
                rideEnter(node, index);
              }}
            >
              <div>
                <strong>{item.campusName}</strong>
                <p>
                  {item.originArea} · {String(item.localTime).slice(0, 5)} ·{" "}
                  {item.weekdays}
                </p>
              </div>
              {item.active ? (
                <button
                  className="secondary"
                  onClick={async () => {
                    await api(`/rides/recurrences/${item.id}`, {
                      method: "DELETE",
                    });
                    await load();
                  }}
                >
                  Desativar
                </button>
              ) : (
                <small>Desativada</small>
              )}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function nextDriverStatus(status: Match["tripStatus"]) {
  const map: Partial<
    Record<Match["tripStatus"], { status: Match["tripStatus"]; label: string }>
  > = {
    SCHEDULED: { status: "DRIVER_ON_THE_WAY", label: "Iniciar deslocamento" },
    MATCHING: { status: "DRIVER_ON_THE_WAY", label: "Iniciar deslocamento" },
    DRIVER_ON_THE_WAY: { status: "ARRIVING", label: "Estou chegando" },
    ARRIVING: {
      status: "WAITING_PASSENGER",
      label: "Cheguei ao ponto",
    },
    WAITING_PASSENGER: { status: "IN_PROGRESS", label: "Iniciar viagem" },
    IN_PROGRESS: { status: "ARRIVED", label: "Chegamos ao destino" },
    ARRIVED: { status: "COMPLETED", label: "Concluir carona" },
  };
  return map[status];
}

function RideRouteMap({ location }: { location?: PeerLocation }) {
  const path = useRef<SVGPathElement>(null);
  useEffect(() => {
    animateRouteLine(path.current);
  }, [location?.lat, location?.lng]);
  return (
    <div className="ride-live-map" aria-label="Acompanhamento visual da rota">
      <svg viewBox="0 0 400 160" role="img">
        <path
          ref={path}
          d="M35 125 C100 15 245 150 365 35"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="35" cy="125" r="8" />
        <circle cx="365" cy="35" r="8" />
      </svg>
      <div className="ride-live-map-copy">
        {location?.available ? (
          <>
            <strong>
              {location.distanceKm != null
                ? `${location.distanceKm} km de distância`
                : "Localização recebida"}
            </strong>
            <small>
              {location.etaMinutes
                ? `Chegada aproximada em ${location.etaMinutes} min`
                : "Atualização ao vivo disponível"}
            </small>
            {location.lat != null && location.lng != null ? (
              <a
                href={`https://www.openstreetmap.org/?mlat=${encodeURIComponent(location.lat)}&mlon=${encodeURIComponent(location.lng)}#map=17/${encodeURIComponent(location.lat)}/${encodeURIComponent(location.lng)}`}
                target="_blank"
                rel="noreferrer"
              >
                Abrir posição no mapa
              </a>
            ) : null}
          </>
        ) : (
          <>
            <strong>Aguardando localização compartilhada</strong>
            <small>
              A posição só aparece durante a carona e com consentimento.
            </small>
          </>
        )}
      </div>
    </div>
  );
}

export function RideTripPanel({
  match,
  me,
  companions = [],
  onRefresh,
}: {
  match: Match;
  me: string;
  companions?: Match[];
  onRefresh: () => Promise<void>;
}) {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [location, setLocation] = useState<PeerLocation>();
  const [zones, setZones] = useState<PickupZone[]>([]);
  const [boarding, setBoarding] = useState(match.boardingCode ?? "");
  const [share, setShare] = useState<SafetyShare>();
  const [watching, setWatching] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const watchId = useRef<number | undefined>(undefined);
  const lastLocationSent = useRef(0);
  const root = useRef<HTMLElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const isDriver = match.driverId === me;
  const isPassenger = match.passengerId === me;
  const peerId = isDriver ? match.passengerId : match.driverId;
  const peerName = isDriver ? match.passengerName : match.driverName;
  const next = nextDriverStatus(match.tripStatus);
  const liveAllowed = [
    "DRIVER_ON_THE_WAY",
    "ARRIVING",
    "WAITING_PASSENGER",
    "IN_PROGRESS",
  ].includes(match.tripStatus);

  const refreshLocation = useCallback(async () => {
    try {
      setLocation(
        await api<PeerLocation>(`/matches/${match.id}/location`, {
          cache: "no-store",
        }),
      );
    } catch {}
  }, [match.id]);

  useEffect(() => {
    ridePanel(root.current);
  }, [match.id]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void Promise.all([
        api<PickupZone[]>(
          `/rides/campuses/${match.campusId}/pickup-zones`,
          { cache: "no-store" },
        ).then(setZones),
        refreshLocation(),
      ]);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [match.campusId, refreshLocation]);

  useEffect(() => {
    rideStatus(statusRef.current);
  }, [match.tripStatus]);

  useEffect(
    () => () => {
      if (watchId.current != null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = undefined;
        void api(`/matches/${match.id}/location`, { method: "DELETE" }).catch(
          () => {},
        );
      }
    },
    [match.id],
  );

  useEffect(() => {
    if (liveAllowed || watchId.current == null) return;
    navigator.geolocation.clearWatch(watchId.current);
    watchId.current = undefined;
    setWatching(false);
    void api(`/matches/${match.id}/location`, { method: "DELETE" }).catch(
      () => {},
    );
  }, [liveAllowed, match.id]);

  async function startSharingLocation() {
    if (!liveAllowed) {
      setError(
        "A localização ao vivo fica disponível quando o motorista iniciar o deslocamento.",
      );
      return;
    }
    if (!navigator.geolocation) {
      setError("Este dispositivo não oferece localização.");
      return;
    }
    setWatching(true);
    ridePulse(statusRef.current);
    lastLocationSent.current = 0;
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        if (now - lastLocationSent.current < 8000) return;
        lastLocationSent.current = now;
        void api(`/matches/${match.id}/location`, {
          method: "PUT",
          body: JSON.stringify({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracyMeters: Math.round(position.coords.accuracy || 0),
          }),
        })
          .then(refreshLocation)
          .catch((failure) => {
            setError((failure as Error).message);
          });
      },
      (failure) => {
        setWatching(false);
        setError(
          failure.code === failure.PERMISSION_DENIED
            ? "Permita a localização para compartilhar o andamento."
            : "Não foi possível atualizar sua localização.",
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      },
    );
  }

  async function stopSharingLocation() {
    if (watchId.current != null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = undefined;
    }
    setWatching(false);
    await api(`/matches/${match.id}/location`, { method: "DELETE" });
  }

  return (
    <section className="ride-trip-panel" ref={root}>
      <div className="ride-trip-hero">
        <div>
          <small>Carona com {peerName}</small>
          <h2>
            {match.originArea} → {match.campusName}
          </h2>
          <p>{localTime(match.departureAt)}</p>
        </div>
        <div className="ride-trip-status" ref={statusRef}>
          {tripStatusLabel(match.tripStatus)}
        </div>
      </div>
      {error ? <p className="feedback error">{error}</p> : null}
      {message ? <p className="feedback success">{message}</p> : null}

      <RideRouteMap location={location} />

      <div className="ride-trip-grid">
        <div>
          <h3>Confirmação</h3>
          <p>
            Motorista: {match.driverConfirmed ? "confirmado" : "aguardando"} ·
            Passageiro:{" "}
            {match.passengerConfirmed ? "confirmado" : "aguardando"}
          </p>
          {!(
            (isDriver && match.driverConfirmed) ||
            (isPassenger && match.passengerConfirmed)
          ) ? (
            <button
              onClick={async (event) => {
                const button = event.currentTarget;
                await post(`/matches/${match.id}/confirm`);
                rideAccept(button);
                await onRefresh();
              }}
            >
              Confirmar participação
            </button>
          ) : null}
          {isPassenger && match.status === "ACCEPTED" ? (
            <button
              className="secondary"
              onClick={async () => {
                const result = await api<{ code: string }>(
                  `/matches/${match.id}/boarding-code`,
                  { cache: "no-store" },
                );
                setBoarding(result.code);
              }}
            >
              Ver código de embarque
            </button>
          ) : null}
          {boarding && isPassenger ? (
            <div className="ride-boarding-code">
              <small>Código de embarque</small>
              <strong>{boarding}</strong>
            </div>
          ) : null}
          {isDriver && !match.boardedAt ? (
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                const formElement = event.currentTarget;
                const code = new FormData(formElement).get("code");
                try {
                  await post(`/matches/${match.id}/board`, { code });
                  setMessage("Embarque confirmado.");
                  rideAccept(formElement);
                  await onRefresh();
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              <label>
                Código do passageiro
                <input
                  name="code"
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  maxLength={4}
                  required
                />
              </label>
              <button>Confirmar embarque</button>
            </form>
          ) : null}
        </div>

        <div>
          <h3>Ponto de encontro</h3>
          <p>{match.meetingPoint ?? "Ainda não combinado"}</p>
          {zones.length ? (
            <div className="ride-zone-list">
              {zones.map((zone) => (
                <button
                  className="secondary"
                  key={zone.id}
                  onClick={async (event) => {
                    const button = event.currentTarget;
                    await api(`/matches/${match.id}/meeting-zone`, {
                      method: "PUT",
                      body: JSON.stringify({ zoneId: zone.id }),
                    });
                    rideAccept(button);
                    await onRefresh();
                  }}
                >
                  <MapPin size={15} /> {zone.name}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <h3>Localização ao vivo</h3>
          <p>
            Só funciona durante o deslocamento e para os participantes do match.
            O Enturma apaga posições antigas automaticamente.
          </p>
          {!liveAllowed ? (
            <small>
              Disponível quando o motorista iniciar o deslocamento.
            </small>
          ) : watching ? (
            <button
              className="secondary"
              onClick={() => void stopSharingLocation()}
            >
              Parar compartilhamento
            </button>
          ) : (
            <button onClick={() => void startSharingLocation()}>
              <LocateFixed size={16} /> Compartilhar durante a carona
            </button>
          )}
          <button
            className="text-button"
            onClick={() => void refreshLocation()}
          >
            Atualizar posição de {peerName}
          </button>
        </div>

        <div>
          <h3>Segurança</h3>
          <p>
            Gere um link temporário para um contato de confiança acompanhar esta
            carona.
          </p>
          <button
            onClick={async (event) => {
              const button = event.currentTarget;
              const result = await post<SafetyShare>(
                `/matches/${match.id}/safety-share`,
              );
              setShare(result);
              rideAccept(button);
            }}
          >
            <ShieldCheck size={16} /> Criar link de acompanhamento
          </button>
          {share ? (
            <div className="ride-safety-share">
              <input
                readOnly
                value={`${locationOrigin()}${share.path}`}
                aria-label="Link de acompanhamento"
              />
              <button
                className="secondary"
                onClick={() =>
                  void navigator.clipboard.writeText(
                    `${locationOrigin()}${share.path}`,
                  )
                }
              >
                Copiar
              </button>
            </div>
          ) : null}
          <button
            className="text-button"
            onClick={async () => {
              const reason = prompt(
                `Explique brevemente o problema com ${peerName}.`,
              );
              if (!reason?.trim()) return;
              await post("/reports", { targetId: peerId, reason });
              setMessage("Denúncia enviada à moderação.");
            }}
          >
            <AlertTriangle size={15} /> Denunciar
          </button>
          <button
            className="text-button"
            onClick={async () => {
              if (!confirm(`Bloquear ${peerName}?`)) return;
              await post(`/blocks/${peerId}`);
              setMessage("Usuário bloqueado.");
            }}
          >
            Bloquear usuário
          </button>
          <button
            className="text-button"
            onClick={async () => {
              try {
                await post(`/matches/${match.id}/no-show`);
                setMessage("Não comparecimento registrado.");
                await onRefresh();
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            Registrar no-show
          </button>
        </div>
      </div>

      {isDriver && companions.length > 1 ? (
        <section className="ride-stops">
          <h3>Ordem de embarque</h3>
          <p>
            Organize as paradas da mesma viagem. Os chats continuam privados
            entre motorista e cada passageiro.
          </p>
          {[...companions]
            .sort(
              (a, b) =>
                (a.pickupOrder ?? 99) - (b.pickupOrder ?? 99) ||
                a.passengerName.localeCompare(b.passengerName),
            )
            .map((companion, index, ordered) => (
              <div className="ride-stop-row" key={companion.id}>
                <span>
                  <strong>{index + 1}. {companion.passengerName}</strong>
                  <small>{companion.meetingPoint ?? "Ponto ainda não combinado"}</small>
                </span>
                <span className="actions">
                  <button
                    className="secondary"
                    disabled={index === 0}
                    aria-label={`Subir ${companion.passengerName}`}
                    onClick={async (event) => {
                      const button = event.currentTarget;
                      const nextOrder = [...ordered];
                      [nextOrder[index - 1], nextOrder[index]] = [
                        nextOrder[index],
                        nextOrder[index - 1],
                      ];
                      await post(`/rides/${match.rideId}/stops`, {
                        matchIds: nextOrder.map((item) => item.id),
                      });
                      rideAccept(button);
                      await onRefresh();
                    }}
                  >
                    ↑
                  </button>
                  <button
                    className="secondary"
                    disabled={index === ordered.length - 1}
                    aria-label={`Descer ${companion.passengerName}`}
                    onClick={async (event) => {
                      const button = event.currentTarget;
                      const nextOrder = [...ordered];
                      [nextOrder[index], nextOrder[index + 1]] = [
                        nextOrder[index + 1],
                        nextOrder[index],
                      ];
                      await post(`/rides/${match.rideId}/stops`, {
                        matchIds: nextOrder.map((item) => item.id),
                      });
                      rideAccept(button);
                      await onRefresh();
                    }}
                  >
                    ↓
                  </button>
                </span>
              </div>
            ))}
        </section>
      ) : null}

      {isDriver && next && match.rideStatus === "OPEN" ? (
        <div className="ride-driver-controls">
          <button
            onClick={async (event) => {
              const button = event.currentTarget;
              try {
                await post(`/rides/${match.rideId}/status`, {
                  status: next.status,
                });
                rideAccept(button);
                await onRefresh();
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            {next.label}
          </button>
        </div>
      ) : null}

      {match.rideStatus === "COMPLETED" && !reviewed ? (
        <form
          className="ride-review"
          onSubmit={async (event) => {
            event.preventDefault();
            const formElement = event.currentTarget;
            const form = new FormData(formElement);
            try {
              await post(`/matches/${match.id}/review`, {
                rating: Number(form.get("rating")),
                punctuality: Number(form.get("punctuality")),
                communication: Number(form.get("communication")),
                respect: Number(form.get("respect")),
                responsible: form.get("responsible") === "yes",
                comment: form.get("comment"),
              });
              setReviewed(true);
              setMessage("Avaliação registrada.");
              rideAccept(formElement);
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          <h3>Avaliar experiência</h3>
          <div className="ride-review-grid">
            {[
              ["rating", "Geral"],
              ["punctuality", "Pontualidade"],
              ["communication", "Comunicação"],
              ["respect", "Respeito"],
            ].map(([name, label]) => (
              <label key={name}>
                {label}
                <select name={name} defaultValue="5">
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option value={value} key={value}>
                      {value} estrelas
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          {isPassenger ? (
            <label>
              Condução responsável?
              <select name="responsible" defaultValue="yes">
                <option value="yes">Sim</option>
                <option value="no">Não</option>
              </select>
            </label>
          ) : null}
          <label>
            Comentário opcional
            <textarea name="comment" maxLength={800} />
          </label>
          <button>Avaliar</button>
        </form>
      ) : null}
    </section>
  );
}

function locationOrigin() {
  return typeof window === "undefined" ? "" : window.location.origin;
}
