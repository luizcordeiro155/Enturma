"use client";

import {
  Car,
  Check,
  CheckCircle2,
  Copy,
  LocateFixed,
  MapPin,
  Navigation,
  Route,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, post } from "@/lib/api";
import { tripStatusLabel } from "@/lib/ride-labels";
import type { Match, PeerLocation, SafetyShare } from "@/lib/ride-types";
import {
  RideMobilityMap,
  type MapMarker,
  type MapPoint,
} from "./ride-mobility-map";

type RouteResult = {
  distanceMeters: number;
  durationSeconds: number;
  geometry: [number, number][];
};

type FocusMode = "ROUTE" | "ME" | "DRIVER" | "FREE";

const LIVE_STATUSES = [
  "DRIVER_ON_THE_WAY",
  "ARRIVING",
  "WAITING_PASSENGER",
  "IN_PROGRESS",
] as const;

function point(lat?: number | null, lng?: number | null): MapPoint | undefined {
  return lat == null || lng == null ? undefined : { lat, lng };
}

function meters(value?: number) {
  if (value == null) return "";
  return value >= 1000
    ? `${(value / 1000).toFixed(1)} km`
    : `${Math.max(1, Math.round(value))} m`;
}

function minutes(value?: number) {
  if (value == null) return "";
  return `${Math.max(1, Math.round(value / 60))} min`;
}

function distance(a: MapPoint, b: MapPoint) {
  const radius = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function zoomFor(points: MapPoint[]) {
  if (points.length < 2) return 16;
  let longest = 0;
  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1)
      longest = Math.max(longest, distance(points[i], points[j]));
  }
  if (longest > 20) return 10;
  if (longest > 10) return 11;
  if (longest > 5) return 12;
  if (longest > 2.5) return 13;
  if (longest > 1.2) return 14;
  if (longest > 0.5) return 15;
  return 16;
}

function centerOf(points: MapPoint[], fallback?: MapPoint) {
  if (!points.length) return fallback;
  return {
    lat: points.reduce((sum, item) => sum + item.lat, 0) / points.length,
    lng: points.reduce((sum, item) => sum + item.lng, 0) / points.length,
  };
}

function nextDriverStatus(status: Match["tripStatus"]) {
  const next: Partial<
    Record<Match["tripStatus"], { status: Match["tripStatus"]; label: string }>
  > = {
    SCHEDULED: {
      status: "DRIVER_ON_THE_WAY",
      label: "Iniciar deslocamento",
    },
    MATCHING: {
      status: "DRIVER_ON_THE_WAY",
      label: "Iniciar deslocamento",
    },
    DRIVER_ON_THE_WAY: {
      status: "ARRIVING",
      label: "Estou chegando",
    },
    ARRIVING: {
      status: "WAITING_PASSENGER",
      label: "Cheguei ao ponto",
    },
    IN_PROGRESS: {
      status: "ARRIVED",
      label: "Chegamos ao destino",
    },
    ARRIVED: {
      status: "COMPLETED",
      label: "Finalizar carona",
    },
  };
  return next[status];
}

function journeyIndex(status: Match["tripStatus"], boarded?: string | null) {
  if (["COMPLETED", "ARRIVED"].includes(status)) return 4;
  if (status === "IN_PROGRESS") return 3;
  if (boarded) return 3;
  if (status === "WAITING_PASSENGER") return 2;
  if (["DRIVER_ON_THE_WAY", "ARRIVING"].includes(status)) return 1;
  return 0;
}

