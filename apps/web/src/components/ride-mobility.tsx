"use client";

import {
  Car,
  Clock3,
  LocateFixed,
  MapPin,
  Navigation,
  Route,
  Star,
  UserCheck,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AcademicEntry } from "@enturma/contracts";
import { api, post } from "@/lib/api";
import { RideMatchExperience } from "./ride-match-experience";
import { matchLevelLabel, tripStatusLabel } from "@/lib/ride-labels";
import {
  animateRouteLine,
  rideAccept,
  rideEnter,
  rideStatus,
} from "@/lib/ride-motion";
import type {
  Match,
  PeerLocation,
  Ride,
  RideRecurrence,
  RideSuggestion,
  RideVehicle,
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
  mode = "DRIVER",
}: {
  campuses: AcademicEntry[];
  onChanged?: () => void;
  mode?: "PASSENGER" | "DRIVER";
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
      <div className="ride-section-heading ride-profile-heading">
        <div>
          <span className="ride-profile-kicker">
            {mode === "DRIVER" ? "Perfil do motorista" : "Perfil do passageiro"}
          </span>
          <h2>
            {mode === "DRIVER"
              ? "Seu carro e suas rotas"
              : "Seus trajetos universitários"}
          </h2>
          <p>
            {mode === "DRIVER"
              ? "Cadastre o veículo que aparece após o match e deixe suas rotinas prontas para ficar disponível com poucos toques."
              : "Salve rotinas para encontrar motoristas mais rápido. Endereço residencial e ponto de campus continuam privados até a corrida exigir a rota."}
          </p>
        </div>
        {mode === "DRIVER" ? <Car size={26} aria-hidden="true" /> : null}
      </div>
      {error ? <p className="feedback error">{error}</p> : null}
      {message ? <p className="feedback success">{message}</p> : null}
      <div className="ride-preferences-grid">
        {mode === "DRIVER" ? (
        <form
          className="ride-vehicle-profile-card"
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
          <button className="ride-profile-save">Salvar veículo</button>
        </form>
        ) : (
          <div className="ride-passenger-profile-card">
            <div className="ride-passenger-profile-icon" aria-hidden="true">✦</div>
            <div>
              <h3>Perfil pronto para pedir carona</h3>
              <p>
                O Enturma usa seu campus e o ponto escolhido no mapa somente para
                calcular e combinar sua rota com motoristas compatíveis.
              </p>
            </div>
          </div>
        )}

        <form
          className="ride-routine-profile-card"
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
          <h3>{mode === "DRIVER" ? "Rotina como motorista" : "Rotina como passageiro"}</h3>
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
              <select name="type" defaultValue={mode === "DRIVER" ? "OFFER" : "REQUEST"}>
                {mode === "DRIVER" ? (
                  <option value="OFFER">Ofereço carona</option>
                ) : (
                  <option value="REQUEST">Procuro carona</option>
                )}
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
  return (
    <RideMatchExperience
      match={match}
      me={me}
      companions={companions}
      onRefresh={onRefresh}
    />
  );
}

function locationOrigin() {
  return typeof window === "undefined" ? "" : window.location.origin;
}
