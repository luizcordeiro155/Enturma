"use client";

import {
  ArrowLeft,
  Car,
  GraduationCap,
  Home,
  LocateFixed,
  MapPin,
  MessageCircle,
  Navigation,
  Route,
  ShieldCheck,
  Star,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { AcademicEntry } from "@enturma/contracts";
import { api, post } from "@/lib/api";
import { useRideUpdates } from "@/lib/use-ride-updates";
import {
  RideMobilityMap,
  type MapMarker,
  type MapPoint,
} from "./ride-mobility-map";

type MobilityPreference = {
  campusId?: string;
  campusName?: string;
  campusAddress?: string;
  campusLat?: number;
  campusLng?: number;
  homeLabel?: string;
  homeLat?: number;
  homeLng?: number;
  onboardingDone?: boolean;
};
type DriverAvailability = {
  userId: string;
  campusId: string;
  campusName: string;
  direction: Direction;
  seats: number;
  status: "OFFLINE" | "ONLINE" | "REQUESTED" | "BUSY";
  enabled: boolean;
  lat: number;
  lng: number;
  startLabel: string;
  startLat: number;
  startLng: number;
  endLabel: string;
  endLat: number;
  endLng: number;
};
type ActiveRequest = {
  id: string;
  campusId: string;
  campusName: string;
  direction: Direction;
  startLabel: string;
  startLat: number;
  startLng: number;
  endLabel: string;
  endLat: number;
  endLng: number;
  routeDistanceM?: number;
  routeDurationS?: number;
  tripStatus: string;
};
type ActiveMatch = {
  id: string;
  rideId: string;
  requestRideId?: string;
  driverId: string;
  passengerId: string;
  driverName: string;
  passengerName: string;
  status: string;
  tripStatus: string;
  rideStatus: string;
  boardedAt?: string | null;
  direction: Direction;
  campusId: string;
  campusName: string;
  startLabel: string;
  startLat: number;
  startLng: number;
  endLabel: string;
  endLat: number;
  endLng: number;
  passengerStartLabel?: string;
  passengerStartLat?: number;
  passengerStartLng?: number;
  passengerEndLabel?: string;
  passengerEndLat?: number;
  passengerEndLng?: number;
  meetingPoint?: string;
  pickupLat?: number;
  pickupLng?: number;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  plateHint?: string;
};
type Vehicle = {
  brand?: string;
  model?: string;
  color?: string;
  modelYear?: number;
  seats?: number;
  plateHint?: string;
};
type CompletedMatch = ActiveMatch & { reviewed?: boolean };
type MobilityState = {
  preference: MobilityPreference;
  driverAvailability?: DriverAvailability | null;
  activeRequest?: ActiveRequest | null;
  activeMatch?: ActiveMatch | null;
  recentCompleted?: CompletedMatch | null;
  vehicle?: Vehicle | null;
};
type LocationResult = {
  id?: string;
  label: string;
  lat: number;
  lng: number;
  type?: string;
};
type RouteResult = {
  distanceMeters: number;
  durationSeconds: number;
  geometry: [number, number][];
};
type DriverRequest = {
  id: string;
  ownerId: string;
  passengerName: string;
  area: string;
  passengerRating: number;
  passengerReviews: number;
  pickupDistanceKm: number;
  etaMinutes: number;
  detourMinutes: number;
  score: number;
  approxLat: number;
  approxLng: number;
};
type NearbyDriver = {
  id: string;
  lat: number;
  lng: number;
  heading?: number | null;
  distanceKm?: number;
};
type NearbyDriversPayload = {
  radiusKm: number;
  drivers: NearbyDriver[];
};
type PeerLocation = {
  available: boolean;
  lat?: number;
  lng?: number;
  accuracyM?: number;
  updatedAt?: string;
  distanceKm?: number;
  etaMinutes?: number;
};
type Mode = "PASSENGER" | "DRIVER";
type Direction = "TO_CAMPUS" | "FROM_CAMPUS";

function meters(value?: number) {
  if (value == null) return "";
  return value >= 1000
    ? `${(value / 1000).toFixed(1)} km`
    : `${Math.round(value)} m`;
}
function minutes(seconds?: number) {
  if (seconds == null) return "";
  return `${Math.max(1, Math.round(seconds / 60))} min`;
}
function point(lat?: number | null, lng?: number | null): MapPoint | undefined {
  return lat == null || lng == null ? undefined : { lat, lng };
}
function distance(a: MapPoint, b: MapPoint) {
  const r = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return r * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
async function currentPosition(): Promise<{
  point: MapPoint;
  accuracy: number;
  speed?: number;
  heading?: number;
}> {
  if (!navigator.geolocation)
    throw Error("Localização não disponível neste dispositivo.");
  const position = await new Promise<GeolocationPosition>((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 20000,
    }),
  );
  return {
    point: {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    },
    accuracy: Math.round(position.coords.accuracy || 0),
    speed: position.coords.speed ?? undefined,
    heading: position.coords.heading ?? undefined,
  };
}
function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    setOnline(navigator.onLine);
    const yes = () => setOnline(true);
    const no = () => setOnline(false);
    window.addEventListener("online", yes);
    window.addEventListener("offline", no);
    return () => {
      window.removeEventListener("online", yes);
      window.removeEventListener("offline", no);
    };
  }, []);
  return online;
}