export function RideMatchExperience({
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
  const isDriver = match.driverId === me;
  const peerName = isDriver ? match.passengerName : match.driverName;
  const peerId = isDriver ? match.passengerId : match.driverId;
  const [peerLocation, setPeerLocation] = useState<PeerLocation>();
  const [selfLocation, setSelfLocation] = useState<MapPoint>();
  const [route, setRoute] = useState<RouteResult>();
  const [focus, setFocus] = useState<FocusMode>("ROUTE");
  const [sharing, setSharing] = useState(false);
  const [meetingPoint, setMeetingPoint] = useState(match.meetingPoint ?? "");
  const [boardingCode, setBoardingCode] = useState(match.boardingCode ?? "");
  const [boardingInput, setBoardingInput] = useState("");
  const [share, setShare] = useState<SafetyShare>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const watchId = useRef<number | undefined>(undefined);
  const lastLocationSent = useRef(0);
  const boardingRequest = useRef(false);

  const liveAllowed = LIVE_STATUSES.includes(
    match.tripStatus as (typeof LIVE_STATUSES)[number],
  );

  const refreshPeer = useCallback(async () => {
    if (!liveAllowed) {
      setPeerLocation(undefined);
      return;
    }
    try {
      setPeerLocation(
        await api<PeerLocation>(`/matches/${match.id}/location`, {
          cache: "no-store",
        }),
      );
    } catch {
      setPeerLocation(undefined);
    }
  }, [liveAllowed, match.id]);

  useEffect(() => {
    const initial = window.setTimeout(() => void refreshPeer(), 0);
    if (!liveAllowed) return () => window.clearTimeout(initial);
    const timer = window.setInterval(() => {
      if (!document.hidden) void refreshPeer();
    }, 4500);
    const visible = () => {
      if (!document.hidden) void refreshPeer();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [liveAllowed, refreshPeer]);

  const stopWatchOnly = useCallback(() => {
    if (watchId.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = undefined;
    }
    setSharing(false);
  }, []);

  const startSharing = useCallback(
    (automatic = false) => {
      if (!liveAllowed || watchId.current != null) return;
      if (!navigator.geolocation) {
        if (!automatic)
          setError("Este dispositivo não oferece localização em tempo real.");
        return;
      }

      setSharing(true);
      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          const current = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setSelfLocation(current);
          const now = Date.now();
          if (now - lastLocationSent.current < 3500) return;
          lastLocationSent.current = now;
          void api(`/matches/${match.id}/location`, {
            method: "PUT",
            body: JSON.stringify({
              lat: current.lat,
              lng: current.lng,
              accuracyMeters: Math.round(position.coords.accuracy || 0),
              speedMps: position.coords.speed,
              heading: position.coords.heading,
              capturedAt: new Date(position.timestamp).toISOString(),
            }),
          })
            .then(() => void refreshPeer())
            .catch((failure) => {
              if (!automatic) setError((failure as Error).message);
            });
        },
        (failure) => {
          stopWatchOnly();
          if (!automatic)
            setError(
              failure.code === failure.PERMISSION_DENIED
                ? "Permita a localização para acompanhar a carona."
                : "Não foi possível acompanhar sua localização.",
            );
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 3500,
        },
      );
    },
    [liveAllowed, match.id, refreshPeer, stopWatchOnly],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (isDriver && liveAllowed && watchId.current == null) startSharing(true);
      if (!liveAllowed) stopWatchOnly();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isDriver, liveAllowed, startSharing, stopWatchOnly]);

  useEffect(
    () => () => {
      if (watchId.current != null && navigator.geolocation)
        navigator.geolocation.clearWatch(watchId.current);
    },
    [],
  );

  async function stopSharing() {
    stopWatchOnly();
    await api(`/matches/${match.id}/location`, { method: "DELETE" }).catch(
      () => {},
    );
  }

  const peerPoint =
    peerLocation?.available &&
    peerLocation.lat != null &&
    peerLocation.lng != null
      ? { lat: peerLocation.lat, lng: peerLocation.lng }
      : undefined;

  const driverFallback = point(match.startLat, match.startLng);
  const pickupPoint =
    point(match.pickupLat, match.pickupLng) ??
    point(match.passengerStartLat, match.passengerStartLng) ??
    driverFallback;
  const destinationPoint =
    point(match.passengerEndLat, match.passengerEndLng) ??
    point(match.endLat, match.endLng);

  const driverPoint = isDriver
    ? selfLocation ?? driverFallback
    : peerPoint ?? driverFallback;
  const passengerPoint = isDriver
    ? peerPoint ?? pickupPoint
    : selfLocation ?? pickupPoint;

  const routeTarget = ["IN_PROGRESS", "ARRIVED", "COMPLETED"].includes(
    match.tripStatus,
  )
    ? destinationPoint
    : pickupPoint;
  const routeSource = driverPoint;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!routeSource || !routeTarget) {
        setRoute(undefined);
        return;
      }
      void post<RouteResult>("/rides/map/route", {
        points: [routeSource, routeTarget],
      })
        .then(setRoute)
        .catch(() => setRoute(undefined));
    }, routeSource && routeTarget ? 220 : 0);
    return () => window.clearTimeout(timer);
  }, [
    match.id,
    match.tripStatus,
    routeSource?.lat,
    routeSource?.lng,
    routeTarget?.lat,
    routeTarget?.lng,
  ]);

  const routeGeometry = useMemo(
    () => route?.geometry.map(([lat, lng]) => ({ lat, lng })) ?? [],
    [route],
  );

  const markers = useMemo<MapMarker[]>(() => {
    const rows: MapMarker[] = [];
    if (driverPoint)
      rows.push({
        id: "driver",
        point: driverPoint,
        kind: "driver",
        heading: isDriver ? undefined : peerLocation?.heading,
        label: match.driverName,
      });
    if (passengerPoint)
      rows.push({
        id: "passenger",
        point: passengerPoint,
        kind: "passenger",
        label: match.passengerName,
      });
    if (pickupPoint)
      rows.push({
        id: "pickup",
        point: pickupPoint,
        kind: "pickup",
        label: "Ponto de embarque",
      });
    if (destinationPoint)
      rows.push({
        id: "destination",
        point: destinationPoint,
        kind: "destination",
        label: match.campusName || "Destino",
      });
    return rows;
  }, [
    driverPoint?.lat,
    driverPoint?.lng,
    passengerPoint?.lat,
    passengerPoint?.lng,
    pickupPoint?.lat,
    pickupPoint?.lng,
    destinationPoint?.lat,
    destinationPoint?.lng,
    isDriver,
    peerLocation?.heading,
    match.driverName,
    match.passengerName,
    match.campusName,
  ]);

  const routePoints = useMemo(
    () =>
      [routeSource, routeTarget].filter(
        (value): value is MapPoint => value != null,
      ),
    [routeSource, routeTarget],
  );

  const ownPoint = isDriver ? driverPoint : passengerPoint;
  const center =
    focus === "ME"
      ? ownPoint
      : focus === "DRIVER"
        ? driverPoint
        : centerOf(routePoints, ownPoint ?? driverPoint ?? pickupPoint);

  const mapZoom =
    focus === "ME" || focus === "DRIVER" ? 16 : zoomFor(routePoints);
  const step = journeyIndex(match.tripStatus, match.boardedAt);
  const next = nextDriverStatus(match.tripStatus);

  async function confirmParticipation() {
    setBusy(true);
    setError("");
    try {
      await post(`/matches/${match.id}/confirm`);
      setMessage("Participação confirmada.");
      await onRefresh();
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function submitBoarding(code: string) {
    if (!isDriver || match.boardedAt || boardingRequest.current) return;
    if (!/^[0-9]{4}$/.test(code)) return;
    boardingRequest.current = true;
    setBusy(true);
    setError("");
    setMessage("Validando código e iniciando a corrida…");
    try {
      await post(`/matches/${match.id}/board`, { code });
      setMessage("Código confirmado. A corrida foi iniciada automaticamente.");
      setBoardingInput("");
      await onRefresh();
    } catch (failure) {
      setMessage("");
      setError((failure as Error).message);
    } finally {
      boardingRequest.current = false;
      setBusy(false);
    }
  }

  async function saveMeetingPoint() {
    if (!meetingPoint.trim()) return;
    setBusy(true);
    try {
      await api(`/matches/${match.id}/meeting-point`, {
        method: "PUT",
        body: JSON.stringify({ point: meetingPoint.trim() }),
      });
      setMessage("Ponto de encontro atualizado.");
      await onRefresh();
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function advanceTrip() {
    if (!next) return;
    setBusy(true);
    setError("");
    try {
      await post(`/rides/${match.rideId}/status`, {
        status: next.status,
      });
      await onRefresh();
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ride-match-experience">
      <header className="ride-match-experience-header">
        <div className="ride-match-person">
          <div className="ride-match-avatar" aria-hidden="true">
            {peerName.trim().slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h2>{peerName}</h2>
            <p>
              {isDriver ? "Passageiro" : "Motorista"}
              {match.peerRating
                ? ` · ★ ${Number(match.peerRating).toFixed(1)}`
                : ""}
            </p>
            {!isDriver && match.vehicleBrand ? (
              <small>
                {match.vehicleBrand} {match.vehicleModel} · {match.vehicleColor}
                {match.plateHint ? ` · ${match.plateHint}` : ""}
              </small>
            ) : null}
          </div>
        </div>
        <div className="ride-match-status-chip">
          <span />
          {tripStatusLabel(match.tripStatus)}
        </div>
      </header>

      {error ? <p className="feedback error">{error}</p> : null}
      {message ? <p className="feedback success">{message}</p> : null}

      {center ? (
        <div className="ride-match-map-stage">
          <RideMobilityMap
            center={center}
            zoom={mapZoom}
            markers={markers}
            route={routeGeometry}
            follow={focus !== "FREE"}
            onInteraction={() => setFocus("FREE")}
            className="ride-match-real-map"
          />
          <div className="ride-match-map-status">
            <strong>
              {match.tripStatus === "IN_PROGRESS"
                ? "Corrida em andamento"
                : match.tripStatus === "WAITING_PASSENGER"
                  ? "Motorista no ponto de embarque"
                  : match.tripStatus === "ARRIVING"
                    ? "Motorista chegando"
                    : match.tripStatus === "DRIVER_ON_THE_WAY"
                      ? "Motorista a caminho"
                      : "Rota da carona"}
            </strong>
            <small>
              {route
                ? `${minutes(route.durationSeconds)} · ${meters(route.distanceMeters)}`
                : peerLocation?.available
                  ? "Localização sendo atualizada"
                  : "Aguardando posição ao vivo"}
            </small>
          </div>
          <div className="ride-match-map-toolbar" aria-label="Foco do mapa">
            <button
              type="button"
              className={focus === "ROUTE" ? "is-active" : ""}
              onClick={() => setFocus("ROUTE")}
            >
              <Route size={17} /> Rota
            </button>
            <button
              type="button"
              className={focus === "ME" ? "is-active" : ""}
              disabled={!ownPoint}
              onClick={() => setFocus("ME")}
            >
              <LocateFixed size={17} /> Você
            </button>
            <button
              type="button"
              className={focus === "DRIVER" ? "is-active" : ""}
              disabled={!driverPoint}
              onClick={() => setFocus("DRIVER")}
            >
              <Car size={17} /> Motorista
            </button>
          </div>
        </div>
      ) : null}

      <div className="ride-match-journey" aria-label="Andamento da carona">
        {[
          "Match confirmado",
          "Motorista a caminho",
          "Embarque",
          "Em viagem",
          "Chegada",
        ].map((label, index) => (
          <div
            className={index <= step ? "is-complete" : ""}
            key={label}
          >
            <span>{index < step ? <Check size={14} /> : index + 1}</span>
            <small>{label}</small>
          </div>
        ))}
      </div>

      <div className="ride-match-detail-grid">
        <section className="ride-match-detail-card ride-match-confirmation-card">
          <div className="ride-match-card-title">
            <CheckCircle2 size={20} />
            <div>
              <h3>Confirmação e embarque</h3>
              <p>
                Motorista {match.driverConfirmed ? "confirmado" : "aguardando"} ·
                Passageiro {match.passengerConfirmed ? "confirmado" : "aguardando"}
              </p>
            </div>
          </div>

          {!(
            (isDriver && match.driverConfirmed) ||
            (!isDriver && match.passengerConfirmed)
          ) ? (
            <button disabled={busy} onClick={() => void confirmParticipation()}>
              Confirmar participação
            </button>
          ) : null}

          {!isDriver && match.status === "ACCEPTED" ? (
            <>
              {!boardingCode ? (
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() =>
                    void api<{ code: string }>(
                      `/matches/${match.id}/boarding-code`,
                      { cache: "no-store" },
                    )
                      .then((result) => setBoardingCode(result.code))
                      .catch((failure) =>
                        setError((failure as Error).message),
                      )
                  }
                >
                  Mostrar código de embarque
                </button>
              ) : (
                <div className="ride-match-boarding-code">
                  <small>Mostre ao motorista</small>
                  <div aria-label={`Código ${boardingCode}`}>
                    {boardingCode.split("").map((digit, index) => (
                      <span key={`${digit}-${index}`}>{digit}</span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}

          {isDriver && !match.boardedAt ? (
            <label className="ride-match-code-input">
              Código do passageiro
              <input
                value={boardingInput}
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{4}"
                maxLength={4}
                placeholder="0000"
                disabled={busy}
                onChange={(event) => {
                  const code = event.target.value.replace(/\D/g, "").slice(0, 4);
                  setBoardingInput(code);
                  setError("");
                  if (code.length === 4)
                    window.setTimeout(() => void submitBoarding(code), 0);
                }}
              />
              <small>
                Ao digitar os 4 números corretos, a corrida começa automaticamente.
              </small>
            </label>
          ) : match.boardedAt ? (
            <div className="ride-match-boarded">
              <CheckCircle2 size={20} />
              Embarque confirmado
            </div>
          ) : null}
        </section>

        <section className="ride-match-detail-card">
          <div className="ride-match-card-title">
            <MapPin size={20} />
            <div>
              <h3>Ponto de encontro</h3>
              <p>{match.meetingPoint || "Defina um ponto fácil de identificar."}</p>
            </div>
          </div>
          <label>
            Local combinado
            <input
              value={meetingPoint}
              maxLength={500}
              placeholder="Ex.: Portaria principal, lado da biblioteca"
              onChange={(event) => setMeetingPoint(event.target.value)}
            />
          </label>
          <button
            className="secondary"
            disabled={busy || !meetingPoint.trim()}
            onClick={() => void saveMeetingPoint()}
          >
            Salvar ponto
          </button>
        </section>

        <section className="ride-match-detail-card">
          <div className="ride-match-card-title">
            <Navigation size={20} />
            <div>
              <h3>Localização ao vivo</h3>
              <p>
                {isDriver
                  ? "Sua posição é enviada durante o deslocamento para o passageiro acompanhar."
                  : "Acompanhe o motorista sem precisar atualizar a página."}
              </p>
            </div>
          </div>
          {liveAllowed ? (
            sharing ? (
              <button className="secondary" onClick={() => void stopSharing()}>
                Parar minha localização
              </button>
            ) : (
              <button onClick={() => startSharing(false)}>
                <LocateFixed size={17} /> Compartilhar minha posição
              </button>
            )
          ) : (
            <small>A localização aparece quando o deslocamento começar.</small>
          )}
          <button className="text-button" onClick={() => void refreshPeer()}>
            Atualizar posição de {peerName}
          </button>
        </section>

        <section className="ride-match-detail-card">
          <div className="ride-match-card-title">
            <ShieldCheck size={20} />
            <div>
              <h3>Segurança</h3>
              <p>Gere um link temporário para um contato de confiança.</p>
            </div>
          </div>
          <button
            className="secondary"
            disabled={busy}
            onClick={() =>
              void post<SafetyShare>(`/matches/${match.id}/safety-share`)
                .then(setShare)
                .catch((failure) => setError((failure as Error).message))
            }
          >
            Criar link de acompanhamento
          </button>
          {share ? (
            <button
              className="text-button"
              onClick={() =>
                void navigator.clipboard
                  .writeText(`${window.location.origin}${share.path}`)
                  .then(() => setMessage("Link copiado."))
              }
            >
              <Copy size={16} /> Copiar link
            </button>
          ) : null}
          <small>
            Dados de localização ficam disponíveis apenas durante a carona.
          </small>
        </section>
      </div>

      {isDriver && companions.length > 1 ? (
        <div className="ride-match-companions">
          <Users size={19} />
          <span>
            <strong>{companions.length} passageiros confirmados</strong>
            <small>
              A corrida inicia automaticamente depois que todos os embarques forem
              validados.
            </small>
          </span>
        </div>
      ) : null}

      {isDriver && next && match.rideStatus === "OPEN" ? (
        <div className="ride-match-primary-action">
          <button disabled={busy} onClick={() => void advanceTrip()}>
            {next.label}
          </button>
        </div>
      ) : null}

      {match.tripStatus === "COMPLETED" ? (
        <div className="ride-match-complete">
          <Star size={22} />
          <div>
            <strong>Carona concluída</strong>
            <small>Use a avaliação abaixo para registrar sua experiência.</small>
          </div>
        </div>
      ) : null}

      <div className="ride-match-peer-id" hidden>
        {peerId}
      </div>
    </section>
  );
}