function AddressFinder({
  title,
  current,
  onChoose,
  onPickMap,
}: {
  title: string;
  current?: MapPoint;
  onChoose: (value: LocationResult) => void;
  onPickMap: () => void;
}) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<LocationResult[]>([]);
  const [busy, setBusy] = useState(false);
  const request = useRef(0);
  useEffect(() => {
    if (query.trim().length < 3) {
      setItems([]);
      return;
    }
    const id = ++request.current;
    const timer = window.setTimeout(async () => {
      setBusy(true);
      try {
        const params = new URLSearchParams({ q: query.trim() });
        if (current) {
          params.set("lat", String(current.lat));
          params.set("lng", String(current.lng));
        }
        const rows = await api<LocationResult[]>(
          `/rides/map/search?${params}`,
          { cache: "no-store" },
        );
        if (id === request.current) setItems(rows);
      } catch {
        if (id === request.current) setItems([]);
      } finally {
        if (id === request.current) setBusy(false);
      }
    }, 360);
    return () => window.clearTimeout(timer);
  }, [query, current?.lat, current?.lng]);

  return (
    <div className="ride-address-finder">
      <label>
        {title}
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Pesquisar endereço, rua ou bairro"
          autoComplete="off"
        />
      </label>
      <button type="button" className="secondary" onClick={onPickMap}>
        <MapPin size={17} /> Escolher no mapa
      </button>
      {busy ? <small>Pesquisando endereços…</small> : null}
      {items.length ? (
        <div className="ride-address-results">
          {items.map((item, index) => (
            <button
              type="button"
              className="ride-address-result"
              key={item.id ?? `${item.lat}-${item.lng}-${index}`}
              onClick={() => onChoose(item)}
            >
              <MapPin size={17} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Radar({ label }: { label: string }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    let frame = 0;
    const rings = [...node.querySelectorAll<HTMLElement>(".ride-dispatch-ring")];
    const dot = node.querySelector<HTMLElement>(".ride-dispatch-dot");
    const reduced =
      document.documentElement.dataset.reducedMotion === "true" ||
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      if (!reduced) {
        rings.forEach((ring, index) => {
          const p = (t / 2.5 + index / rings.length) % 1;
          ring.style.transform = `translate(-50%,-50%) scale(${0.2 + p * 0.95})`;
          ring.style.opacity = String((1 - p) * 0.65);
        });
        if (dot)
          dot.style.transform = `translate(-50%,-50%) scale(${1 + Math.sin(t * 4) * 0.08})`;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <div className="ride-dispatch-radar" ref={root}>
      {[0, 1, 2].map((i) => (
        <span className="ride-dispatch-ring" key={i} />
      ))}
      <span className="ride-dispatch-dot">
        <LocateFixed size={20} />
      </span>
      <strong>{label}</strong>
    </div>
  );
}

function ArrivalCelebration() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const reduced =
      document.documentElement.dataset.reducedMotion === "true" ||
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const pieces = [...node.querySelectorAll<HTMLElement>("span")];
    const animations = pieces.map((piece, index) =>
      piece.animate(
        [
          { opacity: 0, transform: "translate3d(0,18px,0) scale(.7)" },
          {
            opacity: 1,
            transform: `translate3d(${(index - 2) * 14}px,-10px,0) scale(1)`,
            offset: 0.45,
          },
          {
            opacity: 0,
            transform: `translate3d(${(index - 2) * 23}px,-42px,0) scale(.85)`,
          },
        ],
        {
          duration: 850 + index * 70,
          delay: index * 45,
          easing: "cubic-bezier(.2,.8,.2,1)",
          fill: "both",
        },
      ),
    );
    return () => animations.forEach((animation) => animation.cancel());
  }, []);
  return (
    <div className="ride-arrival-celebration" ref={root} aria-hidden="true">
      {[0, 1, 2, 3, 4].map((value) => (
        <span key={value}>✦</span>
      ))}
    </div>
  );
}

function BottomSheet({
  children,
  expanded = false,
}: {
  children: React.ReactNode;
  expanded?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const drag = useRef<{ y: number; base: number } | null>(null);
  const [snap, setSnap] = useState<"compact" | "medium" | "expanded">(
    expanded ? "expanded" : "medium",
  );
  useEffect(() => {
    if (expanded) setSnap("expanded");
  }, [expanded]);
  function translateFor(value: typeof snap) {
    if (value === "expanded") return 0;
    if (value === "medium") return 34;
    return 68;
  }
  function move(to: typeof snap) {
    setSnap(to);
    const node = ref.current;
    if (!node) return;
    node.animate(
      [
        {
          transform:
            node.style.transform || `translateY(${translateFor(snap)}%)`,
        },
        { transform: `translateY(${translateFor(to)}%)` },
      ],
      {
        duration:
          document.documentElement.dataset.reducedMotion === "true" ? 1 : 320,
        easing: "cubic-bezier(.2,.8,.2,1)",
        fill: "forwards",
      },
    );
  }
  function down(event: ReactPointerEvent<HTMLButtonElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { y: event.clientY, base: translateFor(snap) };
  }
  function dragMove(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!drag.current || !ref.current) return;
    const delta = ((event.clientY - drag.current.y) / window.innerHeight) * 100;
    const value = Math.max(0, Math.min(72, drag.current.base + delta));
    ref.current.style.transform = `translateY(${value}%)`;
  }
  function up(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!drag.current) return;
    const delta = event.clientY - drag.current.y;
    drag.current = null;
    if (delta < -70) move(snap === "compact" ? "medium" : "expanded");
    else if (delta > 70)
      move(snap === "expanded" ? "medium" : "compact");
    else move(snap);
  }
  return (
    <section
      ref={ref}
      className={`ride-bottom-sheet sheet-${snap}`}
      style={{ transform: `translateY(${translateFor(snap)}%)` }}
    >
      <button
        type="button"
        className="ride-sheet-handle"
        aria-label="Arrastar painel da carona"
        onPointerDown={down}
        onPointerMove={dragMove}
        onPointerUp={up}
        onPointerCancel={up}
      >
        <span />
      </button>
      <div className="ride-sheet-content">{children}</div>
    </section>
  );
}

export function RideMobilityExperience() {
  const online = useOnline();
  const [state, setState] = useState<MobilityState>();
  const [me, setMe] = useState("");
  const [campuses, setCampuses] = useState<AcademicEntry[]>([]);
  const [mode, setMode] = useState<Mode>("PASSENGER");
  const [direction, setDirection] = useState<Direction>("TO_CAMPUS");
  const [selected, setSelected] = useState<LocationResult>();
  const [route, setRoute] = useState<RouteResult>();
  const [location, setLocation] = useState<MapPoint>();
  const [accuracy, setAccuracy] = useState(0);
  const [locationLabel, setLocationLabel] = useState("Sua localização");
  const [selectOnMap, setSelectOnMap] = useState(false);
  const [driverRequests, setDriverRequests] = useState<DriverRequest[]>([]);
  const [nearbyDrivers, setNearbyDrivers] = useState<NearbyDriver[]>([]);
  const [searchRadiusKm, setSearchRadiusKm] = useState(5);
  const [peer, setPeer] = useState<PeerLocation>();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [follow, setFollow] = useState(true);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("CHANGE_OF_PLANS");
  const [cancelNote, setCancelNote] = useState("");
  const [driverSeats, setDriverSeats] = useState(1);
  const [reviewTags, setReviewTags] = useState<string[]>([]);
  const locationWatch = useRef<number | undefined>(undefined);
  const lastSent = useRef<{ at: number; point: MapPoint } | null>(null);
  const activeRouteAt = useRef(0);

  const load = useCallback(async () => {
    const [next, user, campusList] = await Promise.all([
      api<MobilityState>("/rides/mobility/state", { cache: "no-store" }),
      api<{ id: string }>("/users/me", { cache: "no-store" }),
      api<AcademicEntry[]>("/academics?kind=CAMPUS"),
    ]);
    setState(next);
    setMe(user.id);
    setCampuses(campusList);
    if (next.activeMatch) {
      setMode(next.activeMatch.driverId === user.id ? "DRIVER" : "PASSENGER");
      setDirection(next.activeMatch.direction);
    } else if (next.driverAvailability?.enabled) {
      setMode("DRIVER");
      setDirection(next.driverAvailability.direction);
    } else if (next.activeRequest) {
      setMode("PASSENGER");
      setDirection(next.activeRequest.direction);
    }
    const actualCenter =
      next.driverAvailability?.enabled
        ? point(next.driverAvailability.lat, next.driverAvailability.lng)
        : next.activeMatch
          ? next.activeMatch.driverId === user.id
            ? point(next.activeMatch.startLat, next.activeMatch.startLng)
            : point(
                next.activeMatch.passengerStartLat,
                next.activeMatch.passengerStartLng,
              )
          : next.activeRequest
            ? point(next.activeRequest.startLat, next.activeRequest.startLng)
            : point(next.preference?.campusLat, next.preference?.campusLng);
    if (actualCenter) setLocation(actualCenter);
    return { next, user: user.id };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load().catch((e) => setError(e.message));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = localStorage.getItem("enturma-ride-mode");
      if (saved === "PASSENGER" || saved === "DRIVER") setMode(saved);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    localStorage.setItem("enturma-ride-mode", mode);
  }, [mode]);

  const live = useRideUpdates(async () => {
    try {
      const { next } = await load();
      if (next.activeRequest)
        await refreshNearbyDrivers(next.activeRequest).catch(() => {});
      else setNearbyDrivers([]);
      if (next.activeMatch)
        await refreshPeerLocation(next.activeMatch.id).catch(() => {});
      if (next.driverAvailability?.enabled && !next.activeMatch)
        await loadDriverRequests();
    } catch (e) {
      setError((e as Error).message);
    }
  });

  const pref = state?.preference;
  const campusPoint = point(pref?.campusLat, pref?.campusLng);
  const activeMatch = state?.activeMatch ?? undefined;
  const activeRequest = state?.activeRequest ?? undefined;
  const availability = state?.driverAvailability ?? undefined;
  const recentCompleted = state?.recentCompleted ?? undefined;
  const activeLocked = !!activeMatch;

  const acquire = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const geo = await currentPosition();
      setLocation(geo.point);
      setAccuracy(geo.accuracy);
      const reverse = await api<LocationResult>(
        `/rides/map/reverse?lat=${geo.point.lat}&lng=${geo.point.lng}`,
        { cache: "no-store" },
      );
      setLocationLabel(reverse.label);
      return { ...geo, label: reverse.label };
    } catch (e) {
      const ge = e as GeolocationPositionError;
      setError(
        ge?.code === 1
          ? "Permita o acesso à localização para usar a Carona."
          : (e as Error).message ||
              "Não foi possível obter sua localização.",
      );
      throw e;
    } finally {
      setBusy(false);
    }
  }, []);

  const calculateRoute = useCallback(
    async (chosen: LocationResult, currentDirection = direction) => {
      if (!campusPoint) {
        setError("Seu campus ainda não possui localização configurada.");
        return;
      }
      const start =
        currentDirection === "TO_CAMPUS"
          ? { lat: chosen.lat, lng: chosen.lng }
          : campusPoint;
      const end =
        currentDirection === "TO_CAMPUS"
          ? campusPoint
          : { lat: chosen.lat, lng: chosen.lng };
      setBusy(true);
      setError("");
      try {
        const result = await post<RouteResult>("/rides/map/route", {
          points: [start, end],
        });
        setRoute(result);
        setSelected(chosen);
        setLocation(start);
        setFollow(true);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy(false);
      }
    },
    [campusPoint?.lat, campusPoint?.lng, direction],
  );

  async function useCurrentPlace() {
    const current = await acquire();
    await calculateRoute(
      {
        label: current.label,
        lat: current.point.lat,
        lng: current.point.lng,
      },
      direction,
    );
  }

  async function confirmMapPoint() {
    if (!location) return;
    setBusy(true);
    try {
      const value = await api<LocationResult>(
        `/rides/map/reverse?lat=${location.lat}&lng=${location.lng}`,
        { cache: "no-store" },
      );
      setSelectOnMap(false);
      await calculateRoute(value);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function refreshNearbyDrivers(request: ActiveRequest) {
    const params = new URLSearchParams({
      campusId: request.campusId,
      direction: request.direction,
    });
    const payload = await api<NearbyDriversPayload>(
      `/rides/dispatch/nearby-drivers?${params}`,
      { cache: "no-store" },
    );
    setNearbyDrivers(payload.drivers);
    setSearchRadiusKm(payload.radiusKm);
  }

  async function refreshPeerLocation(matchId: string) {
    const next = await api<PeerLocation>(`/matches/${matchId}/location`, {
      cache: "no-store",
    });
    setPeer(next);
  }

  async function startPassenger() {
    if (!pref?.campusId || !campusPoint || !selected || !route) return;
    const start =
      direction === "TO_CAMPUS"
        ? { label: selected.label, lat: selected.lat, lng: selected.lng }
        : {
            label: pref.campusAddress || pref.campusName || "Campus",
            lat: campusPoint.lat,
            lng: campusPoint.lng,
          };
    const end =
      direction === "TO_CAMPUS"
        ? {
            label: pref.campusAddress || pref.campusName || "Campus",
            lat: campusPoint.lat,
            lng: campusPoint.lng,
          }
        : { label: selected.label, lat: selected.lat, lng: selected.lng };
    setBusy(true);
    try {
      await post("/rides/dispatch/search", {
        campusId: pref.campusId,
        direction,
        startLabel: start.label,
        startLat: start.lat,
        startLng: start.lng,
        endLabel: end.label,
        endLat: end.lat,
        endLng: end.lng,
        routeDistanceMeters: route.distanceMeters,
        routeDurationSeconds: route.durationSeconds,
      });
      setNotice("Buscando motoristas compatíveis com sua rota.");
      const { next } = await load();
      if (next.activeRequest) await refreshNearbyDrivers(next.activeRequest);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function loadDriverRequests() {
    try {
      setDriverRequests(
        await api<DriverRequest[]>("/rides/driver/requests", {
          cache: "no-store",
        }),
      );
    } catch {
      setDriverRequests([]);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (mode !== "DRIVER" || !availability?.enabled || activeMatch) {
        setDriverRequests([]);
        return;
      }
      void loadDriverRequests();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [mode, availability?.enabled, activeMatch?.id]);

  async function saveHome() {
    if (!pref?.campusId || !selected) return;
    try {
      await api("/rides/mobility/preferences", {
        method: "PUT",
        body: JSON.stringify({
          campusId: pref.campusId,
          homeLabel: selected.label,
          homeLat: selected.lat,
          homeLng: selected.lng,
          onboardingDone: true,
        }),
      });
      setNotice("Casa salva para as próximas caronas.");
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function submitCompletedReview(rating: number) {
    const completed = state?.recentCompleted;
    if (!completed) return;
    setBusy(true);
    try {
      await post(`/matches/${completed.id}/review`, {
        rating,
        punctuality: rating,
        communication: rating,
        respect: rating,
        responsible: completed.passengerId === me ? rating >= 4 : null,
        comment: reviewTags.join(" · "),
      });
      setNotice("Avaliação registrada. Obrigado por ajudar a comunidade.");
      setReviewTags([]);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function startDriver() {
    if (!pref?.campusId || !campusPoint) return;
    if (!state?.vehicle?.brand) {
      setError(
        "Cadastre seu veículo no painel de caronas antes de ficar disponível.",
      );
      return;
    }
    setBusy(true);
    try {
      const current = await acquire();
      let target = selected;
      if (direction === "TO_CAMPUS") {
        target = {
          label: current.label,
          lat: current.point.lat,
          lng: current.point.lng,
        };
      } else if (!target && pref.homeLat != null && pref.homeLng != null) {
        target = {
          label: pref.homeLabel || "Casa",
          lat: pref.homeLat,
          lng: pref.homeLng,
        };
      }
      if (!target) {
        setError("Escolha para onde você vai depois de sair do campus.");
        return;
      }
      const start =
        direction === "TO_CAMPUS"
          ? target
          : {
              label: pref.campusAddress || pref.campusName || "Campus",
              lat: campusPoint.lat,
              lng: campusPoint.lng,
            };
      const end =
        direction === "TO_CAMPUS"
          ? {
              label: pref.campusAddress || pref.campusName || "Campus",
              lat: campusPoint.lat,
              lng: campusPoint.lng,
            }
          : target;
      await api("/rides/driver/availability", {
        method: "PUT",
        body: JSON.stringify({
          campusId: pref.campusId,
          direction,
          seats: driverSeats,
          startLabel: start.label,
          startLat: start.lat,
          startLng: start.lng,
          endLabel: end.label,
          endLat: end.lat,
          endLng: end.lng,
          lat: current.point.lat,
          lng: current.point.lng,
          accuracyMeters: current.accuracy,
        }),
      });
      setNotice("Você está online. Buscando estudantes no seu caminho.");
      await load();
      await loadDriverRequests();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function stopDriver() {
    await api("/rides/driver/availability", { method: "DELETE" });
    setDriverRequests([]);
    await load();
  }
  async function acceptDriverRequest(request: DriverRequest) {
    setBusy(true);
    try {
      await post(`/rides/driver/requests/${request.id}/accept`);
      setNotice("Corrida aceita. Vá até o ponto de embarque.");
      await load();
    } catch (e) {
      setError((e as Error).message);
      await loadDriverRequests();
    } finally {
      setBusy(false);
    }
  }
  async function rejectDriverRequest(request: DriverRequest) {
    await post(`/rides/driver/requests/${request.id}/reject`);
    setDriverRequests((rows) =>
      rows.filter((row) => row.id !== request.id),
    );
  }

  async function cancelCurrent() {
    setBusy(true);
    try {
      if (activeMatch) {
        await post(`/matches/${activeMatch.id}/cancel-reason`, {
          reason: cancelReason,
          note: cancelNote,
        });
      } else if (activeRequest) {
        await post("/rides/dispatch/cancel", {
          reason: cancelReason,
          note: cancelNote,
        });
      }
      setCancelOpen(false);
      setCancelNote("");
      setRoute(undefined);
      setSelected(undefined);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const shouldTrack =
      (availability?.enabled && mode === "DRIVER" && !activeMatch) ||
      !!activeMatch;
    if (!shouldTrack || !navigator.geolocation) {
      if (locationWatch.current != null) {
        navigator.geolocation.clearWatch(locationWatch.current);
        locationWatch.current = undefined;
      }
      return;
    }
    locationWatch.current = navigator.geolocation.watchPosition(
      (position) => {
        const next = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        if (!Number.isFinite(next.lat) || !Number.isFinite(next.lng)) return;
        setLocation(next);
        setAccuracy(Math.round(position.coords.accuracy || 0));
        const now = Date.now();
        const previous = lastSent.current;
        if (
          previous &&
          now - previous.at < 5000 &&
          distance(previous.point, next) < 0.015
        )
          return;
        lastSent.current = { at: now, point: next };
        if (activeMatch) {
          void api(`/matches/${activeMatch.id}/location`, {
            method: "PUT",
            body: JSON.stringify({
              lat: next.lat,
              lng: next.lng,
              accuracyMeters: Math.round(position.coords.accuracy || 0),
            }),
          }).catch(() => {});
        } else if (availability?.enabled) {
          void api("/rides/driver/availability/location", {
            method: "PUT",
            body: JSON.stringify({
              lat: next.lat,
              lng: next.lng,
              accuracyMeters: Math.round(position.coords.accuracy || 0),
              speedMps: position.coords.speed,
              heading: position.coords.heading,
            }),
          }).catch(() => {});
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
    return () => {
      if (locationWatch.current != null) {
        navigator.geolocation.clearWatch(locationWatch.current);
        locationWatch.current = undefined;
      }
    };
  }, [availability?.enabled, activeMatch?.id, mode]);

  useEffect(() => {
    if (!activeMatch) {
      const timer = window.setTimeout(() => setPeer(undefined), 0);
      return () => window.clearTimeout(timer);
    }
    const first = window.setTimeout(
      () => void refreshPeerLocation(activeMatch.id).catch(() => {}),
      0,
    );
    if (live) return () => window.clearTimeout(first);
    const fallback = window.setInterval(
      () => void refreshPeerLocation(activeMatch.id).catch(() => {}),
      15000,
    );
    return () => {
      window.clearTimeout(first);
      window.clearInterval(fallback);
    };
  }, [activeMatch?.id, live]);

  useEffect(() => {
    if (!activeRequest) {
      const timer = window.setTimeout(() => setNearbyDrivers([]), 0);
      return () => window.clearTimeout(timer);
    }
    const first = window.setTimeout(
      () => void refreshNearbyDrivers(activeRequest).catch(() => {}),
      0,
    );
    if (live) return () => window.clearTimeout(first);
    const fallback = window.setInterval(
      () => void refreshNearbyDrivers(activeRequest).catch(() => {}),
      15000,
    );
    return () => {
      window.clearTimeout(first);
      window.clearInterval(fallback);
    };
  }, [activeRequest?.id, live]);

  useEffect(() => {
    if (!activeMatch || mode !== "PASSENGER") return;
    if (!["ARRIVING", "WAITING_PASSENGER"].includes(activeMatch.tripStatus)) return;
    if (!("vibrate" in navigator)) return;
    navigator.vibrate(activeMatch.tripStatus === "WAITING_PASSENGER" ? [180, 100, 180] : 120);
  }, [activeMatch?.tripStatus, activeMatch?.id, mode]);

  useEffect(() => {
    if (
      !activeMatch ||
      !location ||
      !peer?.available ||
      peer.lat == null ||
      peer.lng == null
    )
      return;
    const now = Date.now();
    if (now - activeRouteAt.current < 14000) return;
    activeRouteAt.current = now;
    const driverPoint =
      activeMatch.driverId === me
        ? location
        : { lat: peer.lat, lng: peer.lng };
    const pickup = point(activeMatch.pickupLat, activeMatch.pickupLng);
    const passengerEnd = point(
      activeMatch.passengerEndLat,
      activeMatch.passengerEndLng,
    );
    let points: MapPoint[] = [];
    if (
      ["DRIVER_ON_THE_WAY", "ARRIVING", "WAITING_PASSENGER"].includes(
        activeMatch.tripStatus,
      ) &&
      pickup
    )
      points = [driverPoint, pickup];
    else if (["IN_PROGRESS", "ARRIVED"].includes(activeMatch.tripStatus))
      points = [
        driverPoint,
        passengerEnd ?? {
          lat: activeMatch.endLat,
          lng: activeMatch.endLng,
        },
      ];
    if (points.length < 2) return;
    void post<RouteResult>("/rides/map/route", { points })
      .then(setRoute)
      .catch(() => {});
  }, [
    activeMatch?.id,
    activeMatch?.tripStatus,
    peer?.lat,
    peer?.lng,
    me,
    location?.lat,
    location?.lng,
  ]);

  const routeGeometry = useMemo(
    () => route?.geometry.map(([lat, lng]) => ({ lat, lng })) ?? [],
    [route],
  );
  const markers = useMemo<MapMarker[]>(() => {
    const rows: MapMarker[] = [];
    if (location)
      rows.push({ id: "me", point: location, kind: "me", label: "Você" });
    if (campusPoint)
      rows.push({
        id: "campus",
        point: campusPoint,
        kind: "campus",
        label: pref?.campusName || "Campus",
      });
    if (selected)
      rows.push({
        id: "selected",
        point: selected,
        kind: direction === "TO_CAMPUS" ? "pickup" : "destination",
        label: direction === "TO_CAMPUS" ? "Embarque" : "Destino",
      });
    if (
      peer?.available &&
      peer.lat != null &&
      peer.lng != null &&
      activeMatch
    )
      rows.push({
        id: "peer",
        point: { lat: peer.lat, lng: peer.lng },
        kind: activeMatch.driverId === me ? "passenger" : "driver",
        label:
          activeMatch.driverId === me
            ? activeMatch.passengerName
            : activeMatch.driverName,
      });
    if (mode === "DRIVER" && !activeMatch)
      driverRequests.forEach((request) =>
        rows.push({
          id: `request-${request.id}`,
          point: { lat: request.approxLat, lng: request.approxLng },
          kind: "passenger",
          label: request.area,
        }),
      );
    if (mode === "PASSENGER" && activeRequest && !activeMatch)
      nearbyDrivers.forEach((driver) =>
        rows.push({
          id: driver.id,
          point: { lat: driver.lat, lng: driver.lng },
          kind: "driver",
          heading: driver.heading,
          label: "Motorista disponível",
        }),
      );
    return rows;
  }, [
    location,
    campusPoint?.lat,
    campusPoint?.lng,
    selected?.lat,
    selected?.lng,
    peer?.lat,
    peer?.lng,
    activeMatch?.id,
    mode,
    driverRequests,
    nearbyDrivers,
    activeRequest?.id,
  ]);
  const mapCenter =
    follow && peer?.available && peer.lat != null && peer.lng != null
      ? { lat: peer.lat, lng: peer.lng }
      : location ?? campusPoint;

  async function advanceTrip(status: string) {
    if (!activeMatch) return;
    setBusy(true);
    try {
      await post(`/rides/${activeMatch.rideId}/status`, { status });
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const nextStatus: Record<string, [string, string] | undefined> = {
    DRIVER_ON_THE_WAY: ["ARRIVING", "Estou chegando"],
    ARRIVING: ["WAITING_PASSENGER", "Cheguei ao ponto"],
    WAITING_PASSENGER: ["IN_PROGRESS", "Iniciar carona"],
    IN_PROGRESS: ["ARRIVED", "Chegamos ao destino"],
    ARRIVED: ["COMPLETED", "Finalizar carona"],
  };

  if (!state)
    return (
      <div className="ride-mobility-boot">
        <Radar label="Preparando sua mobilidade…" />
      </div>
    );

  return (
    <div className="ride-mobility-app">
      {mapCenter ? (
        <RideMobilityMap
          center={mapCenter}
          markers={markers}
          route={routeGeometry}
          selecting={selectOnMap}
          follow={follow}
          onInteraction={() => setFollow(false)}
          onCenterChange={(value) => {
            if (selectOnMap) setLocation(value);
          }}
        />
      ) : (
        <div className="ride-map-empty">
          <LocateFixed size={34} />
          <strong>Selecione seu campus para preparar o mapa</strong>
        </div>
      )}

      <div className="ride-map-top">
        <Link href="/home" className="ride-circle-button" aria-label="Voltar">
          <ArrowLeft size={20} />
        </Link>
        <div className="ride-mode-switch" aria-label="Modo da carona">
          <button
            type="button"
            aria-pressed={mode === "PASSENGER"}
            disabled={activeLocked}
            onClick={() => setMode("PASSENGER")}
          >
            <Users size={16} /> Passageiro
          </button>
          <button
            type="button"
            aria-pressed={mode === "DRIVER"}
            disabled={activeLocked}
            onClick={() => setMode("DRIVER")}
          >
            <Car size={16} /> Motorista
          </button>
        </div>
        <button
          type="button"
          className="ride-circle-button"
          aria-label="Recentralizar mapa"
          onClick={() => {
            setFollow(true);
            void acquire().catch(() => {});
          }}
        >
          <LocateFixed size={20} />
        </button>
      </div>

      {!online ? (
        <div className="ride-connection-state error" role="status">
          Sem conexão · sua corrida será sincronizada quando a internet voltar.
        </div>
      ) : !live ? (
        <div className="ride-connection-state" role="status">
          Reconectando em tempo real…
        </div>
      ) : null}

      {!follow ? (
        <button
          type="button"
          className="ride-recenter"
          onClick={() => setFollow(true)}
        >
          <LocateFixed size={17} /> Recentralizar
        </button>
      ) : null}

      {selectOnMap ? (
        <div className="ride-map-picker-actions">
          <button
            type="button"
            className="secondary"
            onClick={() => setSelectOnMap(false)}
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void confirmMapPoint()}
          >
            Confirmar local
          </button>
        </div>
      ) : (
        <BottomSheet expanded={!!route || !!driverRequests.length || !!activeMatch}>
          {error ? (
            <div className="feedback error" role="alert">
              {error}
            </div>
          ) : null}
          {notice ? (
            <div className="feedback success" role="status">
              {notice}
            </div>
          ) : null}

          {!pref?.campusId ? (
            <div className="ride-campus-onboarding">
              <GraduationCap size={28} />
              <h2>Qual é o seu campus?</h2>
              <p>Ele será o ponto fixo das suas caronas de ida e volta.</p>
              <select
                defaultValue=""
                onChange={async (event) => {
                  if (!event.target.value) return;
                  try {
                    await api("/rides/mobility/preferences", {
                      method: "PUT",
                      body: JSON.stringify({
                        campusId: event.target.value,
                        onboardingDone: true,
                      }),
                    });
                    await load();
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                <option value="">Selecione seu campus</option>
                {campuses.map((campus) => (
                  <option value={campus.id} key={campus.id}>
                    {campus.name}
                  </option>
                ))}
              </select>
            </div>
          ) : activeMatch ? (
            <div className="ride-active-sheet">
              <div className="ride-sheet-heading">
                <div>
                  <small>
                    {direction === "TO_CAMPUS"
                      ? "Indo para a faculdade"
                      : "Voltando para casa"}
                  </small>
                  <h2>
                    {mode === "PASSENGER"
                      ? activeMatch.tripStatus === "WAITING_PASSENGER"
                        ? "Motorista chegou"
                        : activeMatch.tripStatus === "IN_PROGRESS"
                          ? "Carona em andamento"
                          : `${activeMatch.driverName} está a caminho`
                      : activeMatch.tripStatus === "IN_PROGRESS"
                        ? "Carona em andamento"
                        : `Carona com ${activeMatch.passengerName}`}
                  </h2>
                </div>
                {peer?.etaMinutes ? (
                  <strong className="ride-eta">{peer.etaMinutes} min</strong>
                ) : null}
              </div>

              <div className="ride-person-summary">
                <div className="ride-person-avatar">
                  {mode === "PASSENGER" ? <Car /> : <Users />}
                </div>
                <div>
                  <strong>
                    {mode === "PASSENGER"
                      ? activeMatch.driverName
                      : activeMatch.passengerName}
                  </strong>
                  {mode === "PASSENGER" && activeMatch.vehicleModel ? (
                    <small>
                      {activeMatch.vehicleBrand} {activeMatch.vehicleModel} ·{" "}
                      {activeMatch.vehicleColor}
                      {activeMatch.plateHint
                        ? ` · ${activeMatch.plateHint}`
                        : ""}
                    </small>
                  ) : null}
                </div>
              </div>

              <div className="ride-trip-facts">
                {peer?.distanceKm != null ? (
                  <span>
                    <Navigation size={16} /> {peer.distanceKm} km
                  </span>
                ) : null}
                {route ? (
                  <>
                    <span>
                      <Route size={16} /> {meters(route.distanceMeters)}
                    </span>
                    <span>{minutes(route.durationSeconds)}</span>
                  </>
                ) : null}
              </div>

              <div className="ride-active-actions">
                <Link
                  href={`/caronas/matches?match=${activeMatch.id}`}
                  className="button secondary"
                >
                  <MessageCircle size={17} /> Mensagem
                </Link>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    const destination =
                      activeMatch.direction === "TO_CAMPUS"
                        ? point(activeMatch.endLat, activeMatch.endLng)
                        : point(
                            activeMatch.passengerEndLat,
                            activeMatch.passengerEndLng,
                          );
                    if (!destination) return;
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`,
                      "_blank",
                      "noopener,noreferrer",
                    );
                  }}
                >
                  <Navigation size={17} /> Abrir navegação
                </button>
                <button
                  type="button"
                  className="secondary danger-action"
                  onClick={() => setCancelOpen(true)}
                >
                  Cancelar
                </button>
              </div>

              {mode === "DRIVER" &&
              activeMatch.tripStatus === "WAITING_PASSENGER" &&
              !activeMatch.boardedAt ? (
                <Link
                  href={`/caronas/matches?match=${activeMatch.id}`}
                  className="button ride-primary-action"
                >
                  Confirmar embarque com PIN
                </Link>
              ) : mode === "DRIVER" && nextStatus[activeMatch.tripStatus] ? (
                <button
                  type="button"
                  className="ride-primary-action"
                  disabled={busy}
                  onClick={() =>
                    void advanceTrip(nextStatus[activeMatch.tripStatus]![0])
                  }
                >
                  {nextStatus[activeMatch.tripStatus]![1]}
                </button>
              ) : null}

              <div className="ride-safety-strip">
                <ShieldCheck size={17} />
                <span>
                  PIN de embarque, chamada e segurança continuam no painel da
                  carona.
                </span>
                <Link href={`/caronas/matches?match=${activeMatch.id}`}>
                  Abrir
                </Link>
              </div>
            </div>
          ) : recentCompleted && !recentCompleted.reviewed ? (
            <div className="ride-completed-sheet">
              <ArrivalCelebration />
              <small>Carona concluída</small>
              <h2>Você chegou 🎉</h2>
              <p>
                Avalie {recentCompleted.driverId === me
                  ? recentCompleted.passengerName
                  : recentCompleted.driverName} para manter a comunidade útil.
              </p>
              <div className="ride-review-stars" aria-label="Avaliação">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    type="button"
                    key={rating}
                    disabled={busy}
                    aria-label={`${rating} estrela${rating > 1 ? "s" : ""}`}
                    onClick={() => void submitCompletedReview(rating)}
                  >
                    <Star size={24} fill="currentColor" /> {rating}
                  </button>
                ))}
              </div>
              <div className="ride-review-tags">
                {["Pontual", "Educado", "Boa direção", "Comunicação boa"].map(
                  (tag) => (
                    <button
                      type="button"
                      className="secondary"
                      aria-pressed={reviewTags.includes(tag)}
                      key={tag}
                      onClick={() =>
                        setReviewTags((current) =>
                          current.includes(tag)
                            ? current.filter((item) => item !== tag)
                            : [...current, tag],
                        )
                      }
                    >
                      {tag}
                    </button>
                  ),
                )}
              </div>
            </div>
          ) : mode === "PASSENGER" ? (
            <div className="ride-passenger-flow">
              {activeRequest ? (
                <>
                  <Radar label="Procurando motoristas próximos…" />
                  <p className="ride-search-copy">
                    Priorizando motoristas no mesmo campus, sentido e rota.
                    Busca atual em até {searchRadiusKm} km, ampliada
                    progressivamente sem relaxar a direção da viagem.
                  </p>
                  <button
                    type="button"
                    className="secondary danger-action"
                    onClick={() => setCancelOpen(true)}
                  >
                    Cancelar busca
                  </button>
                </>
              ) : (
                <>
                  <div className="ride-sheet-heading">
                    <div>
                      <small>Carona universitária</small>
                      <h2>Como você vai hoje?</h2>
                    </div>
                    <span className="ride-campus-mini">
                      <GraduationCap size={16} /> {pref.campusName}
                    </span>
                  </div>
                  <div className="ride-direction-grid">
                    <button
                      type="button"
                      aria-pressed={direction === "TO_CAMPUS"}
                      onClick={() => {
                        setDirection("TO_CAMPUS");
                        setSelected(undefined);
                        setRoute(undefined);
                      }}
                    >
                      <GraduationCap size={23} />
                      <span>
                        <strong>Indo para a faculdade</strong>
                        <small>Seu campus é o destino fixo</small>
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-pressed={direction === "FROM_CAMPUS"}
                      onClick={() => {
                        setDirection("FROM_CAMPUS");
                        setSelected(undefined);
                        setRoute(undefined);
                      }}
                    >
                      <Home size={23} />
                      <span>
                        <strong>Voltando para casa</strong>
                        <small>Seu campus é o ponto de partida</small>
                      </span>
                    </button>
                  </div>

                  {!selected ? (
                    <>
                      <button
                        type="button"
                        className="ride-location-current"
                        disabled={busy}
                        onClick={() => void useCurrentPlace()}
                      >
                        <LocateFixed size={20} />
                        <span>
                          <strong>Usar minha localização atual</strong>
                          <small>{locationLabel}</small>
                        </span>
                      </button>
                      {direction === "FROM_CAMPUS" &&
                      pref.homeLat != null &&
                      pref.homeLng != null ? (
                        <button
                          type="button"
                          className="ride-location-current"
                          onClick={() =>
                            void calculateRoute({
                              label: pref.homeLabel || "Casa",
                              lat: pref.homeLat!,
                              lng: pref.homeLng!,
                            })
                          }
                        >
                          <Home size={20} />
                          <span>
                            <strong>Casa</strong>
                            <small>{pref.homeLabel}</small>
                          </span>
                        </button>
                      ) : null}
                      <AddressFinder
                        title={
                          direction === "TO_CAMPUS"
                            ? "Onde você quer ser buscado?"
                            : "Para onde você vai?"
                        }
                        current={location}
                        onChoose={(value) => void calculateRoute(value)}
                        onPickMap={() => setSelectOnMap(true)}
                      />
                    </>
                  ) : (
                    <>
                      <div className="ride-route-summary">
                        <div>
                          <MapPin size={18} />
                          <span>
                            <small>Origem</small>
                            <strong>
                              {direction === "TO_CAMPUS"
                                ? selected.label
                                : pref.campusName}
                            </strong>
                          </span>
                        </div>
                        <div className="ride-route-line-mini" />
                        <div>
                          <GraduationCap size={18} />
                          <span>
                            <small>Destino</small>
                            <strong>
                              {direction === "TO_CAMPUS"
                                ? pref.campusName
                                : selected.label}
                            </strong>
                          </span>
                        </div>
                        {route ? (
                          <div className="ride-route-metrics">
                            <span>{meters(route.distanceMeters)}</span>
                            <span>{minutes(route.durationSeconds)}</span>
                          </div>
                        ) : null}
                      </div>
                      {direction === "FROM_CAMPUS" ? (
                        <button
                          type="button"
                          className="text-button ride-save-home"
                          onClick={() => void saveHome()}
                        >
                          <Home size={16} /> Salvar este destino como casa
                        </button>
                      ) : null}
                      <div className="ride-route-buttons">
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => {
                            setSelected(undefined);
                            setRoute(undefined);
                          }}
                        >
                          Alterar local
                        </button>
                        <button
                          type="button"
                          className="ride-primary-action"
                          disabled={busy || !route}
                          onClick={() => void startPassenger()}
                        >
                          Buscar carona
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="ride-driver-flow">
              {availability?.enabled ? (
                <>
                  <div className="ride-driver-online">
                    <span className="ride-online-dot" />
                    <div>
                      <small>ONLINE</small>
                      <h2>Buscando estudantes no seu caminho</h2>
                    </div>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => void stopDriver()}
                    >
                      Ficar offline
                    </button>
                  </div>
                  {driverRequests.length ? (
                    <div className="ride-request-stack">
                      {driverRequests.map((request) => (
                        <article className="ride-driver-request" key={request.id}>
                          <div className="ride-request-person">
                            <span className="ride-person-avatar">
                              <Users size={20} />
                            </span>
                            <span>
                              <strong>{request.passengerName}</strong>
                              <small>
                                {request.passengerRating > 0
                                  ? `★ ${Number(request.passengerRating).toFixed(1)} · `
                                  : ""}
                                {request.area}
                              </small>
                            </span>
                          </div>
                          <div className="ride-request-facts">
                            <span>{request.etaMinutes} min até o estudante</span>
                            <span>+{request.detourMinutes} min de desvio</span>
                            <span>{request.pickupDistanceKm} km</span>
                          </div>
                          <div className="ride-request-actions">
                            <button
                              type="button"
                              className="secondary"
                              onClick={() => void rejectDriverRequest(request)}
                            >
                              Recusar
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void acceptDriverRequest(request)}
                            >
                              Aceitar carona
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <Radar label="Procurando estudantes…" />
                  )}
                </>
              ) : (
                <>
                  <div className="ride-sheet-heading">
                    <div>
                      <small>Modo motorista</small>
                      <h2>Você está offline</h2>
                    </div>
                    <Car size={28} />
                  </div>
                  <div className="ride-direction-grid">
                    <button
                      type="button"
                      aria-pressed={direction === "TO_CAMPUS"}
                      onClick={() => {
                        setDirection("TO_CAMPUS");
                        setSelected(undefined);
                        setRoute(undefined);
                      }}
                    >
                      <GraduationCap size={23} />
                      <span>
                        <strong>Indo para a faculdade</strong>
                        <small>Encontre estudantes no caminho</small>
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-pressed={direction === "FROM_CAMPUS"}
                      onClick={() => {
                        setDirection("FROM_CAMPUS");
                        setSelected(undefined);
                        setRoute(undefined);
                      }}
                    >
                      <Home size={23} />
                      <span>
                        <strong>Voltando da faculdade</strong>
                        <small>Leve estudantes na mesma direção</small>
                      </span>
                    </button>
                  </div>
                  <label className="ride-seat-control">
                    Vagas disponíveis
                    <select
                      value={driverSeats}
                      onChange={(event) =>
                        setDriverSeats(Number(event.target.value))
                      }
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((value) => (
                        <option value={value} key={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>
                  {direction === "FROM_CAMPUS" && !selected ? (
                    <AddressFinder
                      title="Para onde você está indo?"
                      current={location}
                      onChoose={(value) => {
                        setSelected(value);
                        void calculateRoute(value, "FROM_CAMPUS");
                      }}
                      onPickMap={() => setSelectOnMap(true)}
                    />
                  ) : null}
                  {!state.vehicle?.brand ? (
                    <div className="ride-vehicle-needed">
                      <Car size={20} />
                      <span>
                        <strong>Cadastre seu veículo primeiro</strong>
                        <small>
                          Modelo, cor e vagas aparecem ao passageiro após o
                          match.
                        </small>
                      </span>
                      <Link href="/caronas/configuracoes">Configurar</Link>
                    </div>
                  ) : (
                    <div className="ride-vehicle-ready">
                      <Car size={18} />
                      <span>
                        {state.vehicle.brand} {state.vehicle.model} ·{" "}
                        {state.vehicle.color}
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    className="ride-primary-action"
                    disabled={
                      busy ||
                      !state.vehicle?.brand ||
                      (direction === "FROM_CAMPUS" &&
                        !selected &&
                        pref.homeLat == null)
                    }
                    onClick={() => void startDriver()}
                  >
                    Ficar disponível
                  </button>
                </>
              )}
            </div>
          )}
        </BottomSheet>
      )}

      {cancelOpen ? (
        <div className="ride-cancel-backdrop" role="dialog" aria-modal="true">
          <section className="ride-cancel-dialog">
            <button
              type="button"
              className="ride-dialog-close"
              aria-label="Fechar"
              onClick={() => setCancelOpen(false)}
            >
              <X size={20} />
            </button>
            <h2>Cancelar carona?</h2>
            <p>
              Escolha o motivo. Isso ajuda a evitar abuso e melhorar o sistema.
            </p>
            <label>
              Motivo
              <select
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
              >
                <option value="CHANGE_OF_PLANS">Mudança de planos</option>
                <option value="DRIVER_DELAY">Motorista demorando</option>
                <option value="NO_SHOW">Passageiro não apareceu</option>
                <option value="VEHICLE_PROBLEM">Problema com veículo</option>
                <option value="EMERGENCY">Emergência</option>
                <option value="OTHER">Outro</option>
              </select>
            </label>
            <label>
              Detalhes opcionais
              <textarea
                maxLength={300}
                value={cancelNote}
                onChange={(event) => setCancelNote(event.target.value)}
              />
            </label>
            <div className="ride-request-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setCancelOpen(false)}
              >
                Voltar
              </button>
              <button
                type="button"
                className="danger-action"
                disabled={busy}
                onClick={() => void cancelCurrent()}
              >
                Confirmar cancelamento
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
